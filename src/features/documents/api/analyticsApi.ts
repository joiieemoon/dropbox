/**
 * Analytics API - sender-facing analytics queries.
 * Mocked for the POC; swap with real endpoints later.
 */

import { mockStore } from "./mockData";
import type { BeaconPayload, DocumentAnalytics } from "../types";

/** Simulated network latency. */
const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

/**
 * Merge real beacon telemetry into the seeded analytics so the
 * dashboard reflects actual tracked viewing sessions.
 */
function mergeBeaconData(seed: DocumentAnalytics[]): DocumentAnalytics[] {
  const beacons = mockStore.beacons as unknown as BeaconPayload[];

  return seed.map((doc) => {
    const docBeacons = beacons.filter((b) => b.documentId === doc.documentId);
    if (docBeacons.length === 0) return doc;

    // Aggregate dwell times across beacons per page.
    const dwellMap = new Map<number, number>();
    let totalDuration = 0;
    let totalCompletion = 0;

    docBeacons.forEach((b) => {
      b.pageDwells.forEach((p) => {
        dwellMap.set(p.page, (dwellMap.get(p.page) ?? 0) + p.seconds);
      });
      totalDuration += b.totalDurationSec;
      totalCompletion += b.completionPercent;
    });

    // Build per-page average across beacons.
    const avgPageDwell = Array.from({ length: doc.pageCount }, (_, i) => {
      const page = i + 1;
      const total = dwellMap.get(page) ?? 0;
      return Math.round(total / docBeacons.length);
    });

    return {
      ...doc,
      avgDurationSec: Math.round(totalDuration / docBeacons.length),
      avgCompletionPercent: Math.round(totalCompletion / docBeacons.length),
      avgPageDwell,
      recipients: doc.recipients.map((r) => {
        const rb = docBeacons.find((b) => b.recipientId === r.recipientId);
        if (!rb) return r;
        return {
          ...r,
          firstAccessAt: rb.sentAt,
          totalDurationSec: rb.totalDurationSec,
          completionPercent: rb.completionPercent,
          maxPageReached: rb.maxPageReached,
        };
      }),
    };
  });
}

/**
 * List all documents with their analytics.
 */
export async function listDocumentAnalytics(): Promise<DocumentAnalytics[]> {
  await delay();
  return mergeBeaconData(mockStore.analytics);
}

/**
 * Get analytics for a single document.
 */
export async function getDocumentAnalytics(
  documentId: string,
): Promise<DocumentAnalytics | null> {
  await delay();
  const merged = mergeBeaconData(mockStore.analytics);
  return merged.find((a) => a.documentId === documentId) ?? null;
}