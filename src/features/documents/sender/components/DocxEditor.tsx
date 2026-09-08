/**
 * DocxEditor - editable in-browser editor for .docx documents
 * built on Syncfusion's DocumentEditorContainerComponent.
 *
 * Unlike DocxViewer (read-only), this component:
 *   - Enables the full toolbar (ribbon) for editing
 *   - Shows the properties pane for formatting
 *   - Supports track changes, comments, spell check
 *   - Exports to SFDT JSON, .docx, and PDF on save
 *   - Supports versioning via onSave callback
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../../../store";
import {
  DocumentEditorContainerComponent,
  Inject,
  Toolbar,
  SfdtExport,
  WordExport,
  Editor,
  EditorHistory,
  Selection,
  Search,
  ContextMenu,
  CollaborativeEditingHandler,
  // Comment,
  // ImageResizer,
  // OptionsPane,
} from "@syncfusion/ej2-react-documenteditor";

import type { DocumentEditorContainerComponent as ContainerType } from "@syncfusion/ej2-react-documenteditor";

import type {
  RevisionActionEventArgs,
  ViewChangeEventArgs,
  ContentChangeEventArgs,
  ReviewTabType,
} from "@syncfusion/ej2-documenteditor";
import type { RevisionMeta } from "../../types";
import { toastWarning } from "../../../../components/common/toast/toast";
import {
  useCollaborativeEditing,
  type CollaborativeEditingHandlerLike,
  type LiveCollaborator,
} from "../hooks/useCollaborativeEditing";

export const EJ2_SERVICES_URL =
  "https://document.syncfusion.com/web-services/docx-editor/api/documenteditor/";

/**
 * Merge two arrays of revisions, deduplicating by revision ID.
 * Items from `secondary` that already exist in `primary` (by ID) are skipped.
 * Returns the merged array.
 */
function mergeRevisions(
  primary: RevisionMeta[],
  secondary: RevisionMeta[],
): RevisionMeta[] {
  const existingIds = new Set(primary.map((r) => r.id));
  const fresh = secondary.filter((r) => !existingIds.has(r.id));
  return [...primary, ...fresh];
}

/** Structural view of the SDK's TrackChangesPane (public members only). */
interface TrackChangesPaneLike {
  isChangesTabVisible: boolean;
  updateTrackChanges?: (show?: boolean) => void;
}

/** Structural view of the SDK's comment/review Tab (tab 1 = "Changes"). */
interface ReviewTabLike {
  hideTab: (index: number, hide?: boolean) => void;
  select?: (index: number) => void;
}

interface CommentReviewPaneLike {
  reviewTab?: ReviewTabLike | null;
  showHidePane?: (show: boolean, tab: ReviewTabType) => void;
}

/** Structural view of the DocumentEditor members this module drives for mode. */
interface ReviewPaneEditorLike {
  isReadOnly: boolean;
  enableTrackChanges: boolean;
  showRevisions: boolean;
  trackChangesPane?: TrackChangesPaneLike | null;
  commentReviewPane?: CommentReviewPaneLike | null;
}

/**
 * Shows or hides the Track-Changes review sidebar (the "Changes" tab that
 * carries the Accept/Reject controls).
 *
 * The SDK hides tab index 1 ("Changes") whenever showRevisions is false in
 * CommentReviewPane.showHidePane, so we mirror that exact mechanism:
 * suggesting = revisions + Changes tab visible; everything else = hidden.
 */
function enforceChangesTabVisibility(
  editor: ReviewPaneEditorLike | null | undefined,
  show: boolean,
): void {
  if (!editor) return;
  try {
    const pane = editor.trackChangesPane;
    const review = editor.commentReviewPane;
    if (show) {
      if (pane) {
        pane.isChangesTabVisible = true;
        pane.updateTrackChanges?.(true);
      }
      // Un-hide the Changes tab (index 1) and open the review pane on it.
      review?.reviewTab?.hideTab?.(1, false);
      review?.showHidePane?.(true, "Changes");
    } else {
      if (pane) {
        pane.isChangesTabVisible = false;
        pane.updateTrackChanges?.(false);
      }
      // Hide the Changes tab and close the whole review pane so the
      // Accept/Reject sidebar can never appear outside Suggesting mode.
      review?.reviewTab?.hideTab?.(1, true);
      review?.showHidePane?.(false, "Changes");
    }
  } catch {
    // Non-fatal: the review pane differs across SDK builds.
  }
}

/**
 * Applies the editor flags for a mode. Only "suggesting" tracks changes and
 * shows the review (Accept/Reject) sidebar; "editing" (live co-edit) and
 * "viewing" keep the Changes tab hidden.
 */
function applyDocEditorMode(
  editor: ReviewPaneEditorLike | null | undefined,
  mode: DocxEditorMode,
): void {
  if (!editor) return;
  editor.isReadOnly = mode === "viewing";
  editor.enableTrackChanges = mode === "suggesting";
  // showRevisions = false is the SDK's own switch that hides the Changes tab.
  editor.showRevisions = mode === "suggesting";
  enforceChangesTabVisibility(editor, mode === "suggesting");
}

export interface DocxEditorSaveResult {
  sfdt: string;
  docxBlob: Blob;
  pageCount: number;
  revisions: RevisionMeta[];
}

export type DocxEditorMode = "editing" | "suggesting" | "viewing";

