import { useCallback, useEffect, useRef, useState } from "react";
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
  /** Latest fully-applied op version in this session (starts at baseVersion). */
  currentVersion: number;
}

/** Status surfaced by useAutoSave (idle autosave + unload flush). */
export type AutosaveStatus = "idle" | "saving" | "saved" | "failed";

export interface UseAutoSaveOptions {
  documentId: string;
  /** Live transport is active (collab hook isLive === true). */
  enabled: boolean;
  /** Editor document fully loaded and safe to serialize. */
  documentReady: boolean;
  /** Collab hook's compactionNeeded (version - baseVersion >= 100). */
  compactionNeeded: boolean;
  /** Latest applied op version = the baseVersion the snapshot is persisted at. */
  currentVersion: number;
  /** Current online presence count (includes us; <= 1 means we are alone). */
  onlineCount: number;
  captureSfdt: () => Promise<string | null>;
  persistSnapshot: (sfdt: string, baseVersion: number) => Promise<void>;
  /** Called after a successful persist so the caller can re-base (baseVersion bump). */
  onSnapshotPersisted?: (newBaseVersion: number) => void;
  /**
   * localStorage key for the unload backup. On refresh/close the current SFDT
   * is written here (synchronous — guaranteed to complete before unload). On
   * mount, if a backup exists it is persisted to Firestore and cleared.
   */
  localStorageKey?: string;
}

export interface UseAutoSaveResult {
  autosaveStatus: AutosaveStatus;
  lastSavedAt: number | null;
  /** True when there are edits that have not yet been persisted to Firestore. */
  hasUnsavedChanges: boolean;
  /** Trigger an immediate save (for "Save & Leave" button). Resolves when the save completes. */
  saveNow: () => Promise<void>;
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
  // Join-time base captured in a ref: the page bumps baseVersion after every
  // autosave (handleAutosaved → setDoc). If baseVersion stayed an effect
  // dependency, that bump would rejoin the room and REPLAY already-applied
  // ops on top of the live document → double-apply corruption. Only mount /
  // mode / document changes may re-establish a session.
  const baseVersionRef = useRef(baseVersion);
  baseVersionRef.current = baseVersion;
  const joinBaseVersion = baseVersionRef.current;
  const [isLive, setIsLive] = useState(false);
  const [users, setUsers] = useState<LiveCollaborator[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [compactionNeeded, setCompactionNeeded] = useState(false);
  // Mirrors the internal lastAppliedVersion so callers (autosave) know which
  // version the current editor state represents.
  const [currentVersion, setCurrentVersion] = useState<number>(baseVersion);

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
    let lastAppliedVersion = joinBaseVersion;
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
    // Remembers which version we already reloaded the snapshot for. A
    // permanently-missing op (writer crashed between seq increment and push)
    // can never be filled, so the watchdog would otherwise fire a reload every
    // 3 s forever. We reload ONCE per gap; after that we hang up quietly.
    let gapReloadedFor: number | undefined;
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
          // Already reloaded for this EXACT gap? The missing version is
          // permanent (a writer crashed mid-push) — reloading again would only
          // loop forever. Clear the stuck ops and wait for future ops quietly.
          if (gapReloadedFor === lastAppliedVersion) {
            pending.clear();
            console.warn(
              "[LiveCollab] gap reload already attempted for version",
              lastAppliedVersion,
              "— waiting for future ops (no more reloads)",
            );
            return;
          }
          gapReloadedFor = lastAppliedVersion;
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
          // Real progress = a fresh gap (if any) deserves its own reload.
          gapReloadedFor = undefined;
          lastAppliedVersion = next.data.version ?? lastAppliedVersion;
          handler.updateRoomInfo(documentId, lastAppliedVersion, "");
          setCurrentVersion(lastAppliedVersion);
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
          // Clamp the sequence to the join-time baseVersion so post-compaction
          // rooms (where meta.seq is reset to baseVersion, or even 0) always
          // emit the next version > baseVersion. Without the clamp the
          // late-join guard would discard every new op and the room would
          // deadlock.
          const transaction = await runTransaction(
            seqRef,
            (current) =>
              Math.max(current ?? joinBaseVersion, joinBaseVersion) + 1,
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
          setCompactionNeeded((needed) => needed || version - joinBaseVersion >= 100);
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : "Could not send a live operation.");
        }
      })();
    };

    handler.updateRoomInfo(documentId, joinBaseVersion, "");
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
        setCurrentVersion(joinBaseVersion);
        unsubscribeOps = onChildAdded(opsRef, (snapshot) => {
          const op = snapshot.val() as {
            action: string;
            data: ActionInfo;
            senderSessionId?: string;
          } | null;
          if (!op || op.data.version === undefined || op.data.version <= joinBaseVersion) return;
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
  // baseVersion is intentionally NOT a dependency either: the page bumps it on
  // autosave, and a rejoin would double-apply already-applied ops. Join-time
  // value is captured via joinBaseVersion above.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- joinBaseVersion captured at join time
  }, [documentId, enabled, handler, isEditorDocumentReady, onSnapshotReloadRequired, userId, userName]);

  return { isLive, users, error, compactionNeeded, currentVersion };
}

