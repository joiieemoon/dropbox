/**
 * DocxViewer - read-only in-browser viewer for .docx documents
 * built on Syncfusion's DocumentEditorContainerComponent.
 *
 * Page navigation:
 *   - Current page  -> Syncfusion viewChange.startPage
 *   - Total pages   -> Syncfusion documentEditor.pageCount
 *
 * This keeps the custom header synchronized with Syncfusion's
 * own pagination engine.
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

import type { ViewChangeEventArgs } from "@syncfusion/ej2-documenteditor";

/**
 * Syncfusion demo service used for .docx import/export.
 */
export const EJ2_SERVICES_URL =
  "https://document.syncfusion.com/web-services/docx-editor/api/documenteditor/";

interface DocxViewerProps {
  /**
   * A .docx File, data URL, SFDT JSON string, or URL.
   */
  source: File | string | null;

  /**
   * Optional document title.
   */
  title?: string;

  /**
   * Optional fallback page count.
   *
   * Usually this can be omitted.
   */
  pageCount?: number;

  /**
   * Callback when current page changes.
   */
  onPageChange?: (page: number) => void;
  onPageCountChange?: (pageCount: number) => void;
  /**
   * Optional viewer height (CSS value). Defaults to "80vh".
   */
  height?: string;
}

export default function DocxViewer({
  source,
  title,
  pageCount = 1,
  onPageChange,
  onPageCountChange,
  height = "80vh",
}: DocxViewerProps) {
  const containerRef = useRef<ContainerType | null>(null);

  /**
   * Latest source.
   */
  const pendingSource = useRef<File | string | null>(source);

  /**
   * Prevent duplicate initial loading.
   */
  const createdRef = useRef(false);

  /**
   * Current page ref.
   */
  const currentPageRef = useRef(1);

  /**
   * Total page ref.
   *
   * Keeping this in a ref avoids stale values inside callbacks.
   */
  const totalPagesRef = useRef(Math.max(1, pageCount));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [docName, setDocName] = useState(title ?? "");

  const [currentPage, setCurrentPage] = useState(1);

  const [totalPages, setTotalPages] = useState(Math.max(1, pageCount));

  /**
   * Keep onPageCountChange in a ref to avoid stale closures
   * and prevent unnecessary re-renders / flickering.
   */
  const onPageCountChangeRef = useRef(onPageCountChange);
  onPageCountChangeRef.current = onPageCountChange;

  /**
   * Keep source ref updated.
   */
  useEffect(() => {
    pendingSource.current = source;
  }, [source]);

  /**
   * Convert a base64 data URL to a File.
   */
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

      return new File([bytes], filename, {
        type: mimeType,
      });
    },
    [],
  );

  /**
   * ------------------------------------------------------------
   * SYNC TOTAL PAGE COUNT
   * ------------------------------------------------------------
   *
   * Syncfusion's DocumentEditor exposes pageCount as the total
   * number of pages.
   *
   * We read it only from the actual DocumentEditor instance.
   */
  const syncTotalPages = useCallback(() => {
    const editor = containerRef.current?.documentEditor;

    if (!editor) {
      return;
    }

    const count = editor.pageCount;

    /**
     * Only accept a valid positive page count.
     */
    if (typeof count !== "number" || !Number.isFinite(count) || count <= 0) {
      return;
    }

    /**
     * Don't update React unnecessarily.
     */
    if (count === totalPagesRef.current) {
      return;
    }

    /**
     * IMPORTANT:
     *
     * Never allow the fallback "1" to replace a real count.
     */
    totalPagesRef.current = count;
    setTotalPages(count);

    /**
     * Notify parent of the real page count.
     */
    onPageCountChangeRef.current?.(count);
  }, []);

  /**
   * ------------------------------------------------------------
   * RETRY TOTAL PAGE COUNT
   * ------------------------------------------------------------
   *
   * DOCX pagination/layout can finish asynchronously.
   *
   * Therefore we check several times after loading.
   */
  const refreshTotalPageCount = useCallback(() => {
    const delays = [0, 100, 250, 500, 800, 1200, 1800, 2500, 3500];

    delays.forEach((delay) => {
      window.setTimeout(() => {
        syncTotalPages();
      }, delay);
    });
  }, [syncTotalPages]);

  /**
   * ------------------------------------------------------------
   * CURRENT PAGE
   * ------------------------------------------------------------
   *
   * Syncfusion calls this whenever the document viewport changes.
   *
   * startPage is what we use for the header because this is the
   * page at the beginning of the current viewport.
   */
  const handleViewChange = useCallback(
    (args: ViewChangeEventArgs) => {
      /**
       * First update total page count.
       *
       * This is important because pageCount may become available
       * when Syncfusion performs its first layout.
       */
      syncTotalPages();

      const page = args.startPage;

      if (!page || page < 1 || !Number.isFinite(page)) {
        return;
      }

      /**
       * Avoid duplicate React updates.
       */
      if (page === currentPageRef.current) {
        return;
      }

      currentPageRef.current = page;

      setCurrentPage(page);

      onPageChange?.(page);
    },
    [syncTotalPages, onPageChange],
  );

  /**
   * ------------------------------------------------------------
   * DOCUMENT CHANGE
   * ------------------------------------------------------------
   *
   * This fires when the document changes/loads.
   *
   * It is an additional reliable point to retrieve pageCount.
   */
  const handleDocumentChange = useCallback(() => {
    /**
     * Give Syncfusion a chance to finish layout,
     * then repeatedly check pageCount.
     */
    refreshTotalPageCount();

    /**
     * Reset current page to 1 for a newly loaded document.
     */
    currentPageRef.current = 1;
    setCurrentPage(1);
  }, [refreshTotalPageCount]);

  /**
   * ------------------------------------------------------------
   * LOAD DOCUMENT
   * ------------------------------------------------------------
   */
  const loadIntoEditor = useCallback(
    async (src: File | string, name: string) => {
      const container = containerRef.current;

      if (!container) {
        return;
      }

      const editor = container.documentEditor;

      if (!editor) {
        return;
      }

      setLoading(true);
      setError(null);

      /**
       * Reset page information for the new document.
       */
      currentPageRef.current = 1;
      setCurrentPage(1);

      /**
       * Only use the supplied pageCount as a fallback.
       *
       * Syncfusion will replace it with the actual count.
       */
      const fallbackCount = Math.max(1, pageCount);

      totalPagesRef.current = fallbackCount;

      setTotalPages(fallbackCount);

      /**
       * Read-only mode.
       */
      editor.isReadOnly = true;
      editor.enableTrackChanges = false;

      try {
        /**
         * ------------------------------------------------------
         * OPEN DOCUMENT
         * ------------------------------------------------------
         */
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

        /**
         * Re-apply read-only after opening.
         */
        editor.isReadOnly = true;
        editor.enableTrackChanges = false;

        /**
         * Syncfusion has now received the document.
         *
         * Pagination itself can still happen asynchronously,
         * so don't assume pageCount is ready immediately.
         */
        refreshTotalPageCount();

        /**
         * Resize after the document is rendered.
         */
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
        console.error("[DocxViewer] Failed to open document:", e);

        setError(
          "Could not open this document. The Syncfusion document service may be unavailable.",
        );

        setLoading(false);
      }
    },
    [dataUrlToFile, pageCount, refreshTotalPageCount],
  );

  /**
   * ------------------------------------------------------------
   * SYNCFUSION CREATED
   * ------------------------------------------------------------
   */
  const handleCreated = useCallback(() => {
    const container = containerRef.current;

    const editor = container?.documentEditor;

    if (!editor) {
      return;
    }

    /**
     * Configure read-only mode.
     */
    editor.isReadOnly = true;
    editor.enableTrackChanges = false;

    /**
     * IMPORTANT:
     *
     * Current page comes directly from Syncfusion.
     */
    editor.viewChange = handleViewChange;

    /**
     * IMPORTANT:
     *
     * Document loading/layout changes trigger
     * another page-count synchronization.
     */
    editor.documentChange = handleDocumentChange;

    /**
     * Prevent duplicate initial loading.
     */
    if (createdRef.current) {
      return;
    }

    createdRef.current = true;

    /**
     * Load initial document.
     */
    const src = pendingSource.current;

    if (src) {
      void loadIntoEditor(src, title ?? "");
    }

    /**
     * Initial layout.
     */
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

  /**
   * ------------------------------------------------------------
   * SOURCE CHANGED
   * ------------------------------------------------------------
   */
  useEffect(() => {
    if (!createdRef.current) {
      return;
    }

    if (!source) {
      return;
    }

    void loadIntoEditor(source, title ?? "");
  }, [source, title, loadIntoEditor]);

  /**
   * ------------------------------------------------------------
   * GO TO PAGE
   * ------------------------------------------------------------
   *
   * Do not manually set currentPage here.
   *
   * Syncfusion's viewChange event will do it.
   */
  // const goToPage = useCallback(
  //   (page: number) => {
  //     const editor = containerRef.current?.documentEditor;

  //     if (!editor) {
  //       return;
  //     }

  //     /**
  //      * Always get the latest page count
  //      * directly from Syncfusion.
  //      */
  //     const actualTotal =
  //       editor.pageCount || totalPagesRef.current || pageCount;

  //     const target = Math.max(1, Math.min(page, actualTotal));

  //     editor.scrollToPage(target - 1);
  //   },
  //   [pageCount],
  // );

  /**
   * ------------------------------------------------------------
   * PREVIOUS
   * ------------------------------------------------------------
   */
  // const goPrev = useCallback(() => {
  //   if (currentPage <= 1) {
  //     return;
  //   }

  //   goToPage(currentPage - 1);
  // }, [currentPage, goToPage]);

  /**
   * ------------------------------------------------------------
   * NEXT
   * ------------------------------------------------------------
   */
  // const goNext = useCallback(() => {
  //   const editor = containerRef.current?.documentEditor;

  //   /**
  //    * Read latest page count directly
  //    * from Syncfusion.
  //    */
  //   const actualTotal = editor?.pageCount || totalPagesRef.current || pageCount;

  //   if (currentPage >= actualTotal) {
  //     return;
  //   }

  //   goToPage(currentPage + 1);
  // }, [currentPage, pageCount, goToPage]);

  /**
   * ------------------------------------------------------------
   * ERROR UI
   * ------------------------------------------------------------
   */
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

  /**
   * ------------------------------------------------------------
   * MAIN UI
   * ------------------------------------------------------------
   */
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <DocxViewerHeader
        name={docName}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        // // onPrev={goPrev}
        // onNext={goNext}
      />

      <div
        className="relative"
        style={{
          height,
        }}
      >
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

        <div className="docx-viewer-container h-full bg-amber-100">
          <DocumentEditorContainerComponent
            ref={containerRef}
            height="100%"
            // width="70%"
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

/**
 * ============================================================
 * HEADER
 * ============================================================
 */
function DocxViewerHeader({
  name,
  loading,
  currentPage,
  totalPages,
  // onPrev,
  // onNext,
}: {
  name: string;
  loading: boolean;
  currentPage: number;
  totalPages: number;
  // onPrev: () => void;
  // onNext: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
      {/* Document name */}
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

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Read-only */}
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
          <span className={loading ? "animate-pulse" : ""}>
            {loading ? "Loading…" : "Read-only"}
          </span>
        </span>

        {/* Navigation */}
        <div className="flex items-center gap-1">
          {/* Previous */}
          {/* <div className="group relative">
            <button
              type="button"
              onClick={onPrev}
              disabled={currentPage <= 1}
              aria-label="Previous page"
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-300 text-gray-700 transition hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 19.5L8.25 12l7.5-7.5"
                />
              </svg>
            </button>
            <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 dark:bg-gray-700">
              Previous page
            </span>
          </div> */}

          {/* 
            This is now:

              currentPage = viewChange.startPage
              totalPages  = documentEditor.pageCount
          */}
          <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium tabular-nums text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            {currentPage} / {totalPages}
          </span>

          {/* Next */}
          {/* <div className="group relative">
            <button
              type="button"
              onClick={onNext}
              disabled={currentPage >= totalPages}
              aria-label="Next page"
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-300 text-gray-700 transition hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 4.5l7.5 7.5-7.5 7.5"
                />
              </svg>
            </button>
            <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 dark:bg-gray-700">
              Next page
            </span>
          </div> */}
        </div>
      </div>
    </div>
  );
}