interface DocxEditorProps {
  darkMode?: boolean;
  source: File | string | null;
  title?: string;
  pageCount?: number;
  version?: number;
  revisions?: RevisionMeta[];
  onPageChange?: (page: number) => void;
  onPageCountChange?: (pageCount: number) => void;
  onSave?: (result: DocxEditorSaveResult, newVersion: number) => void;
  onRevisionStatusChange?: (
    revisionId: string,
    status: "accepted" | "rejected",
  ) => void;
  /** Whether the current user may accept/reject tracked changes (owner only). */
  canManageRevisions?: boolean;
  mode?: DocxEditorMode;
  onModeChange?: (mode: DocxEditorMode) => void;
  liveDocumentId?: string;
  baseVersion?: number;
  currentUserId?: string;
  /** When the compacted snapshot was last persisted (drives "edited by X"). */
  lastEditedByAt?: { by: string; at: number } | null;
  height?: string;
}

export default function DocxEditor({
  // darkMode = true,
  source,
  title,
  pageCount = 1,
  version = 1,
  // revisions = [],
  onPageChange,
  onPageCountChange,
  onSave,
  // onRevisionStatusChange,
  canManageRevisions = true,
  mode = "editing",
  onModeChange,
  liveDocumentId,
  baseVersion = 0,
  currentUserId,
  lastEditedByAt = null,
  height = "80vh",
}: DocxEditorProps) {
  const containerRef = useRef<ContainerType | null>(null);
  const pendingSource = useRef<File | string | null>(source);
  const docTitleRef = useRef(title ?? "");
  docTitleRef.current = title ?? "";
  const createdRef = useRef(false);
  const currentPageRef = useRef(1);
  const totalPagesRef = useRef(Math.max(1, pageCount));
  const onPageCountChangeRef = useRef(onPageCountChange);
  onPageCountChangeRef.current = onPageCountChange;
  // Mirrors the current mode for asynchronous load callbacks, so document
  // loading always applies the right mode without re-binding on mode changes.
  const modeRef = useRef(mode);
  modeRef.current = mode;

  // Track-changes accept/reject is owner-only. `beforeAcceptRejectChanges`
  // fires on every accept/reject path (toolbar, context menu, shortcuts) and
  // the built-in implementation respects args.cancel, making this the single
  // authoritative gate.
  const canManageRevisionsRef = useRef(canManageRevisions);
  canManageRevisionsRef.current = canManageRevisions;

  const handleBeforeAcceptReject = useCallback(
    (args: RevisionActionEventArgs) => {
      if (canManageRevisionsRef.current) return;

      args.cancel = true;
      toastWarning(
        "Only the document owner can accept or reject tracked changes.",
      );
    },
    [],
  );

  const [loading, setLoading] = useState(false);
  // Mirrors `loading` for stable callbacks that must not re-bind on renders.
  const loadingRef = useRef(loading);
  loadingRef.current = loading;
  // Depth guard around applyDocEditorMode(): the SDK's enableTrackChanges /
  // showRevisions setters push documentSettingOps and fire contentChange
  // synchronously. Those are OUR UI settings, not document edits — they must
  // never be forwarded into the live op stream (each one would bump the
  // broker version and toggle peers' track-changes state).
  const modeOpSuppressDepthRef = useRef(0);
  // Applies the mode while suppressing the settings ops the SDK setters emit
  // (they fire contentChange synchronously — see modeOpSuppressDepthRef).
  const applyModeQuietly = useCallback(
    (editor: ReviewPaneEditorLike | null | undefined, nextMode: DocxEditorMode) => {
      modeOpSuppressDepthRef.current += 1;
      try {
        applyDocEditorMode(editor, nextMode);
      } finally {
        queueMicrotask(() => {
          modeOpSuppressDepthRef.current = Math.max(
            0,
            modeOpSuppressDepthRef.current - 1,
          );
        });
      }
    },
    [],
  );
  const [error, setError] = useState<string | null>(null);
  const [docName, setDocName] = useState(title ?? "");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(Math.max(1, pageCount));
  const [saving, setSaving] = useState(false);
  // const [revisionHistory, setRevisionHistory] =
  //   useState<RevisionMeta[]>(revisions);
  // const [revisionActionMsg, setRevisionActionMsg] = useState<string | null>(
  //   null,
  // );
  const pendingRevisionsRef = useRef<RevisionMeta[]>([]);
  const liveHandlerRef = useRef<CollaborativeEditingHandlerLike | null>(null);
  const [liveHandler, setLiveHandler] =
    useState<CollaborativeEditingHandlerLike | null>(null);
  // Tracks whether live editing was previously active within this mount, so a
  // re-enter of Editing can reset the document to the base snapshot (rejoin
  // replays the op log and must not double-apply).
  const liveWasActiveRef = useRef(false);
  const loadIntoEditorRef = useRef<
    ((src: File | string, name: string) => Promise<void>) | null
  >(null);
  const user = useSelector((state: RootState) => state.auth.user);
  // True once the editor has both been created and finished opening a document.
  // Stable identity (refs only) so the collab hook never rejoins on re-render.
  const isEditorDocumentReady = useCallback(
    () => !loadingRef.current && createdRef.current,
    [],
  );
  // Self-heal for a broken live session (version gap / failed op apply): the
  // hook asks us to re-base from the canonical snapshot. The live handler is
  // torn down FIRST so the contentChange events fired while the snapshot
  // reloads are never pushed into the room (they would re-insert the entire
  // document), then a FRESH handler instance joins after the reload — its
  // internal version state must start clean for the op replay to line up.
  const handleSnapshotReloadRequired = useCallback(() => {
    if (!pendingSource.current) return;
    liveWasActiveRef.current = false;
    liveHandlerRef.current = null;
    setLiveHandler(null);
    void loadIntoEditorRef.current
      ?.(pendingSource.current, docTitleRef.current)
      .then(() => {
        if (modeRef.current !== "editing") return;
        const editor = containerRef.current?.documentEditor;
        if (!editor) return;
        const collaborativeEditor = editor as typeof editor & {
          collaborativeEditingHandlerModule?: CollaborativeEditingHandlerLike;
        };
        editor.enableCollaborativeEditing = true;
        const handler = new CollaborativeEditingHandler(editor);
        collaborativeEditor.collaborativeEditingHandlerModule = handler;
        liveHandlerRef.current = handler;
        setLiveHandler(handler);
      });
  }, []);
  // Resolve the actual editor's display name from the logged-in user profile.
  // Falls back through username → email-prefix → email → full name → name.
  const authorName =
    user?.username ||
    user?.email?.split("@")[0] ||
    user?.email ||
    `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() ||
    user?.name ||
    "Unknown User";
  const { isLive, users, error: liveError } = useCollaborativeEditing({
    enabled: mode === "editing",
    documentId: liveDocumentId,
    userId: currentUserId,
    userName: authorName,
    baseVersion,
    handler: liveHandler,
    isEditorDocumentReady,
    onSnapshotReloadRequired: handleSnapshotReloadRequired,
  });
  useEffect(() => {
    const editor = containerRef.current?.documentEditor;
    if (!editor) return;
    // Editing (live) and Viewing hide the Changes tab; only Suggesting shows
    // the Accept/Reject review sidebar.
    applyModeQuietly(editor, mode);
    if (mode === "editing") {
      const rejoining = liveWasActiveRef.current;
      liveWasActiveRef.current = true;
      if (!liveHandlerRef.current) {
        const collaborativeEditor = editor as typeof editor & {
          collaborativeEditingHandlerModule?: CollaborativeEditingHandlerLike;
        };
        editor.enableCollaborativeEditing = true;
        const handler =
          collaborativeEditor.collaborativeEditingHandlerModule ??
          new CollaborativeEditingHandler(editor);
        collaborativeEditor.collaborativeEditingHandlerModule = handler;
        liveHandlerRef.current = handler;
        setLiveHandler(handler);
      }
      // Re-entering Editing after leaving it: the room rejoins and replays the
      // whole op log (fresh per-join session id), so the editor MUST be reset
      // to the base snapshot first or the ops would be double-applied.
      if (rejoining && createdRef.current && pendingSource.current) {
        void loadIntoEditorRef.current?.(pendingSource.current, docTitleRef.current);
      }
    } else {
      liveWasActiveRef.current = false;
      setLiveHandler(null);
    }
  }, [applyModeQuietly, mode]);
  useEffect(() => {
    pendingSource.current = source;
  }, [source]);

  // useEffect(() => {
  //   setRevisionHistory(revisions);
  // }, [revisions]);

  const dataUrlToFile = useCallback(
    (dataUrl: string, filename: string): File => {
      const [header, base64] = dataUrl.split(",");
      const mimeMatch = header?.match(/data:([^;]+)/);
      const mimeType = mimeMatch ? mimeMatch[1] : "application/octet-stream";
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new File([bytes], filename, { type: mimeType });
    },
    [],
  );

  const syncTotalPages = useCallback(() => {
    const editor = containerRef.current?.documentEditor;
    if (!editor) return;
    const count = editor.pageCount;
    if (typeof count !== "number" || !Number.isFinite(count) || count <= 0)
      return;
    if (count === totalPagesRef.current) return;
    totalPagesRef.current = count;
    setTotalPages(count);
    onPageCountChangeRef.current?.(count);
  }, []);

  const refreshTotalPageCount = useCallback(() => {
    const delays = [0, 100, 250, 500, 800, 1200, 1800, 2500, 3500];
    delays.forEach((delay) => {
      window.setTimeout(() => syncTotalPages(), delay);
    });
  }, [syncTotalPages]);

  const handleViewChange = useCallback(
    (args: ViewChangeEventArgs) => {
      syncTotalPages();
      const page = args.startPage;
      if (!page || page < 1 || !Number.isFinite(page)) return;
      if (page === currentPageRef.current) return;
      currentPageRef.current = page;
      setCurrentPage(page);
      onPageChange?.(page);
    },
    [syncTotalPages, onPageChange],
  );

  const handleDocumentChange = useCallback(() => {
    refreshTotalPageCount();
    currentPageRef.current = 1;
    setCurrentPage(1);
  }, [refreshTotalPageCount]);

  const handleContentChange = useCallback(
    (args?: ContentChangeEventArgs) => {
      // Document open/reload fires contentChange with settings/content
      // batches (SDK fireContentChange emits documentSettingOps while
      // enableCollaborativeEditing is on). Forwarding those would push the
      // whole document into the live op stream on EVERY load — so only real
      // user edits made after the load completes may be forwarded.
      if (loadingRef.current || !createdRef.current) return;
      // Settings ops emitted by our own mode application (track-changes /
      // revisions toggles) are UI state, not document edits — never forward.
      if (modeOpSuppressDepthRef.current > 0) return;
      if (mode === "editing" && args?.operations?.length) {
        console.debug("[DocxEditorLive] local operation", {
          count: args.operations.length,
        });
        liveHandlerRef.current?.sendActionToServer(args.operations);
      }
      // Debounce to let Syncfusion update the revision collection
      window.setTimeout(() => {
        const editor = containerRef.current?.documentEditor;
        if (!editor) return;
        try {
          const revs = editor.revisions?.revisions ?? [];
          if (revs.length > 0) {
            const captured = revs.map((rev) => {
              let content = "";
              try {
                content = rev.getContent();
              } catch {
                content = "";
              }
              return {
                id: rev.revisionID,
                // Use the actual author from Syncfusion first,
                // fall back to the logged-in user for robustness.
                author: rev.author || authorName,
                date: rev.date,
                type: rev.revisionType,
                content,
                status: "pending" as const,
                version: version + 1,
              };
            });
            // MERGE with any existing pending revisions (don't replace)
            pendingRevisionsRef.current = mergeRevisions(
              pendingRevisionsRef.current,
              captured,
            );
            console.log(
              "[DocxEditor] Captured revisions from contentChange:",
              captured.length,
            );
          }
        } catch (e) {
          console.warn("[DocxEditor] Failed to capture revisions:", e);
        }
      }, 100);
    },
    [version, authorName, mode],
  );

  // Syncfusion captures event callbacks at creation. Rebind after a mode
  // change so Editing forwards operations instead of retaining Suggesting's
  // original callback.
  useEffect(() => {
    const editor = containerRef.current?.documentEditor;
    if (editor) editor.contentChange = handleContentChange;
  }, [handleContentChange]);

  const loadIntoEditor = useCallback(
    async (src: File | string, name: string) => {
      const container = containerRef.current;
      if (!container) return;
      const editor = container.documentEditor;
      if (!editor) return;

      setLoading(true);
      setError(null);
      currentPageRef.current = 1;
      setCurrentPage(1);

      const fallbackCount = Math.max(1, pageCount);
      totalPagesRef.current = fallbackCount;
      setTotalPages(fallbackCount);

      // Apply the current mode. Only Suggesting shows the review (Accept/Reject)
      // sidebar; Editing/Viewing hide the Changes tab via the SDK
      // showRevisions=false path.
      applyModeQuietly(editor, modeRef.current);

      try {
        if (typeof src === "string") {
          if (src.startsWith("data:")) {
            const file = dataUrlToFile(src, name || "document.docx");
            await editor.openAsync(file);
            setDocName(name || "Document");
          } else {
            await editor.openAsync(src);
            setDocName(name || "Document");
          }
        } else {
          await editor.openAsync(src);
          setDocName(name || src.name || "Document");
        }

        // Re-apply the current mode AFTER document loads (the editor resets
        // these flags when a document is opened). Changes tab shows only in
        // Suggesting; Editing (live) and Viewing keep it hidden.
        applyModeQuietly(editor, modeRef.current);
        // The review pane can initialize slightly after the content loads;
        // re-assert mode a couple of times so the sidebar can never flash in.
        window.setTimeout(() => {
          const lateEditor = containerRef.current?.documentEditor;
          if (lateEditor) applyModeQuietly(lateEditor, modeRef.current);
        }, 400);
        window.setTimeout(() => {
          const lateEditor = containerRef.current?.documentEditor;
          if (lateEditor) applyModeQuietly(lateEditor, modeRef.current);
        }, 1200);
        // Set current user so changes are tagged as tracked revisions
        editor.currentUser = authorName;

        refreshTotalPageCount();

        window.setTimeout(() => {
          containerRef.current?.resize?.();
          containerRef.current?.documentEditor?.resize?.();
          refreshTotalPageCount();
        }, 500);

        window.setTimeout(() => {
          containerRef.current?.documentEditor?.resize?.();
          refreshTotalPageCount();
        }, 1500);

        window.setTimeout(() => {
          refreshTotalPageCount();
        }, 3000);

        setLoading(false);
      } catch (e) {
        console.error("[DocxEditor] Failed to open document:", e);
        setError(
          "Could not open this document. The Syncfusion document service may be unavailable.",
        );
        setLoading(false);
      }
    },
    [applyModeQuietly, dataUrlToFile, pageCount, refreshTotalPageCount],
  );
  loadIntoEditorRef.current = loadIntoEditor;

  const handleCreated = useCallback(() => {
    console.log("[DocxEditor] handleCreated triggered");
    const container = containerRef.current;
    const editor = container?.documentEditor;
    if (!editor) return;

    // Only Suggesting tracks changes and shows the review (Accept/Reject)
    // sidebar; Editing (live) and Viewing keep the Changes tab hidden.
    applyModeQuietly(editor, mode);
    // Set current user so changes are tagged as tracked revisions
    editor.currentUser = authorName;
    console.log("[DocxEditor] currentUser:", editor.currentUser);
    editor.viewChange = handleViewChange;
    editor.documentChange = handleDocumentChange;
    editor.contentChange = handleContentChange;

    if (createdRef.current) return;
    createdRef.current = true;

    const src = pendingSource.current;
    if (src) {
      void loadIntoEditor(src, title ?? "");
    }

    window.setTimeout(() => {
      container?.resize?.();
      editor.resize?.();
      refreshTotalPageCount();
    }, 100);
  }, [
    applyModeQuietly,
    handleViewChange,
    handleDocumentChange,
    handleContentChange,
    loadIntoEditor,
    title,
    refreshTotalPageCount,
  ]);

  useEffect(() => {
    if (!createdRef.current) return;
    if (!source) return;
    void loadIntoEditor(source, title ?? "");
  }, [source, title, loadIntoEditor]);

  const goToPage = useCallback(
    (page: number) => {
      const editor = containerRef.current?.documentEditor;
      if (!editor) return;
      const actualTotal =
        editor.pageCount || totalPagesRef.current || pageCount;
      const target = Math.max(1, Math.min(page, actualTotal));
      editor.scrollToPage(target - 1);
    },
    [pageCount],
  );

  const goPrev = useCallback(() => {
    if (currentPage <= 1) return;
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  const goNext = useCallback(() => {
    const editor = containerRef.current?.documentEditor;
    const actualTotal = editor?.pageCount || totalPagesRef.current || pageCount;
    if (currentPage >= actualTotal) return;
    goToPage(currentPage + 1);
  }, [currentPage, pageCount, goToPage]);

  const handleSave = useCallback(async () => {
    console.log("[DocxEditor] handleSave triggered");
    const container = containerRef.current;
    if (!container) {
      console.warn("[DocxEditor] containerRef is null");
      return;
    }
    const editor = container.documentEditor;
    if (!editor) {
      console.warn("[DocxEditor] documentEditor is null");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Serialize to SFDT JSON
      console.log("[DocxEditor] serializing editor content...");
      const sfdt = editor.serialize();

      // Export to .docx blob
      console.log("[DocxEditor] exporting to docx blob...");
      const docxBlob = await editor.saveAsBlob("Docx");
      console.log("[DocxEditor] docx blob exported, size:", docxBlob.size);

      // Extract tracked changes (revisions) from Syncfusion.
      // First use revisions captured from contentChange events.
      const capturedFromChanges: RevisionMeta[] = [
        ...pendingRevisionsRef.current,
      ];

      // IMPORTANT: Also merge in ANY revisions currently in the editor
      // that may not have been captured yet (e.g. changes made right
      // before clicking save). This ensures ALL tracked changes from
      // every editor session are captured.
      let newRevisions: RevisionMeta[] = capturedFromChanges;
      try {
        const revs = editor.revisions?.revisions ?? [];
        console.log(
          "[DocxEditor] revisions.revisions returned:",
          revs.length,
          revs.map((r) => ({
            author: r.author,
            type: r.revisionType,
            id: r.revisionID,
          })),
        );
        const editorRevs: RevisionMeta[] = [];
        for (const rev of revs) {
          let content = "";
          try {
            content = rev.getContent();
          } catch {
            content = "";
          }
          editorRevs.push({
            id: rev.revisionID,
            // Use the actual author from Syncfusion first,
            // fall back to the logged-in user for robustness.
            author: rev.author || authorName,
            date: rev.date,
            type: rev.revisionType,
            content,
            status: "pending",
            version: version + 1,
          });
        }
        // Merge editor revisions with the ones captured from contentChange.
        // Dedupe by revision ID so nothing is lost or duplicated.
        newRevisions = mergeRevisions(capturedFromChanges, editorRevs);
      } catch (revErr) {
        console.warn(
          "[DocxEditor] Failed to extract revisions on save:",
          revErr,
        );
      }

      console.log(
        "[DocxEditor] Revisions extracted on save:",
        newRevisions.length,
      );

      const result: DocxEditorSaveResult = {
        sfdt,
        docxBlob,
        pageCount: Math.max(1, editor.pageCount || totalPagesRef.current),
        revisions: newRevisions,
      };

      console.log("[DocxEditor] invoking onSave callback...");
      await onSave?.(result, version + 1);
      console.log("[DocxEditor] onSave callback completed.");

      // Update local revision history state
      // if (newRevisions.length > 0) {
      //   setRevisionHistory((prev) => {
      //     const existingIds = new Set(prev.map((r) => r.id));
      //     const fresh = newRevisions.filter((r) => !existingIds.has(r.id));
      //     return [...prev, ...fresh];
      //   });
      // }

      // Clear captured revisions after successful save
      pendingRevisionsRef.current = [];
    } catch (e) {
      console.error("[DocxEditor] Failed to save document:", e);
      setError("Failed to save the document. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [version, onSave]);

  /**
   * Find a matching revision in the editor's in-memory collection.
   *
   * Syncfusion generates NEW revision IDs every time a document is opened,
   * so the revision IDs stored in Firebase (from a previous session) will
   * NOT match the editor's current in-memory revision IDs. We first try
   * matching by ID, then fall back to content+author+type matching.
   */
  // const findLiveEditorRevision = useCallback(
  //   (target: RevisionMeta): Revision | null => {
  //     const editor = containerRef.current?.documentEditor;
  //     if (!editor) return null;
  //     const revs = editor.revisions?.revisions ?? [];

  //     // 1. Try exact ID match first (works for changes made THIS session)
  //     const byId = revs.find((r) => r.revisionID === target.id);
  //     if (byId) return byId;

  //     // 2. Fall back to matching by content + author + type
  //     //    (handles revisions loaded from a previously-saved document)
  //     const cleanTarget = cleanRevisionContent(target.content);
  //     return (
  //       revs.find((r) => {
  //         if (r.revisionType !== target.type) return false;
  //         if ((r.author || "").trim() !== (target.author || "").trim())
  //           return false;
  //         let content = "";
  //         try {
  //           content = cleanRevisionContent(r.getContent());
  //         } catch {
  //           content = "";
  //         }
  //         return content === cleanTarget && content !== "";
  //       }) ?? null
  //     );
  //   },
  //   [],
  // );

  // const handleAcceptRevision = useCallback(
  //   async (revisionId: string) => {
  //     const editor = containerRef.current?.documentEditor;
  //     if (!editor) return;
  //     const target = revisionHistory.find((r) => r.id === revisionId);
  //     if (!target) {
  //       setRevisionActionMsg("Revision not found in history.");
  //       return;
  //     }
  //     try {
  //       const rev = findLiveEditorRevision(target);
  //       if (rev) {
  //         rev.accept();
  //       } else {
  //         // If the revision isn't in the editor (e.g. already applied on load),
  //         // still update the status so the UI and Firebase reflect the review.
  //         console.warn(
  //           "[DocxEditor] Revision not found in editor, updating status only:",
  //           revisionId,
  //         );
  //       }
  //       setRevisionHistory((prev) =>
  //         prev.map((r) =>
  //           r.id === revisionId ? { ...r, status: "accepted" } : r,
  //         ),
  //       );
  //       setRevisionActionMsg("Change accepted.");
  //       onRevisionStatusChange?.(revisionId, "accepted");

  //       // If we modified the editor content, also persist the updated document
  //       // so accepted changes are saved in the .docx stored in Firebase.
  //       if (rev) {
  //         // Remove from pending ref so it isn't re-captured as "pending"
  //         pendingRevisionsRef.current = pendingRevisionsRef.current.filter(
  //           (r) => r.id !== revisionId,
  //         );
  //         await handleSave();
  //       }
  //     } catch (e) {
  //       console.error("[DocxEditor] Failed to accept revision:", e);
  //       setRevisionActionMsg("Failed to accept change.");
  //     }
  //     window.setTimeout(() => setRevisionActionMsg(null), 3000);
  //   },
  //   [revisionHistory, findLiveEditorRevision, onRevisionStatusChange, handleSave],
  // );

  // const handleRejectRevision = useCallback(
  //   async (revisionId: string) => {
  //     const editor = containerRef.current?.documentEditor;
  //     if (!editor) return;
  //     const target = revisionHistory.find((r) => r.id === revisionId);
  //     if (!target) {
  //       setRevisionActionMsg("Revision not found in history.");
  //       return;
  //     }
  //     try {
  //       const rev = findLiveEditorRevision(target);
  //       if (rev) {
  //         rev.reject();
  //       } else {
  //         console.warn(
  //           "[DocxEditor] Revision not found in editor, updating status only:",
  //           revisionId,
  //         );
  //       }
  //       setRevisionHistory((prev) =>
  //         prev.map((r) =>
  //           r.id === revisionId ? { ...r, status: "rejected" } : r,
  //         ),
  //       );
  //       setRevisionActionMsg("Change rejected.");
  //       onRevisionStatusChange?.(revisionId, "rejected");

  //       // Persist the updated document so rejected changes are removed
  //       // from the .docx stored in Firebase.
  //       if (rev) {
  //         pendingRevisionsRef.current = pendingRevisionsRef.current.filter(
  //           (r) => r.id !== revisionId,
  //         );
  //         await handleSave();
  //       }
  //     } catch (e) {
  //       console.error("[DocxEditor] Failed to reject revision:", e);
  //       setRevisionActionMsg("Failed to reject change.");
  //     }
  //     window.setTimeout(() => setRevisionActionMsg(null), 3000);
  //   },
  //   [revisionHistory, findLiveEditorRevision, onRevisionStatusChange, handleSave],
  // );

  // Expose save method via ref-like pattern using a global
  useEffect(() => {
    (
      window as unknown as { __docxEditorSave: () => Promise<void> }
    ).__docxEditorSave = handleSave;
  }, [handleSave]);

  if (error) {
    return (
      <div className="flex h-[70vh] items-center justify-center rounded-xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-900/20">
        <div>
          <p className="text-sm font-medium text-red-700 dark:text-red-300">
            {error}
          </p>
          <p className="mt-1 text-xs text-red-500 dark:text-red-400">
            The Syncfusion document service must be reachable.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <DocxEditorHeader
        name={docName}
        loading={loading}
        saving={saving}
        currentPage={currentPage}
        totalPages={totalPages}
        onPrev={goPrev}
        onNext={goNext}
        onSave={handleSave}
        mode={mode}
        onModeChange={onModeChange}
        isLive={isLive}
        users={users}
        liveError={liveError}
        lastEditedByAt={lastEditedByAt}
        currentUserId={currentUserId}
      />

      {/* {revisionActionMsg && (
        <div className="border-b border-gray-200 bg-blue-50 px-4 py-2 text-xs font-medium text-blue-700 dark:border-gray-700 dark:bg-blue-500/10 dark:text-blue-400">
          {revisionActionMsg}
        </div>
      )} */}

      <div className="relative" style={{ height }}>
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 dark:bg-gray-900/70">
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Opening document…
              </span>
            </div>
          </div>
        )}

        <div
          className={`docx-editor-container h-full ${
            canManageRevisions ? "" : "docx-editor--no-accept-reject"
          } ${
            mode === "suggesting" ? "" : "docx-editor--no-changes-tab"
          }`}
        >
          <DocumentEditorContainerComponent
            ref={containerRef}
            height="100%"
            serviceUrl={EJ2_SERVICES_URL}
            enableToolbar={true}
            showPropertiesPane={true}
            enableTrackChanges={true}
            enableSpellCheck={false}
            enableComment={true}
            documentEditorSettings={{
              enableOptimizedTextMeasuring: false,
              showRuler: true,
            }}
            created={handleCreated}
            beforeAcceptRejectChanges={handleBeforeAcceptReject}
          >
            <Inject
              services={[
                Toolbar,
                SfdtExport,
                WordExport,
                Editor,
                EditorHistory,
                Selection,
                Search,
                ContextMenu,
                // Comment,
                // ImageResizer,
                // OptionsPane,
              ]}
            />
          </DocumentEditorContainerComponent>
        </div>
      </div>
      {/* 
      <RevisionHistoryPanel
        revisions={revisionHistory}
        onAccept={handleAcceptRevision}
        onReject={handleRejectRevision}
      /> */}
    </div>
  );
}

/**
 * Format a revision date string into a readable format like:
 * "August 14, 2026 12:41 PM".
 */
// function formatRevisionDate(dateStr: string): string {
//   const d = new Date(dateStr);
//   if (Number.isNaN(d.getTime())) return dateStr;
//   return d.toLocaleString("en-US", {
//     month: "long",
//     day: "numeric",
//     year: "numeric",
//     hour: "numeric",
//     minute: "2-digit",
//     hour12: true,
//   });
// }

/**
 * Clean Syncfusion revision HTML content for readable display.
 * Removes paragraph marks (¶), table track-change wrapper classes,
 * and HTML tags so the actual changed text is shown.
 */
// function cleanRevisionContent(html: string): string {
//   if (!html) return "";
//   try {
//     // Use DOM to parse and extract only visible text
//     const doc = new DOMParser().parseFromString(html, "text/html");
//     // Remove paragraph mark elements
//     doc
//       .querySelectorAll(".e-de-tc-pmark, .e-de-tc-tble-cell")
//       .forEach((el) => el.remove());
//     // Remove empty table elements
//     doc
//       .querySelectorAll("table")
//       .forEach((el) => {
//         if (el.textContent?.trim() === "") el.remove();
//       });
//     return (doc.body.textContent || "").trim();
//   } catch {
//     // Fallback: strip tags via regex if DOMParser fails
//     return html
//       .replace(/<[^>]*>/g, " ")
//       .replace(/\s+/g, " ")
//       .replace(/¶/g, "")
//       .trim();
//   }
// }

// function RevisionHistoryPanel({
//   revisions,
//   onAccept,
//   onReject,
// }: {
//   revisions: RevisionMeta[];
//   onAccept: (revisionId: string) => void;
//   onReject: (revisionId: string) => void;
// }) {
//   if (revisions.length === 0) {
//     return (
//       <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700">
//         <h3 className="mb-1 text-sm font-semibold text-gray-800 dark:text-white">
//           Change History
//         </h3>
//         <p className="text-xs text-gray-500 dark:text-gray-400">
//           No tracked changes yet. Edits made with Track Changes enabled will
//           appear here after saving.
//         </p>
//       </div>
//     );
//   }

//   return (
//     <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700">
//       <div className="mb-2 flex items-center justify-between">
//         <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
//           Change History
//         </h3>
//         <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
//           {revisions.length} change{revisions.length !== 1 ? "s" : ""}
//         </span>
//       </div>

//       <div className="max-h-48 space-y-2 overflow-y-auto">
//         {revisions.map((rev, index) => (
//           <div
//             key={rev.id}
//             className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-2.5 dark:border-gray-700 dark:bg-gray-900"
//           >
//             <span
//               className={`mt-0.5 inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
//                 rev.type === "Insertion"
//                   ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
//                   : rev.type === "Deletion"
//                     ? "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
//                     : "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
//               }`}
//             >
//               {rev.type === "Insertion"
//                 ? "INSERTED"
//                 : rev.type === "Deletion"
//                   ? "DELETED"
//                   : rev.type}
//             </span>

//             <div className="min-w-0 flex-1">
//               <div className="flex items-center gap-2 text-xs">
//                 <span className="font-medium text-gray-700 dark:text-gray-300">
//                   {rev.author}
//                 </span>
//                 <span className="text-gray-400">{formatRevisionDate(rev.date)}</span>
//                 <span
//                   className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
//                     rev.status === "accepted"
//                       ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
//                       : rev.status === "rejected"
//                         ? "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
//                         : "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
//                   }`}
//                 >
//                   {rev.status}
//                 </span>
//               </div>
//               <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
//                 {cleanRevisionContent(rev.content)}
//               </div>
//               <div className="mt-1 text-[10px] font-medium text-gray-400 dark:text-gray-500">
//                 Changes {index + 1} of {revisions.length}
//               </div>
//             </div>

//             {rev.status === "pending" && (
//               <div className="flex shrink-0 items-center gap-1">
//                 <button
//                   type="button"
//                   onClick={() => onAccept(rev.id)}
//                   className="rounded-md bg-emerald-500 px-2 py-1 text-[10px] font-semibold text-white transition hover:bg-emerald-600"
//                   title="Accept change"
//                 >
//                   ✓ Accept
//                 </button>
//                 <button
//                   type="button"
//                   onClick={() => onReject(rev.id)}
//                   className="rounded-md bg-red-500 px-2 py-1 text-[10px] font-semibold text-white transition hover:bg-red-600"
//                   title="Reject change"
//                 >
//                   ✗ Reject
//                 </button>
//               </div>
/** "John Doe" → "JD"; single names use the first two letters. */
function initialsOf(name: string): string {
  const cleaned = (name || "?").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (cleaned.slice(0, 2) || "?").toUpperCase();
}

/** Resolve a stored uid to a display name, falling back gracefully. */
function resolveEditorName(by: string, users: LiveCollaborator[]): string {
  const match = users.find((u) => u.id === by);
  return match?.name || "Another editor";
}

/** Compact relative timestamp ("just now", "12s ago", "3m ago", ...). */
function relativeEditLabel(at: number, now: number): string {
  const delta = Math.max(0, now - at);
  const seconds = Math.floor(delta / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}

function DocxEditorHeader({
  name,
  loading,
  saving,
  currentPage,
  totalPages,
  onPrev,
  onNext,
  onSave,
  mode,
  onModeChange,
  isLive,
  users,
  liveError,
  lastEditedByAt,
  currentUserId,
}: {
  name: string;
  loading: boolean;
  saving: boolean;
  currentPage: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  onSave: () => void;
  mode: DocxEditorMode;
  onModeChange?: (mode: DocxEditorMode) => void;
  isLive: boolean;
  users: LiveCollaborator[];
  liveError: string | null;
  lastEditedByAt: { by: string; at: number } | null;
  currentUserId?: string;
}) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!lastEditedByAt) return;
    const timer = window.setInterval(() => setNow(Date.now()), 15000);
    return () => window.clearInterval(timer);
  }, [lastEditedByAt]);

  const otherEditors = users.filter((u) => u.id !== currentUserId);
  const onlineOthers = otherEditors.slice(0, 5);
  const typingUsers = users.filter(
    (u) => u.typing === true && u.id !== currentUserId,
  );
  const presenceText = liveError
    ? ""
    : typingUsers.length > 0
      ? `${typingUsers[0].name} is editing…`
      : lastEditedByAt
        ? `Edited by ${currentUserId && lastEditedByAt.by === currentUserId ? "you" : resolveEditorName(lastEditedByAt.by, users)} ${relativeEditLabel(lastEditedByAt.at, now)}`
        : otherEditors.length > 0
          ? `${otherEditors.length} online`
          : "";

  return (
    <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
      <div className="flex items-center gap-2">
        <svg
          className="h-5 w-5 text-brand-600 dark:text-brand-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
          />
        </svg>
        <span className="text-sm font-semibold text-gray-800 dark:text-white">
          {name || "Document"}
        </span>
      </div>

      {isLive && (onlineOthers.length > 0 || lastEditedByAt || liveError) && (
        <div className="flex min-w-0 items-center gap-2 overflow-hidden">
          {onlineOthers.length > 0 && (
            <div className="flex items-center">
              {onlineOthers.map((u, i) => (
                <span
                  key={u.id}
                  title={`${u.name}${u.typing === true ? " — typing…" : ""}`}
                  className={`relative inline-flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold text-white ring-2 ring-white dark:ring-gray-800 ${i > 0 ? "-ml-2" : ""}`}
                  style={{ backgroundColor: u.color || "#6366f1" }}
                >
                  {initialsOf(u.name)}
                  <span
                    className={`docx-avatar-dot ${u.typing === true ? "docx-avatar-dot--typing" : "docx-avatar-dot--idle"}`}
                  />
                </span>
              ))}
              {otherEditors.length > 5 && (
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-[10px] font-semibold text-gray-700 ring-2 ring-white -ml-2 dark:bg-gray-700 dark:text-gray-300">
                  +{otherEditors.length - 5}
                </span>
              )}
            </div>
          )}

          {liveError ? (
            <span className="inline-flex min-w-0 items-center gap-1 truncate text-xs font-medium text-red-600 dark:text-red-400">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
              Live unavailable
            </span>
          ) : presenceText ? (
            <span
              className="min-w-0 truncate text-xs text-gray-500 dark:text-gray-400"
              title={presenceText}
            >
              {presenceText}
            </span>
          ) : null}
        </div>
      )}

      <div className="flex items-center gap-3">
        {onModeChange && (
          <div className="flex rounded-lg border border-gray-200 p-0.5 dark:border-gray-700">
            {(["editing", "suggesting", "viewing"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onModeChange(item)}
                className={`rounded-md px-2 py-1 text-xs font-medium capitalize ${mode === item ? "bg-brand-500 text-white" : "text-gray-600 dark:text-gray-300"}`}
              >
                {item}
              </button>
            ))}
          </div>
        )}
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
          <span className={loading ? "animate-pulse" : ""}>
            {loading ? "Loading…" : "Editable"}
          </span>
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPrev}
            disabled={currentPage <= 1}
            className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            aria-label="Previous page"
          >
            ← Prev
          </button>
          <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium tabular-nums text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={onNext}
            disabled={currentPage >= totalPages}
            className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            aria-label="Next page"
          >
            Next →
          </button>
        </div>

        <button
          type="button"
          onClick={onSave}
          disabled={saving || loading}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-60"
        >
          {saving ? (
            <>
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Saving…
            </>
          ) : (
            <>
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M16 20H4a2 2 0 01-2-2V6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2z"
                />
              </svg>
              Save
            </>
          )}
        </button>
      </div>
    </div>
  );
}
