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
  // Comment,
  // ImageResizer,
  // OptionsPane,
} from "@syncfusion/ej2-react-documenteditor";

import type { DocumentEditorContainerComponent as ContainerType } from "@syncfusion/ej2-react-documenteditor";

import type { ViewChangeEventArgs } from "@syncfusion/ej2-documenteditor";
import type { RevisionMeta } from "../../types";

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

export interface DocxEditorSaveResult {
  sfdt: string;
  docxBlob: Blob;
  pageCount: number;
  revisions: RevisionMeta[];
}

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
  height = "70vh",
}: DocxEditorProps) {
  const containerRef = useRef<ContainerType | null>(null);
  const pendingSource = useRef<File | string | null>(source);
  const createdRef = useRef(false);
  const currentPageRef = useRef(1);
  const totalPagesRef = useRef(Math.max(1, pageCount));
  const onPageCountChangeRef = useRef(onPageCountChange);
  onPageCountChangeRef.current = onPageCountChange;

  const [loading, setLoading] = useState(false);
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
  const user = useSelector((state: RootState) => state.auth.user);
  // Resolve the actual editor's display name from the logged-in user profile.
  // Falls back through username → email-prefix → email → full name → name.
  const authorName =
    user?.username ||
    user?.email?.split("@")[0] ||
    user?.email ||
    `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() ||
    user?.name ||
    "Unknown User";
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

  const handleContentChange = useCallback(() => {
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
  }, [version, authorName]);

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

      // EDIT MODE: enable editing
      editor.isReadOnly = false;
      editor.enableTrackChanges = true;
      console.log("[DocxEditor] Enabled track changes:", editor.enableTrackChanges  );

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

        // Re-apply edit mode AFTER document loads (enableTrackChanges gets wiped on open)
        editor.isReadOnly = false;
        editor.enableTrackChanges = true;
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
    [dataUrlToFile, pageCount, refreshTotalPageCount],
  );

  const handleCreated = useCallback(() => {
    console.log("[DocxEditor] handleCreated triggered");
    const container = containerRef.current;
    const editor = container?.documentEditor;
    if (!editor) return;

    // EDIT MODE: enable editing
    editor.isReadOnly = false;
    editor.enableTrackChanges = true;
    console.log("[DocxEditor] enableTrackChanges:", editor.enableTrackChanges);
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
      const capturedFromChanges: RevisionMeta[] = [...pendingRevisionsRef.current];

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

        <div className="docx-editor-container h-full">
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
//             )}
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

function DocxEditorHeader({
  name,
  loading,
  saving,
  currentPage,
  totalPages,
  onPrev,
  onNext,
  onSave,
}: {
  name: string;
  loading: boolean;
  saving: boolean;
  currentPage: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  onSave: () => void;
}) {
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

      <div className="flex items-center gap-3">
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
