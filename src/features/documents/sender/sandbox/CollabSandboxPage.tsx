/**
 * SANDBOX (THROWAWAY) — Live collaborative editing spike.

 * Two side-by-side bare DocumentEditor instances share one RTDB room:
 * type in one, the other updates live (including remote carets). This validates
 * every risky SDK/RTDB assumption before any product code is touched..
 *
 * Prereqs:
 *  - Enable Realtime Database in the Firebase console..
 *  - Set VITE_FIREBASE_DATABASE_URL in .env / .env.development..
  *
 * Usage: /collab-sandbox?docId=my-test-room&userA=Tab%20A&userB=Tab%20B
 *
 * This file is intentionally isolated from DocxEditor/DocxViewer — Sandbox mode,
 * no audit/state logging (delete after validation).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  DocumentEditorComponent,
  DocumentEditorContainerComponent,
  Inject,
  Toolbar,
  Selection,
  Editor,
  EditorHistory,
  CollaborativeEditingHandler,
  SfdtExport,
  ContextMenu,
  Optimized,
  TextFormFieldDialog,
  DropDownFormFieldDialog,
  CheckBoxFormFieldDialog,
} from "@syncfusion/ej2-react-documenteditor";
import type {
  ContentChangeEventArgs,
  ActionInfo,
  Operation,
} from "@syncfusion/ej2-documenteditor";
import {
  ref,
  get,
  push,
  onChildAdded,
  onDisconnect,
  remove,
  runTransaction,
  set,
  type Database,
} from "firebase/database";
import { getRtdb } from "../../../../firebase";
import { generateUUID } from "../../../../utils/uuid";

// DocumentEditorContainer creates its inner editor itself, so its editor
// modules must be registered statically rather than through the container's
// <Inject>. This follows Syncfusion's documented collaboration setup.
DocumentEditorComponent.Inject(
  Selection,
  Editor,
  EditorHistory,
  CollaborativeEditingHandler,
  SfdtExport,
  ContextMenu,
  Optimized,
  TextFormFieldDialog,
  DropDownFormFieldDialog,
  CheckBoxFormFieldDialog,
);

/** Minimal structural typing for the collab handler's public surface. */
interface CollabHandler {
  sendActionToServer: (operations: Operation[]) => void;
  applyRemoteAction: (action: string, data: string | ActionInfo) => void;
  updateRoomInfo: (
    roomName: string,
    version: number,
    serviceUrl: string,
  ) => void;
}

interface SandboxEditorProps {
  docId: string;
  userId: string;
  userName: string;
}

/** RTDB rejects undefined values; Syncfusion emits optional operation fields as undefined. */
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

