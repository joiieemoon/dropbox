/**
 * useBeaconDispatcher - flushes the BeaconQueue:
 *  - every 5 seconds (interval)
 *  - on document visibility change (tab hidden/visible)
 *  - on page unload (navigator.sendBeacon with fetch fallback)
 */

import { useEffect, useRef } from "react";
import type { BeaconQueue } from "./BeaconQueue";
import { sendBeacon } from "../../api/beaconApi";

const FLUSH_INTERVAL_MS = 5_000;

/**
 * Send a payload. For the POC this routes through the mock beaconApi.
 * In production, swap `sendBeacon` with a real implementation that uses
 * navigator.sendBeacon (with a fetch keepalive fallback):
 *
 *   const body = JSON.stringify(payload);
 *   if (navigator.sendBeacon) {
 *     navigator.sendBeacon("/api/beacon", new Blob([body], { type: "application/json" }));
 *   } else {
 *     fetch("/api/beacon", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true });
 *   }
 */
function sendPayload(payload: Parameters<typeof sendBeacon>[0]): void {
  void sendBeacon(payload);
}

/**
 * Hook that wires a BeaconQueue to periodic + lifecycle flushes.
 * Returns a stable flush function for manual flushes.
 */
export function useBeaconDispatcher(queue: BeaconQueue | null): () => void {
  const queueRef = useRef<BeaconQueue | null>(queue);
  queueRef.current = queue;

  const flushRef = useRef<() => void>(() => {});

  // Keep a stable flush function.
  flushRef.current = () => {
    const q = queueRef.current;
    if (!q) return;
    const payload = q.flush();
    if (payload) {
      sendPayload(payload);
    }
  };

  useEffect(() => {
    if (!queue) return;

    // 1. Flush every 5 seconds.
    const intervalId = window.setInterval(() => {
      flushRef.current();
    }, FLUSH_INTERVAL_MS);

    // 2. Flush on visibility change.
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushRef.current();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // 3. Flush on page unload.
    const handlePageHide = () => {
      flushRef.current();
    };
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      // Final flush on unmount.
      flushRef.current();
    };
  }, [queue]);

  return flushRef.current;
}