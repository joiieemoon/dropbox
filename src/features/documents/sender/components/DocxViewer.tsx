/**
 * DocxViewer - read-only in-browser viewer for .docx documents
 * built on Syncfusion's DocumentEditorContainerComponent.
 *
 * Renders a .docx File (or SFDT JSON string) in a read-only pane so the
 * existing PDF-based recipient tracking/analytics flow is NOT touched.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DocumentEditorContainerComponent,
  Inject,
  Toolbar,
  SfdtExport,
  WordExport,
  Editor,
  Selection,
} from "@syncfusion/ej2-react-documenteditor";
import type { DocumentEditorContainerComponent as ContainerType } from "@syncfusion/ej2-react-documenteditor";

/** Syncfusion demo service used for .docx import/export during development. */
export const EJ2_SERVICES_URL =
  // "https://ej2services.syncfusion.com/production/web-services/api/documenteditor/";
  "https://document.syncfusion.com/web-services/docx-editor/api/documenteditor/";

interface DocxViewerProps {
  /** A .docx File to open, OR an SFDT JSON string to render. */
  source: File | string | null;
  /** Optional document title shown in the header. */
  title?: string;
  /** Total page count for navigation (optional, defaults to 1). */
  pageCount?: number;
  /** Callback when the current page changes (for tracking). */
  onPageChange?: (page: number) => void;
}

