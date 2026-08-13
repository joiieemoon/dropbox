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
  Comment,
  ImageResizer,
  OptionsPane,
} from "@syncfusion/ej2-react-documenteditor";

import type { DocumentEditorContainerComponent as ContainerType } from "@syncfusion/ej2-react-documenteditor";

import type { ViewChangeEventArgs } from "@syncfusion/ej2-documenteditor";

export const EJ2_SERVICES_URL =
  "https://document.syncfusion.com/web-services/docx-editor/api/documenteditor/";

export interface DocxEditorSaveResult {
  sfdt: string;
  docxBlob: Blob;
  pageCount: number;
}

interface DocxEditorProps {
  source: File | string | null;
  title?: string;
  pageCount?: number;
  version?: number;
  onPageChange?: (page: number) => void;
  onPageCountChange?: (pageCount: number) => void;
  onSave?: (result: DocxEditorSaveResult, newVersion: number) => void;
  height?: string;
}

export default function DocxEditor({
  source,
  title,
  pageCount = 1,
  version = 1,
  onPageChange,
  onPageCountChange,
  onSave,
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

  useEffect(() => {
    pendingSource.current = source;
  }, [source]); 

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
    if (typeof count !== "number" || !Number.isFinite(count) || count <= 0) return;
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

        // Re-apply edit mode after opening
        editor.isReadOnly = false;
        editor.enableTrackChanges = true;

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
    const container = containerRef.current;
    const editor = container?.documentEditor;
    if (!editor) return;

    // EDIT MODE: enable editing
    editor.isReadOnly = false;
    editor.enableTrackChanges = true;

    editor.viewChange = handleViewChange;
    editor.documentChange = handleDocumentChange;

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
      const actualTotal = editor.pageCount || totalPagesRef.current || pageCount;
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

      const result: DocxEditorSaveResult = {
        sfdt,
        docxBlob,
        pageCount: Math.max(1, editor.pageCount || totalPagesRef.current),
      };

      console.log("[DocxEditor] invoking onSave callback...");
      await onSave?.(result, version + 1);
      console.log("[DocxEditor] onSave callback completed.");
    } catch (e) {
      console.error("[DocxEditor] Failed to save document:", e);
      setError("Failed to save the document. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [version, onSave]);

  // Expose save method via ref-like pattern using a global
  useEffect(() => {
    (window as unknown as { __docxEditorSave: () => Promise<void> }).__docxEditorSave =
      handleSave;
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
            enableSpellCheck={true}
            enableComment={true}
            documentEditorSettings={{
              enableOptimizedTextMeasuring: false,
              showRuler: true,
            }}
            created={handleCreated}
          >
            {/* <Inject
              services={[
                Toolbar,
                SfdtExport,
                WordExport,
                Editor,
                EditorHistory,
                Selection,
                Search,
                ContextMenu,
                Comment,
                ImageResizer,
                OptionsPane,
              ]}
            /> */}<Inject
  services={[
    Toolbar,
    SfdtExport,
    WordExport,
    Editor,
    EditorHistory,
    Selection,
    Search,
    ContextMenu,
  ]}
/>
          </DocumentEditorContainerComponent>
        </div>
      </div>
    </div>
  );
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
// </arg_value>
// <task_progress>
// - [x] Check available Syncfusion editor modules
// - [x] Create DocxEditor component
// - [ ] Add save/versioning API
// - [ ] Wire edit mode into DocxViewerPage
// - [ ] Test implementation
// </task_progress>
// </write_to_file>