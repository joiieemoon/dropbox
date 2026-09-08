import { useEffect, useRef, useState } from "react";
import type { ActionInfo, Operation } from "@syncfusion/ej2-documenteditor";
import {
  get,
  onChildAdded,
  onDisconnect,
  onValue,
  push,
  ref,
  remove,
  runTransaction,
  set,
} from "firebase/database";
import { getRtdb } from "../../../../firebase";
import { generateUUID } from "../../../../utils/uuid";

export interface CollaborativeEditingHandlerLike {
  sendActionToServer: (operations: Operation[]) => void;
  applyRemoteAction: (action: string, data: string | ActionInfo) => void;
  updateRoomInfo: (roomName: string, version: number, serviceUrl: string) => void;
}

export interface LiveCollaborator {
  id: string;
  name: string;
  color?: string;
  active: boolean;
  lastSeen: number;
}

interface UseCollaborativeEditingOptions {
  enabled: boolean;
  documentId?: string;
  userId?: string;
  userName?: string;
  /** Version of the SFDT snapshot currently loaded in the editor. */
  baseVersion?: number;
  handler?: CollaborativeEditingHandlerLike | null;
  /** Called when the operation log has a gap and the editor must reload SFDT. */
  onSnapshotReloadRequired?: () => void;
}

interface UseCollaborativeEditingResult {
  isLive: boolean;
  users: LiveCollaborator[];
  error: string | null;
  compactionNeeded: boolean;
}

/** RTDB rejects undefined fields; Syncfusion operations use them extensively. */
function removeUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== undefined)
      .map((item) => removeUndefined(item)) as T;
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).flatMap(([key, item]) => 
        item === undefined ? [] : [[key, removeUndefined(item)]],
      ),
    ) as T;
  }
  return value;
}

/**
 * RTDB transport for Syncfusion's collaborative editing handler.
 *
 * The caller owns loading the matching SFDT snapshot before enabling this
 * hook. This module only brokers ordered OT operations and presence.
 */