/**
 * Option A autosave: persist the compacted SFDT automatically.
 *
 * Triggers:
 *  - idle: compactionNeeded (version - baseVersion >= 100) -> save after 2 s,
 *  - unload: visibilitychange:hidden -> save immediately.
 *  - beforeunload: flag + log only (browsers truncate async writes here).
 *
 * Invariant: persistSnapshot ALWAYS completes BEFORE any RTDB mutation. The
 * ops wipe + seq reset only run after the persist succeeded AND we are the
 * sole live editor (never mid-multi-edit).
 */
export function useAutoSave({
  documentId,
  enabled,
  documentReady,
  compactionNeeded,
  currentVersion,
  onlineCount,
  captureSfdt,
  persistSnapshot,
  onSnapshotPersisted,
  localStorageKey,
}: UseAutoSaveOptions): UseAutoSaveResult {
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  // Remember the version already persisted so the monotonic compaction flag
  // cannot re-trigger a save for the same version.
  const lastPersistedVersionRef = useRef<number | null>(null);
  const saveInFlightRef = useRef(false);
  // Track whether there are unsaved changes (edits not yet persisted to Firestore).
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // --- localStorage backup for browser refresh / close ---
  // On unload we cannot reliably complete an async Firestore write before the
  // browser kills the page. Instead we write the current SFDT to localStorage
  // (synchronous — guaranteed to complete). On the NEXT page load we detect
  // this backup and persist it to Firestore before joining the live room.
  const saveToLocalBackup = useCallback(
    (sfdt: string, version: number) => {
      if (!localStorageKey) return;
      try {
        localStorage.setItem(
          localStorageKey,
          JSON.stringify({ sfdt, version, at: Date.now() }),
        );
      } catch {
        // localStorage full or unavailable — ignore, Firestore is the source of truth.
      }
    },
    [localStorageKey],
  );

  const clearLocalBackup = useCallback(() => {
    if (!localStorageKey) return;
    try {
      localStorage.removeItem(localStorageKey);
    } catch {
      // ignore
    }
  }, [localStorageKey]);

  // On mount: if a localStorage backup exists from a previous session that was
  // closed/refreshed before the Firestore write completed, persist it now.
  useEffect(() => {
    if (!localStorageKey) return;
    try {
      const raw = localStorage.getItem(localStorageKey);
      if (!raw) return;
      const backup = JSON.parse(raw) as { sfdt: string; version: number; at: number };
      if (!backup.sfdt || backup.sfdt.trim().length === 0) {
        clearLocalBackup();
        return;
      }
      console.log("[LiveCollab] localStorage backup found, persisting to Firestore", {
        documentId,
        version: backup.version,
        ageMs: Date.now() - backup.at,
      });
      persistSnapshot(backup.sfdt, backup.version)
        .then(() => {
          console.log("[LiveCollab] localStorage backup persisted to Firestore");
          clearLocalBackup();
          onSnapshotPersisted?.(backup.version);
        })
        .catch((cause) => {
          console.warn("[LiveCollab] localStorage backup persist failed:", cause);
        });
    } catch {
      // Corrupted data — clear it.
      clearLocalBackup();
    }
  }, [localStorageKey, documentId, persistSnapshot, onSnapshotPersisted, clearLocalBackup]);

  const performSave = useCallback(
    async (reason: "idle" | "hidden" | "idle-debounce" | "unload") => {
      if (saveInFlightRef.current || !documentId) return;
      saveInFlightRef.current = true;
      setAutosaveStatus("saving");
      console.log("[LiveCollab] autosave: attempting save", {
        reason,
        documentId,
        baseVersion: currentVersion,
        onlineCount,
      });
      try {
        const sfdt = await captureSfdt();
        if (!sfdt || sfdt.trim().length === 0) {
          console.log("[LiveCollab] autosave: reject empty sfdt (document not ready?)");
          setAutosaveStatus("failed");
          return;
        }
        // 1) Persist FIRST — never wipe ops unless this write succeeds.
        console.log(
          "[LiveCollab] autosave: persisting to Firestore (baseVersion=",
          currentVersion,
          ")",
        );
        await persistSnapshot(sfdt, currentVersion);
        console.log("[LiveCollab] autosave: Firestore saved (baseVersion=", currentVersion, ")");
        lastPersistedVersionRef.current = currentVersion;
        setLastSavedAt(Date.now());
        setAutosaveStatus("saved");
        onSnapshotPersisted?.(currentVersion);

        // Backup to localStorage so a refresh/close after this point still has
        // the latest SFDT. Synchronous write — guaranteed to complete.
        saveToLocalBackup(sfdt, currentVersion);

        // 2) The RTDB op log is deliberately NOT wiped here. Presence is keyed
        // by user id, so two tabs of the SAME user look like a single presence:
        // any "am I alone?" check can wipe ops that a peer tab still needs,
        // which permanentizes a version gap and makes the gap-watchdog reload
        // in an infinite loop. Autosave = Firestore snapshot persist ONLY.
        // Op-log compaction is a separate, presence-empty + CAS-fenced pass.
        console.log(
          "[LiveCollab] autosave: RTDB op log kept (autosave persists snapshots only)",
        );
      } catch (cause) {
        console.error("[LiveCollab] autosave persist failed — ops kept intact:", cause);
        setAutosaveStatus("failed");
      } finally {
        saveInFlightRef.current = false;
      }
    },
    [captureSfdt, currentVersion, documentId, onlineCount, onSnapshotPersisted, persistSnapshot, saveToLocalBackup],
  );

  /** Immediate save for explicit user action (e.g. "Save & Leave" button). */
  const saveNow = useCallback(async () => {
    if (saveInFlightRef.current || !documentId) return;
    await performSave("idle");
  }, [performSave, documentId]);

  // Browser refresh / close: capture the current SFDT and save to localStorage.
  // localStorage writes are synchronous and guaranteed to complete before the
  // page unloads — unlike async Firestore writes which the browser may kill.
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!localStorageKey) return;
      // Fire-and-forget: capture the latest SFDT and back it up. The browser
      // will give this a brief window to complete before unloading.
      void captureSfdt().then((sfdt) => {
        if (sfdt && sfdt.trim().length > 0) {
          saveToLocalBackup(sfdt, currentVersion);
        }
      });
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [localStorageKey, captureSfdt, currentVersion, saveToLocalBackup]);

  // Track whether there are unsaved changes (currentVersion has not been persisted).
  useEffect(() => {
    const unsaved = lastPersistedVersionRef.current !== currentVersion;
    setHasUnsavedChanges(unsaved);
  }, [currentVersion]);

  // Idle autosave trigger: armed by compactionNeeded, debounced 2 s.
  useEffect(() => {
    if (!enabled || !documentReady || !compactionNeeded) return;
    if (lastPersistedVersionRef.current === currentVersion) return;
    console.log("[LiveCollab] autosave: idle trigger (compactionNeeded) scheduled in 2s", {
      currentVersion,
    });
    const timer = window.setTimeout(() => {
      void performSave("idle");
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [compactionNeeded, currentVersion, documentReady, enabled, performSave]);

  // Edit-debounced safety net: ~10 s after the last applied op, even below
  // the 100-op threshold. This keeps the Firestore snapshot near-current at
  // ALL times, so a refresh has a fresh snapshot to load plus only a tiny (or
  // zero) op replay to catch up — the #1 way the user lost changes on F5.
  useEffect(() => {
    if (!enabled || !documentReady) return;
    if (lastPersistedVersionRef.current === currentVersion) return;
    console.log("[LiveCollab] autosave: unsaved edits — scheduling 10s flush", {
      currentVersion,
    });
    const timer = window.setTimeout(() => {
      void performSave("idle-debounce");
    }, 10000);
    return () => window.clearTimeout(timer);
  }, [currentVersion, documentReady, enabled, performSave]);

  // Unload safety net: tab hidden (switch / close) -> save the current state.
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState !== "hidden") return;
      console.log("[LiveCollab] autosave: visibilitychange:hidden → save current state");
      void performSave("hidden");
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [performSave]);

  // beforeunload: show a confirmation dialog when there are unsaved changes,
  // then attempt a best-effort save. F5 refresh does NOT fire
  // visibilitychange:hidden, so this is the only hook that runs on refresh.
  // Firestore writes over a long-lived connection usually complete; the 10s
  // edit-debounce above is the backstop if the browser kills the write.
  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!enabled) return;
      if (hasUnsavedChanges) {
        // Show the native browser confirmation dialog. The message is not
        // customizable in modern browsers (they show a default message).
        event.preventDefault();
        event.returnValue = "";
        console.log("[LiveCollab] autosave: beforeunload → unsaved changes, showing confirmation");
      }
      // Attempt a best-effort save regardless (covers cases where the user
      // has unsaved changes and confirms they want to leave).
      console.log("[LiveCollab] autosave: beforeunload → flushing current state");
      void performSave("unload");
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [enabled, performSave, hasUnsavedChanges]);

  return { autosaveStatus, lastSavedAt, hasUnsavedChanges, saveNow };
}
