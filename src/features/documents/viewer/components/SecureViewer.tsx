/**
 * SecureViewer - renders the PDF once access is granted and wires up
 * the telemetry pipeline (BeaconQueue + useBeaconDispatcher + time tracking).
 */

import { useEffect, useMemo, useState } from "react";
import ViewerGate from "./ViewerGate";
import { BeaconQueue } from "../telemetry/BeaconQueue";
import { useBeaconDispatcher } from "../telemetry/useBeaconDispatcher";
import { useViewerSessionStore } from "../store/viewerSessionStore";
import type { Document } from "../../types";

export default function SecureViewer() {
  const session = useViewerSessionStore((s) => s.session);
  const [elapsedSec, setElapsedSec] = useState(0);

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

  // Track real time spent viewing the document.
  useEffect(() => {
    if (!session) return;
    const startedAt = Date.now();
    const interval = window.setInterval(() => {
      const sec = Math.floor((Date.now() - startedAt) / 1000);
      setElapsedSec(sec);
      // Feed the total duration into the beacon payload via recordPageDwell.
      queue?.recordPageDwell(1, 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [session, queue]);

  return (
    <ViewerGate>
      {(document: Document) => (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
          <SecureViewerHeader
            document={document}
            queue={queue}
            elapsedSec={elapsedSec}
          />
          <main className="mx-auto max-w-5xl px-4 py-6">
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
              {document.dataUrl || document.url ? (
                <iframe
                  title={document.name}
                  src={document.dataUrl ?? document.url}
                  className="h-[85vh] w-full"
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
  queue,
  elapsedSec,
}: {
  document: Document;
  queue: BeaconQueue | null;
  elapsedSec: number;
}) {
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 backdrop-blur dark:border-gray-800 dark:bg-gray-900/90">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold text-gray-800 dark:text-white">
            {document.name}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {document.pageCount} pages · Secure viewer
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium tabular-nums text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            ⏱ {formatTime(elapsedSec)}
          </span>
          <button
            type="button"
            onClick={() => queue?.recordInteraction("zoom", 1)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Zoom
          </button>
          <button
            type="button"
            onClick={() => {
              queue?.recordInteraction("download", 1);
              const href = document.dataUrl ?? document.url;
              if (href) {
                const a = window.document.createElement("a");
                a.href = href;
                a.download = document.name;
                a.click();
              }
            }}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Download
          </button>
        </div>
      </div>
    </header>
  );
}