/**
 * usePageTracking - tracks how long a recipient spends on each page
 * using IntersectionObserver. A page counts as "viewed" when at least
 * 50% of it is visible in the viewport.
 *
 * Also tracks the maximum page reached to calculate completion percentage.
 */

import { useEffect, useRef } from "react";
import type { BeaconQueue } from "./BeaconQueue";

/** Minimum ratio of the page element that must be visible. */
const VISIBLE_THRESHOLD = 0.5;

/** How often (ms) to sample dwell time while a page is visible. */
const SAMPLE_INTERVAL_MS = 1_000;

/**
 * Attach IntersectionObserver tracking to page elements.
 *
 * @param pageRefs - refs to the page elements (index 0 = page 1)
 * @param queue - the BeaconQueue to record dwell times into
 * @param enabled - whether tracking is active (e.g. access granted)
 */
export function usePageTracking(
  pageRefs: React.RefObject<(HTMLDivElement | null)[]>,
  queue: BeaconQueue | null,
  enabled: boolean,
): void {
  const queueRef = useRef<BeaconQueue | null>(queue);
  queueRef.current = queue;

  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  useEffect(() => {
    if (!enabled || !queue) return;

    const elements = pageRefs.current;
    if (!elements || elements.length === 0) return;

    /** Map of page number -> currently visible? */
    const visiblePages = new Map<number, boolean>();

    /** Interval that samples dwell time for visible pages. */
    let sampleInterval: number | null = null;

    const startSampling = () => {
      if (sampleInterval !== null) return;
      sampleInterval = window.setInterval(() => {
        if (!enabledRef.current) return;
        visiblePages.forEach((isVisible, page) => {
          if (isVisible) {
            queueRef.current?.recordPageDwell(
              page,
              SAMPLE_INTERVAL_MS / 1000,
            );
          }
        });
      }, SAMPLE_INTERVAL_MS);
    };

    const stopSampling = () => {
      if (sampleInterval !== null) {
        window.clearInterval(sampleInterval);
        sampleInterval = null;
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const element = entry.target as HTMLElement;
          const page = Number(element.dataset.page);
          if (!page) return;

          const isVisible =
            entry.isIntersecting && entry.intersectionRatio >= VISIBLE_THRESHOLD;
          visiblePages.set(page, isVisible);
        });

        // Start/stop the sampling interval based on whether any page is visible.
        const anyVisible = Array.from(visiblePages.values()).some(Boolean);
        if (anyVisible) {
          startSampling();
        } else {
          stopSampling();
        }
      },
      { threshold: [VISIBLE_THRESHOLD] },
    );

    elements.forEach((el, index) => {
      if (!el) return;
      el.dataset.page = String(index + 1);
      observer.observe(el);
    });

    return () => {
      stopSampling();
      observer.disconnect();
      visiblePages.clear();
    };
  }, [pageRefs, queue, enabled]);
}