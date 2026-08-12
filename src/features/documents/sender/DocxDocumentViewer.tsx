/**
 * DocxDocumentViewer - dedicated in-app page for viewing a saved .docx document.
 * Reads the document from Firestore by ID and renders it in the DocxViewer.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DocxViewer from "./components/DocxViewer";
import { getDocumentById } from "../api/documentsApi";
import { BeaconQueue } from "../viewer/telemetry/BeaconQueue";
import { useBeaconDispatcher } from "../viewer/telemetry/useBeaconDispatcher";
import { usePageTracking } from "../viewer/telemetry/usePageTracking";
import { useViewerSessionStore } from "../viewer/store/viewerSessionStore";
import type { Document } from "../types";

export default function DocxDocumentViewer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const session = useViewerSessionStore((s) => s.session);

  // Create a BeaconQueue once the document is loaded.
  const queue = useMemo(() => {
    if (!doc) return null;
    return new BeaconQueue({
      sessionId: `docx_session_${Date.now()}`,
      scopedToken: id ?? "",
      documentId: doc.id,
      recipientId: session?.recipientId ?? doc.ownerId ?? "",
      pageCount: Math.max(1, doc.pageCount),
    });
  }, [doc, id, session?.recipientId]);

  // Wire the dispatcher (flush every 5s, on visibility change, on unload).
  useBeaconDispatcher(queue);

  // Track time spent on the current page.
  usePageTracking(currentPage, queue, !!doc);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    getDocumentById(id)
      .then((d) => {
        if (!d) throw new Error("Document not found");
        setDoc(d);
      })
      .catch((e) => {
        console.error("[DocxDocumentViewer] Failed to load document:", e);
        setError("Could not load this document. It may have been deleted.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  // Reset to page 1 when the document changes.
  useEffect(() => {
    setCurrentPage(1);
  }, [doc?.id]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    console.log("[DocxDocumentViewer] page changed:", page);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-sm text-red-600 dark:text-red-400">
          {error || "Document not found"}
        </p>
        <button
          type="button"
          onClick={() => navigate("/docx-viewer")}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
        >
          ← Back to Word Documents
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/docx-viewer")}
            className="rounded-lg border border-gray-300 p-1.5 text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            aria-label="Back to Word Documents"
          >
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
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
              {doc.name}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Word Document Viewer · Page {currentPage} of {Math.max(1, doc.pageCount)}
            </p>
          </div>
        </div>
      </div>

      <DocxViewer
        source={doc.dataUrl ?? doc.url ?? null}
        title={doc.name}
        pageCount={doc.pageCount}
        onPageChange={handlePageChange}
        height="60vh"
      />
    </div>
  );
}