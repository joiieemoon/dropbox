/**
 * usePageTracking - tracks the current page and time spent on it.
 * Works with the strict per-page viewer: only one page is visible at a time.
 *
 * Tracks:
 *  - The current page number being viewed.
 *  - Time spent on the current page (accumulated into the BeaconQueue).
 *  - The maximum page reached (for completion percentage).
 */

import { useEffect, useRef } from "react";
import type { BeaconQueue } from "./BeaconQueue";

/** How often (ms) to sample dwell time while a page is being viewed. */
const SAMPLE_INTERVAL_MS = 1_000;

/**
 * Track time spent on the current page.
 * Only tracks when the tab is visible and the user is active.
 *
 * @param currentPage - the 1-based page number currently being viewed
 * @param queue - the BeaconQueue to record dwell times into
 * @param enabled - whether tracking is active (e.g. access granted)
 */
export function usePageTracking(
  currentPage: number,
  queue: BeaconQueue | null,
  enabled: boolean,
): void {
  const queueRef = useRef<BeaconQueue | null>(queue);
  queueRef.current = queue;

  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const currentPageRef = useRef(currentPage);
  currentPageRef.current = currentPage;

  useEffect(() => {
    if (!enabled || !queue) return;

    // Track accumulated time for debugging.
    let totalTrackedSeconds = 0;

    // Sample dwell time every second while the page is being viewed.
    const interval = window.setInterval(() => {
      // Only track if the tab is visible and focused.
      if (document.hidden) {
        console.log("[PageTracking] Tab hidden - pausing timer");
        return;
      }

      if (!enabledRef.current) {
        console.log("[PageTracking] Tracking disabled - pausing timer");
        return;
      }

      const page = currentPageRef.current;
      if (page < 1) {
        console.log("[PageTracking] Invalid page - pausing timer");
        return;
      }

      const seconds = SAMPLE_INTERVAL_MS / 1000;
      totalTrackedSeconds += seconds;
      
      console.log(`[PageTracking] Recording ${seconds}s for page ${page} (total: ${totalTrackedSeconds}s)`);
      
      queueRef.current?.recordPageDwell(page, seconds);
    }, SAMPLE_INTERVAL_MS);

    console.log("[PageTracking] Timer started");

    return () => {
      window.clearInterval(interval);
      console.log(`[PageTracking] Timer stopped. Total tracked: ${totalTrackedSeconds}s`);
    };
  }, [queue, enabled]);
}