function SandboxEditor({ docId, userId, userName }: SandboxEditorProps) {
  const containerRef = useRef<DocumentEditorContainerComponent | null>(null);
  const collabRef = useRef<CollabHandler | null>(null);
  const sessionId = useRef(generateUUID()).current;
  const [error, setError] = useState<string | null>(null);
  const [syncStats, setSyncStats] = useState({ sent: 0, received: 0 });

  // This must be supplied as a component event prop. Assigning contentChange
  // after DocumentEditor has rendered does not register the callback in its
  // React wrapper, so no local OT operations ever reach the broker.
  const handleContentChange = useCallback((args: ContentChangeEventArgs) => {
    if (args.operations?.length) {
      console.debug("[CollabSandbox] local operations generated", {
        userId,
        operationCount: args.operations.length,
      });
      collabRef.current?.sendActionToServer(args.operations);
    }
  }, [userId]);

  useEffect(() => {
    const container = containerRef.current;
    const documentEditor = container?.documentEditor;
    if (!container || !documentEditor) return;

    const editor = documentEditor as unknown as {
      enableCollaborativeEditing: boolean;
      collaborativeEditingHandlerModule?: CollabHandler;
    };
    editor.enableCollaborativeEditing = true;
    // DocumentEditorContainer creates its inner editor before this flag can be
    // set. In that case EJ2 does not add the optional module itself, so attach
    // the handler explicitly (the React fallback recommended by Syncfusion).
    const handler =
      editor.collaborativeEditingHandlerModule ??
      new CollaborativeEditingHandler(documentEditor);
    editor.collaborativeEditingHandlerModule = handler;

    const collab = handler;
    collabRef.current = collab;
    let rtdb: Database;
    try {
      rtdb = getRtdb();
    } catch (e) {
      setError(e instanceof Error ? e.message : "RTDB not configured");
      return;
    }

    let disposed = false;
    // Last seq this client has accounted for (applied remote OR self-pushed).
    let lastAppliedVersion = 0;
    // Every sequence is queued, including our own. A local operation is already
    // reflected in this editor, so drain skips applying it but still advances the
    // handler version in strict sequence order. This prevents a locally assigned
    // version N from making an earlier remote version N-1 look stale.
    const pendingActions = new Map<
      number,
      { action: string; data: ActionInfo; isLocal: boolean }
    >();
    let applying = false;

    const opsRef = ref(rtdb, `documents/${docId}/ops`);
    const seqRef = ref(rtdb, `documents/${docId}/meta/seq`);
    const presenceRef = ref(rtdb, `documents/${docId}/presence/${userId}`);

    collab.applyRemoteAction("connectionId", userId);
    let isReady = false;

    // Local ops -> atomic global seq -> RTDB broadcast.
    collab.sendActionToServer = (operations: Operation[]) => {
      if (disposed || !isReady) return;
      void (async () => {
        try {
          // 1) Atomic, globally-ordered sequence number (RTDB transaction).
          const txn = await runTransaction(seqRef, (cur) => (cur ?? 0) + 1);
          if (!txn.committed) return;
          const assignedVersion = txn.snapshot.val() as number;
          console.debug("[CollabSandbox] sequence assigned", {
            userId,
            version: assignedVersion,
            operationCount: operations.length,
          });

          // 2) Wrap into Syncfusion's strict ActionInfo shape.
          const actionInfo: ActionInfo = {
            connectionId: userId,
            version: assignedVersion,
            roomName: docId,
            operations: removeUndefined(operations),
            currentUser: userName,
          };

          // 3) Broadcast.
          await push(opsRef, {
            action: "action",
            data: actionInfo,
            userId,
            senderSessionId: sessionId,
            timestamp: Date.now(),
          });
          console.debug("[CollabSandbox] operation written", {
            userId,
            version: assignedVersion,
          });
          setSyncStats((stats) => ({ ...stats, sent: stats.sent + 1 }));

          // 4) Account for our own already-applied operation in ordered drain.
          pendingActions.set(assignedVersion, {
            action: "action",
            data: actionInfo,
            isLocal: true,
          });
          await drain();
        } catch (e) {
          console.error("[CollabSandbox] failed to broadcast op", e);
          setError(
            e instanceof Error
              ? `RTDB send failed: ${e.message}`
              : "RTDB send failed. Check the Realtime Database rules.",
          );
        }
      })();
    };

    async function drain() {
      if (applying) return;
      applying = true;
      try {
        for (;;) {
          const next = pendingActions.get(lastAppliedVersion + 1);
          if (!next) break;
          pendingActions.delete(lastAppliedVersion + 1);
          if (!next.isLocal) {
            try {
              console.debug("[CollabSandbox] applying remote operation", {
                userId,
                version: lastAppliedVersion + 1,
                operationCount: next.data.operations?.length ?? 0,
              });
              collab.applyRemoteAction(next.action, next.data);
            } catch (e) {
              console.error("[CollabSandbox] remote operation failed", {
                userId,
                version: lastAppliedVersion + 1,
                error: e,
                action: next,
              });
              setError("Remote operation failed; see the browser console for details.");
              break;
            }
          } else {
            console.debug("[CollabSandbox] acknowledging local operation", {
              userId,
              version: lastAppliedVersion + 1,
            });
          }
          lastAppliedVersion =
            (next.data as { version?: number }).version ?? lastAppliedVersion;

          collab.updateRoomInfo(docId, lastAppliedVersion, "");
        }
      } finally {
        applying = false;
      }
    }

    let unsubscribeOps: (() => void) | undefined;
    const startOperationSubscription = async () => {
      // This is the late-join guard: existing ops belong to an earlier base
      // snapshot and must not be replayed into this blank sandbox editor.
      const currentSeq = (await get(seqRef)).val();
      const baseVersion = typeof currentSeq === "number" ? currentSeq : 0;
      if (disposed) return;
      lastAppliedVersion = baseVersion;
      collab.updateRoomInfo(docId, baseVersion, "");
      isReady = true;
      console.info("[CollabSandbox] joined room", { userId, baseVersion });

      unsubscribeOps = onChildAdded(opsRef, (snapshot) => {
      const op = snapshot.val() as {
        action: string;
        data: { version: number };
        userId: string;
        senderSessionId?: string;
        timestamp: number;
      } | null;
      // Filter only the exact browser session. Filtering by user ID creates a
      // permanent sequence gap after a reload, because prior sessions by the
      // same user were never locally acknowledged in this editor.
      if (
        !op ||
        op.data.version <= baseVersion ||
        op.senderSessionId === sessionId
      ) {
        return;
      }
      console.debug("[CollabSandbox] remote operation received", {
        userId,
        fromUserId: op.userId,
        version: op.data.version,
      });
      pendingActions.set(op.data.version, {
        action: op.action,
        data: op.data as ActionInfo,
        isLocal: false,
      });
      setSyncStats((stats) => ({ ...stats, received: stats.received + 1 }));
      void drain();
      });
    };
    void startOperationSubscription().catch((e) => {
      console.error("[CollabSandbox] failed to join room", e);
      setError("Could not read the RTDB room state; see the browser console.");
    });

    // Presence:who is in the room;auto-cleared when the connection drops..
    void set(presenceRef, {
      name: userName,
      active: true,
      lastSeen: Date.now(),
    });
    const disconnectCleanup = onDisconnect(presenceRef);
    void disconnectCleanup.remove();

    return () => {
      disposed = true;
      collabRef.current = null;
      unsubscribeOps?.();
      void remove(presenceRef);
      collab.applyRemoteAction("removeUser", userId);
    };
  }, [docId, userId, userName]);

  return (
    <div className="space-y-2 rounded-xl border border-amber-300 bg-amber-50/50 p-3 dark:border-amber-500/30 dark:bg-amber-500/5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
          {userName} ({userId})
        </p>
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
          Live
        </span>
      </div>
      {error ? (
        <p className="text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : (
        <>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            RTDB operations — sent: {syncStats.sent}, received: {syncStats.received}
          </p>
          <div
            className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
            style={{ height: "40vh" }}
          >
            <DocumentEditorContainerComponent
              ref={containerRef}
              height="100%"
              enableToolbar={false}
              contentChange={handleContentChange}
            >
              <Inject services={[Toolbar]} />
            </DocumentEditorContainerComponent>
          </div>
        </>
      )}
    </div>
  );
}

export default function CollabSandboxPage() {
  const params = new URLSearchParams(window.location.search);
  // A previous spike leaves an op log behind. Start with a clean room unless
  // an explicit room is supplied for a deliberate repeatable test.
  const [docId] = useState(
    () => params.get("docId") || `sandbox-${generateUUID()}`,
  );
  const userA = params.get("userA") || "Tab A";
  const userB = params.get("userB") || "Tab B";

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-800 dark:text-white">
          SANDBOX — Live Collaboration Spike
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Two bare editors, one RTDB room. Type in one — the other updates live.
          Throwaway route (/collab-sandbox);delete before release. Prereq: RTDB
          enabled in the console + VITE_FIREBASE_DATABASE_URL set.
        </p>
        <p className="mt-1 font-mono text-xs text-gray-400 dark:text-gray-500">
          /collab-sandbox?docId=my-test-room&userA=Tab%20A&userB=Tab%20B
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <SandboxEditor docId={docId} userId="userA" userName={userA} />
        <SandboxEditor docId={docId} userId="userB" userName={userB} />
      </div>
    </div>
  );
}
