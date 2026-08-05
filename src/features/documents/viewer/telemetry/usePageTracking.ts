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

    // Sample dwell time every second while the page is being viewed.
    const interval = window.setInterval(() => {
      if (!enabledRef.current) return;
      const page = currentPageRef.current;
      if (page < 1) return;
      queueRef.current?.recordPageDwell(page, SAMPLE_INTERVAL_MS / 1000);
    }, SAMPLE_INTERVAL_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, [queue, enabled]);
}