export default function DocxViewer({
  source,
  title,
  pageCount = 1,
  onPageChange,
}: DocxViewerProps) {
  const containerRef = useRef<ContainerType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [docName, setDocName] = useState<string>(title ?? "");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(pageCount);

  // When source changes, save it so it can be loaded once the editor is ready.
  const pendingSource = useRef<File | string | null>(source);

  /** Convert a base64 data URL to a File object. */
  function dataUrlToFile(dataUrl: string, filename: string): File {
    const [header, base64] = dataUrl.split(",");
    const mimeMatch = header.match(/data:([^;]+)/);
    const mimeType = mimeMatch ? mimeMatch[1] : "application/octet-stream";
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new File([bytes], filename, { type: mimeType });
  }


  /** Loads the given source into the read-only editor. */
  const loadIntoEditor = useCallback(
    async (src: File | string, name: string) => {
      const container = containerRef.current;
      if (!container) {
        console.log("[DocxViewer] loadIntoEditor: container is null");
        return;
      }

      const editor = container.documentEditor;
      // The editor must be fully initialized before opening a document.
      if (!editor) {
        console.log("[DocxViewer] loadIntoEditor: editor is null/undefined");
        return;
      }

      console.log("[DocxViewer] loadIntoEditor: editor ready", {
        serviceUrl: container.serviceUrl,
        isReadOnly: editor.isReadOnly,
        hasDocumentHelper: !!editor.documentHelper,
      });

      // Set to read-only (disabled editing).
      editor.isReadOnly = true;
      editor.enableTrackChanges = false;

      setLoading(true);
      setError(null);

      try {
        if (typeof src === "string") {
          if (src.startsWith("data:")) {
            // Base64 data URL -> convert to File and open via Syncfusion service.
            const file = dataUrlToFile(src, name);
            console.log("[DocxViewer] Calling openAsync(file from dataUrl)", {
              name: file.name,
              size: file.size,
              type: file.type,
            });
            await editor.openAsync(file);
            console.log("[DocxViewer] openAsync(file from dataUrl) resolved");
            setDocName(name);
          } else {
            // SFDT JSON string -> open directly (async).
            console.log(
              "[DocxViewer] Calling openAsync(string) length=",
              src.length,
            );
            await editor.openAsync(src);
            console.log("[DocxViewer] openAsync(string) resolved");
            setDocName(name);
          }
        } else {
          // File (.docx) -> openAsync converts via the Syncfusion service.
          console.log("[DocxViewer] Calling openAsync(file)", {
            name: src.name,
            size: src.size,
            type: src.type,
          });
          await editor.openAsync(src);
          console.log("[DocxViewer] openAsync(file) resolved");
          setDocName(name ?? src.name);
        }

        // After load, inspect the actual SFDT content to confirm text is present.
        try {
          const sfdt = editor.serialize();
          const hasContent =
            !!sfdt && sfdt.length > 10 && !sfdt.includes('"sections":[]');
          console.log("[DocxViewer] serialize() after load:", {
            length: sfdt?.length,
            hasContent,
            preview: sfdt?.slice(0, 120),
          });
        } catch (serializeErr) {
          console.log("[DocxViewer] serialize() threw:", serializeErr);
        }

        // Update total pages from the actual editor state with retry logic
        // The editor needs time to process the document and calculate page count
        const checkPageCount = (attempt: number = 1) => {
          const editor = containerRef.current?.documentEditor;
          console.log(`[DocxViewer] Checking pageCount (attempt ${attempt}):`, {
            hasEditor: !!editor,
            pageCount: editor?.pageCount,
            totalPages,
          });

          if (editor && editor.pageCount && editor.pageCount > 0) {
            setTotalPages(editor.pageCount);
            console.log(
              `[DocxViewer] ✓ Page count updated: ${editor.pageCount} pages (after ${attempt} attempts)`,
            );
          } else if (attempt < 10) {
            // Retry up to 10 times with 500ms delay
            console.log(
              `[DocxViewer] Page count not ready yet, retrying in 500ms... (attempt ${attempt}/10)`,
            );
            setTimeout(() => checkPageCount(attempt + 1), 500);
          } else {
            console.log(
              `[DocxViewer] ⚠ Page count still not available after ${attempt} attempts, using fallback: ${pageCount}`,
            );
            setTotalPages(pageCount);
          }
        };

        setTimeout(() => checkPageCount(1), 2500);

        // Inspect the DOM canvas state to see if the page painted.
        setTimeout(() => {
          const viewContainer = container.element?.querySelector(
            ".e-de-scroller, .e-de-viewer-container, canvas",
          );
          const canvases = container.element?.querySelectorAll("canvas");
          console.log("[DocxViewer] DOM after load:", {
            scrollerFound: !!container.element?.querySelector(".e-de-scroller"),
            canvasCount: canvases?.length ?? 0,
            firstCanvas: canvases?.[0]
              ? {
                  width: canvases[0].width,
                  height: canvases[0].height,
                }
              : null,
            editorHtmlLength: container.element?.innerHTML?.length ?? 0,
          });
          if (viewContainer) {
            console.log("[DocxViewer] view container rect:", {
              clientHeight: (viewContainer as HTMLElement).clientHeight,
              scrollHeight: (viewContainer as HTMLElement).scrollHeight,
              offsetHeight: (viewContainer as HTMLElement).offsetHeight,
            });
          }
        }, 300);

        setLoading(false);
      } catch (e) {
        console.error("[DocxViewer] Failed to open document:", e);
        setError(
          "Could not open this document. The Syncfusion document service may be unavailable.",
        );
        setLoading(false);
      }
    },
    [],
  );

  // Store the latest source for the created handler.
  useEffect(() => {
    pendingSource.current = source;
  }, [source]);

  // If the editor is already mounted, load directly whenever source changes.
  useEffect(() => {
    if (!containerRef.current || !source) return;
    setCurrentPage(1);
    setTotalPages(pageCount);
    void loadIntoEditor(source, title ?? "");
  }, [source, title, pageCount, loadIntoEditor]);

  // Navigate to a specific page in the document.
  const goToPage = useCallback(
    (page: number) => {
      const container = containerRef.current;
      const editor = container?.documentEditor;
      if (!editor) return;

      const total = editor.pageCount || pageCount;
      const target = Math.max(1, Math.min(page, total));
      // scrollToPage uses 0-based index
      editor.scrollToPage(target - 1);
      setCurrentPage(target);
      onPageChange?.(target);
    },
    [pageCount, onPageChange],
  );

  const goPrev = useCallback(() => {
    if (currentPage > 1) goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  const goNext = useCallback(() => {
    const editor = containerRef.current?.documentEditor;
    const total = editor?.pageCount || pageCount;
    if (currentPage < total) goToPage(currentPage + 1);
  }, [currentPage, pageCount, goToPage]);

  const handleCreated = useCallback(() => {
    const container = containerRef.current;
    const editor = container?.documentEditor;
    console.log("[DocxViewer] created event fired", {
      hasContainer: !!container,
      hasEditor: !!editor,
      hasDocumentHelper: !!editor?.documentHelper,
    });

    if (editor) {
      // Keep the editor in read-only mode once the container is ready.
      editor.isReadOnly = true;
      editor.enableTrackChanges = false;
    }

    // Load any source that was set before the editor finished initializing.
    const src = pendingSource.current;
    if (src) {
      void loadIntoEditor(src, title ?? "");
    }

    // Force a layout so the page canvas paints (fixes blank-white content).
    window.setTimeout(() => {
      console.log("[DocxViewer] calling resize()");
      container?.resize?.();
      editor?.resize?.();
    }, 100);
  }, [loadIntoEditor, title]);

  // Log when the component mounts/unmounts for orientation.
  useEffect(() => {
    console.log(
      "[DocxViewer] component mounted, source=",
      source ? "set" : "null",
    );
    return () => {
      console.log("[DocxViewer] component unmounting");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="flex h-[70vh] items-center justify-center rounded-xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-900/20">
        <div>
          <p className="text-sm font-medium text-red-700 dark:text-red-300">
            {error}
          </p>
          <p className="mt-1 text-xs text-red-500 dark:text-red-400">
            The Syncfusion document service ({EJ2_SERVICES_URL}) must be
            reachable.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <DocxViewerHeader
        name={docName}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        onPrev={goPrev}
        onNext={goNext}
      />
      <div className="relative" style={{ height: "70vh" }}>
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
        <div className="docx-viewer-container">
          <DocumentEditorContainerComponent
            ref={containerRef}
            height="100%"
            serviceUrl={EJ2_SERVICES_URL}
            enableToolbar={false}
            showPropertiesPane={false}
            enableTrackChanges={false}
            enableSpellCheck={false}
            enableComment={false}
            documentEditorSettings={{
              enableOptimizedTextMeasuring: false,
            }}
            created={handleCreated}
          >
          <Inject
            services={[Toolbar, SfdtExport, WordExport, Editor, Selection]}
          />
          </DocumentEditorContainerComponent>
        </div>
      </div>
    </div>
  );
}

function DocxViewerHeader({
  name,
  loading,
  currentPage,
  totalPages,
  onPrev,
  onNext,
}: {
  name: string;
  loading: boolean;
  currentPage: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
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
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
          <span className={loading ? "animate-pulse" : ""}>
            {loading ? "Loading…" : "Read-only"}
          </span>
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPrev}
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
            className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            aria-label="Next page"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
