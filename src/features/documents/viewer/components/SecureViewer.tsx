/**
 * SecureViewer - renders the PDF once access is granted and wires up
 * the telemetry pipeline (BeaconQueue + useBeaconDispatcher + time tracking).
 *
 * Uses strict per-page viewing: only one page is shown at a time with
 * prev/next navigation. The timer is NOT shown to the viewer (recipient).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import ViewerGate from "./ViewerGate";
import PdfPageRenderer from "./PdfPageRenderer";
import { BeaconQueue } from "../telemetry/BeaconQueue";
import { useBeaconDispatcher } from "../telemetry/useBeaconDispatcher";
import { usePageTracking } from "../telemetry/usePageTracking";
import { useViewerSessionStore } from "../store/viewerSessionStore";
import type { Document } from "../../types";

export default function SecureViewer() {
  const session = useViewerSessionStore((s) => s.session);
  const [currentPage, setCurrentPage] = useState(1);

  // Create a BeaconQueue once the session is granted.
  const queue = useMemo(() => {
    if (!session) return null;
    return new BeaconQueue({
      sessionId: `session_${Date.now()}`,
      scopedToken: session.scopedToken,
      documentId: session.documentId,
      recipientId: session.recipientId,
      pageCount: session.pageCount,
    });
  }, [session]);

  // Wire the dispatcher (flush every 5s, on visibility change, on unload).
  useBeaconDispatcher(queue);

  // Track time spent on the current page.
  usePageTracking(currentPage, queue, !!session);

  // Reset to page 1 when the session changes.
  useEffect(() => {
    setCurrentPage(1);
  }, [session?.documentId]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  return (
    <ViewerGate>
      {(document: Document) => (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
          <SecureViewerHeader
            document={document}
            currentPage={currentPage}
            onPageChange={handlePageChange}
          />
          <main className="mx-auto max-w-5xl px-4 py-6">
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
              {document.dataUrl || document.url ? (
                <PdfPageRenderer
                  pdfSource={document.dataUrl ?? document.url}
                  pageNumber={currentPage}
                />
              ) : (
                <div className="flex h-[80vh] items-center justify-center">
                  <p className="text-sm text-gray-400">
                    This document has no embedded PDF preview.
                  </p>
                </div>
              )}
            </div>
          </main>
        </div>
      )}
    </ViewerGate>
  );
}

function SecureViewerHeader({
  document,
  currentPage,
  onPageChange,
}: {
  document: Document;
  currentPage: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = document.pageCount;

  const goPrev = useCallback(() => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  }, [currentPage, onPageChange]);

  const goNext = useCallback(() => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  }, [currentPage, totalPages, onPageChange]);

  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 backdrop-blur dark:border-gray-800 dark:bg-gray-900/90">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold text-gray-800 dark:text-white">
            {document.name}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Page {currentPage} of {totalPages}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Pagination controls */}
          <button
            type="button"
            onClick={goPrev}
            disabled={currentPage <= 1}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            aria-label="Previous page"
          >
            ← Prev
          </button>
          <span className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium tabular-nums text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={goNext}
            disabled={currentPage >= totalPages}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            aria-label="Next page"
          >
            Next →
          </button>
        </div>
      </div>
    </header>
  );
}