export function  useCollaborativeEditing({
  enabled,
  documentId,
  userId,
  userName,
  baseVersion = 0,
  handler,
  onSnapshotReloadRequired,
}: UseCollaborativeEditingOptions): UseCollaborativeEditingResult {
  const sessionId = useRef(generateUUID()).current;
  const [isLive, setIsLive] = useState(false);
  const [users, setUsers] = useState<LiveCollaborator[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [compactionNeeded, setCompactionNeeded] = useState(false);

  useEffect(() => {
    setIsLive(false);
    setUsers([]);
    setError(null);
    setCompactionNeeded(false);
    if (!enabled || !documentId || !userId || !userName || !handler) return;

    let database;
    try {
      database = getRtdb();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "RTDB is not configured.");
      return;
    }

    let disposed = false;
    let ready = false;
    let lastAppliedVersion = baseVersion;
    let applying = false;
    const pending = new Map<number, { action: string; data: ActionInfo; local: boolean }>();
    const originalSendAction = handler.sendActionToServer;
    const root = `documents/${documentId}`;
    const seqRef = ref(database, `${root}/meta/seq`);
    const opsRef = ref(database, `${root}/ops`);
    const presenceRef = ref(database, `${root}/presence/${userId}`);

    // Safety net for a lost operation (e.g. a client that incremented the
    // sequence but crashed before writing its op). If the next expected version
    // never appears, tell the caller to reload the compacted SFDT snapshot so
    // this editor re-bases instead of stalling forever.
    let gapWatchdog: number | undefined;
    const armGapWatchdog = () => {
      if (gapWatchdog !== undefined || disposed) return;
      gapWatchdog = window.setTimeout(() => {
        gapWatchdog = undefined;
        if (disposed) return;
        if (pending.size > 0 && !pending.has(lastAppliedVersion + 1)) {
          pending.clear();
          onSnapshotReloadRequired?.();
        }
      }, 3000);
    };

    const drain = () => {
      if (applying || disposed) return;
      applying = true;
      try {
        for (;;) {
          const next = pending.get(lastAppliedVersion + 1);
          if (!next) break;
          pending.delete(lastAppliedVersion + 1);
          if (!next.local) handler.applyRemoteAction(next.action, next.data);
          lastAppliedVersion = next.data.version ?? lastAppliedVersion;
          handler.updateRoomInfo(documentId, lastAppliedVersion, "");
        }
        // A leading gap (next expected version missing) means a lost op; arm a
        // one-shot watchdog instead of waiting for an op that never arrives.
        if (pending.size > 0 && !pending.has(lastAppliedVersion + 1)) {
          armGapWatchdog();
        }
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Could not apply a live operation.");
        onSnapshotReloadRequired?.();
      } finally {
        applying = false;
      }
    };

    handler.sendActionToServer = (operations) => {
      if (!ready || disposed || operations.length === 0) return;
      void (async () => {
        try {
          // Clamp the sequence to baseVersion so post-compaction rooms (where
          // meta.seq is reset to baseVersion, or even 0) always emit the next
          // version > baseVersion. Without the clamp the late-join guard would
          // discard every new op and the room would deadlock.
          const transaction = await runTransaction(
            seqRef,
            (current) => Math.max(current ?? baseVersion, baseVersion) + 1,
          );
          if (!transaction.committed || disposed) return;
          const version = transaction.snapshot.val() as number;
          console.debug("[LiveCollab] sequence assigned", { documentId, version });
          const data: ActionInfo = {
            connectionId: userId,
            version,
            roomName: documentId,
            currentUser: userName,
            operations: removeUndefined(operations),
          };
          await push(opsRef, {
            action: "action",
            data,
            userId,
            senderSessionId: sessionId,
            timestamp: Date.now(),
          });
          console.debug("[LiveCollab] operation sent", { documentId, version });
          pending.set(version, { action: "action", data, local: true });
          drain();
          setCompactionNeeded((needed) => needed || version - baseVersion >= 100);
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : "Could not send a live operation.");
        }
      })();
    };

    handler.updateRoomInfo(documentId, baseVersion, "");
    handler.applyRemoteAction("connectionId", userId);
    void set(presenceRef, { name: userName, active: true, lastSeen: Date.now() });
    const disconnect = onDisconnect(presenceRef);
    void disconnect.remove();

    const unsubscribePresence = onValue(ref(database, `${root}/presence`), (snapshot) => {
      const value = snapshot.val() as Record<string, Omit<LiveCollaborator, "id">> | null;
      setUsers(
        Object.entries(value ?? {}).map(([id, presence]) => ({ id, ...presence })),
      );
    });

    // Subscribe after reading the sequence. If the log is ahead of the SFDT
    // snapshot, operations greater than baseVersion replay in strict order.
    let unsubscribeOps: (() => void) | undefined;
    void get(seqRef)
      .then(() => {
        if (disposed) return;
        ready = true;
        setIsLive(true);
        unsubscribeOps = onChildAdded(opsRef, (snapshot) => {
          const op = snapshot.val() as {
            action: string;
            data: ActionInfo;
            senderSessionId?: string;
          } | null;
          if (!op || op.data.version === undefined || op.data.version <= baseVersion) return;
          if (op.senderSessionId === sessionId) return;
          console.debug("[LiveCollab] operation received", {
            documentId,
            version: op.data.version,
          });
          pending.set(op.data.version, { action: op.action, data: op.data, local: false });
          drain();
        });
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Could not join the live room."));

    return () => {
      disposed = true;
      if (gapWatchdog !== undefined) window.clearTimeout(gapWatchdog);
      handler.sendActionToServer = originalSendAction;
      unsubscribeOps?.();
      unsubscribePresence();
      void remove(presenceRef);
      handler.applyRemoteAction("removeUser", userId);
    };
  }, [baseVersion, documentId, enabled, handler, onSnapshotReloadRequired, sessionId, userId, userName]);

  return { isLive, users, error, compactionNeeded };
}
