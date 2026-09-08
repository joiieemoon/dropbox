import { useEffect, useState } from "react";
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
  update,
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
  /** True while this collaborator is actively sending operations. */
  typing?: boolean;
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
  /**
   * True only while the editor's document is fully loaded and safe to apply
   * remote operations. When false, remote ops are buffered in order instead of
   * being applied (avoids applying ops into an empty/partially-open document).
   */
  isEditorDocumentReady?: () => boolean;
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

/** Deterministic avatar colors shared by every client for the same user id. */
const PRESENCE_COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#22c55e",
  "#14b8a6",
  "#0ea5e9",
  "#6366f1",
  "#a855f7",
  "#ec4899",
  "#84cc16",
];

function presenceColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) & 0x7fffffff;
  }
  return PRESENCE_COLORS[hash % PRESENCE_COLORS.length];
}

/**
 * RTDB transport for Syncfusion's collaborative editing handler.
 *
 * The caller owns loading the matching SFDT snapshot before enabling this
 * hook. This module only brokers ordered OT operations and presence.
 */
export function useCollaborativeEditing({
  enabled,
  documentId,
  userId,
  userName,
  baseVersion = 0,
  handler,
  onSnapshotReloadRequired,
  isEditorDocumentReady,
}: UseCollaborativeEditingOptions): UseCollaborativeEditingResult {
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
    // Fresh per join: a rejoin replays this browser's PREVIOUS ops as remote
    // (they must be re-applied after a snapshot reload). Keeping a single
    // session id across joins would echo-filter them away and corrupt the doc.
    const joinSessionId = generateUUID();
    const pending = new Map<number, { action: string; data: ActionInfo; local: boolean }>();
    const originalSendAction = handler.sendActionToServer;
    const root = `documents/${documentId}`;
    const seqRef = ref(database, `${root}/meta/seq`);
    const opsRef = ref(database, `${root}/ops`);
    const presenceRef = ref(database, `${root}/presence/${userId}`);

    // Typing heartbeat: flip presence.typing on while this client sends ops,
    // and back to false after a short silence (throttled to one RTDB write/s).
    let lastTypingPulse = 0;
    let typingTimer: number | undefined;
    const pulseTyping = () => {
      if (disposed) return;
      const now = Date.now();
      if (typingTimer !== undefined) window.clearTimeout(typingTimer);
      typingTimer = window.setTimeout(() => {
        typingTimer = undefined;
        if (disposed) return;
        void update(presenceRef, { typing: false, lastSeen: Date.now() });
      }, 1500);
      if (now - lastTypingPulse < 1000) return;
      lastTypingPulse = now;
      void update(presenceRef, { typing: true, lastSeen: now });
    };

    // Safety net for a lost operation (e.g. a client that incremented the
    // sequence but crashed before writing its op). If the next expected version
    // never appears, tell the caller to reload the compacted SFDT snapshot so
    // this editor re-bases instead of stalling forever.
    let gapWatchdog: number | undefined;
    let retryTimer: number | undefined;
    let errorClearTimer: number | undefined;
    const scheduleDrainRetry = () => {
      if (retryTimer !== undefined || disposed) return;
      retryTimer = window.setTimeout(() => {
        retryTimer = undefined;
        drain();
      }, 150);
    };

    // Non-sticky apply error: show it, then auto-clear so "Live unavailable"
    // resolves itself once the room recovers instead of persisting forever.
    const reportApplyError = (cause: unknown) => {
      pending.clear();
      setError(
        cause instanceof Error ? cause.message : "Could not apply a live operation.",
      );
      if (errorClearTimer !== undefined) window.clearTimeout(errorClearTimer);
      errorClearTimer = window.setTimeout(() => {
        errorClearTimer = undefined;
        if (!disposed) setError(null);
      }, 6000);
      onSnapshotReloadRequired?.();
    };

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
      // Wait until the document is actually open before applying remote ops.
      // A remote op applied into an empty/loading editor makes the OT engine
      // throw, which previously wedged the room into "Live unavailable".
      if (isEditorDocumentReady && !isEditorDocumentReady()) {
        scheduleDrainRetry();
        return;
      }
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
        console.warn("[LiveCollab] apply failed", { documentId, cause });
        reportApplyError(cause);
      } finally {
        applying = false;
      }
    };

    handler.sendActionToServer = (operations) => {
      if (!ready || disposed || operations.length === 0) return;
      // Authoritative load gate: openAsync fires fireContentChange batches
      // (document settings + content) while the document is being opened or
      // reloaded. Pushing them would duplicate the whole document on every
      // peer and pollute the op log on every page load. Same gate as drain().
      if (isEditorDocumentReady && !isEditorDocumentReady()) return;
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
            senderSessionId: joinSessionId,
            timestamp: Date.now(),
          });
          console.debug("[LiveCollab] operation sent", { documentId, version });
          pending.set(version, { action: "action", data, local: true });
          drain();
          pulseTyping();
          setCompactionNeeded((needed) => needed || version - baseVersion >= 100);
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : "Could not send a live operation.");
        }
      })();
    };

    handler.updateRoomInfo(documentId, baseVersion, "");
    handler.applyRemoteAction("connectionId", userId);
    void set(presenceRef, {
      name: userName,
      color: presenceColor(userId),
      active: true,
      lastSeen: Date.now(),
      typing: false,
    });
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
          if (op.senderSessionId === joinSessionId) return;
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
      if (retryTimer !== undefined) window.clearTimeout(retryTimer);
      if (errorClearTimer !== undefined) window.clearTimeout(errorClearTimer);
      if (typingTimer !== undefined) window.clearTimeout(typingTimer);
      handler.sendActionToServer = originalSendAction;
      unsubscribeOps?.();
      unsubscribePresence();
      void remove(presenceRef);
      handler.applyRemoteAction("removeUser", userId);
    };
  // Note: joinSessionId is intentionally per-run (created inside the effect)
  // and deliberately not a dependency — its identity changes every run.
  }, [baseVersion, documentId, enabled, handler, isEditorDocumentReady, onSnapshotReloadRequired, userId, userName]);

  return { isLive, users, error, compactionNeeded };
}
