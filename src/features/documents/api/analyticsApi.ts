/**
 * Analytics API - sender-facing analytics queries.
 * Uses the real Express backend at http://localhost:4000.
 */

import { backendClient } from "./backendClient";
import { mockStore } from "./mockData";
import { getRecipientByIdSync } from "./recipientsApi";
import type {
  BeaconPayload,
  Document,
  DocumentAnalytics,
  RecipientAnalytics,
} from "../types";

/** Simulated network latency. */
const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

/** Build an empty analytics entry for a document that has no data yet. */
function emptyAnalyticsForDoc(
  documentId: string,
  documentTitle: string,
  pageCount: number,
): DocumentAnalytics {
  // Build recipient analytics from the document's sharedWith list,
  // using the DummyJSON recipients for real user data.
  const doc = mockStore.documents.find((d) => d.id === documentId);
  const recipients: RecipientAnalytics[] = (doc?.sharedWith ?? [])
    .map((recipientId) => {
      const r = getRecipientByIdSync(recipientId);
      if (!r) return null;
      return {
        recipientId: r.id,
        email: r.email,
        name: r.name,
        username: r.username,
        emailOpened: false,
        firstAccessAt: null,
        totalDurationSec: 0,
        completionPercent: 0,
        maxPageReached: 0,
        events: [],
      } as RecipientAnalytics;
    })
    .filter((r): r is RecipientAnalytics => r !== null);

  return {
    documentId,
    documentTitle,
    pageCount,
    totalRecipients: recipients.length,
    openedCount: 0,
    openRate: 0,
    avgDurationSec: 0,
    avgCompletionPercent: 0,
    avgPageDwell: Array.from({ length: pageCount }, () => 0),
    recipients,
  };
}

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
 * Fetches from the backend; falls back to mock data if unavailable.
 */
export async function listDocumentAnalytics(): Promise<DocumentAnalytics[]> {
  try {
    // Fetch all documents from the backend, then fetch analytics for each.
    const docsList = await backendClient.get<Document[]>("/api/documents");
    const results: DocumentAnalytics[] = [];
    for (const doc of docsList) {
      const analytics = await backendClient.get<DocumentAnalytics>(
        `/api/analytics/${doc.id}`,
      );
      if (analytics) results.push(analytics);
    }
    return results;
  } catch {
    // Fall back to mock store if backend is unreachable.
    const seeded = mergeBeaconData(mockStore.analytics);
    mockStore.documents.forEach((doc) => {
      const exists = seeded.some((a) => a.documentId === doc.id);
      if (!exists) {
        seeded.unshift(emptyAnalyticsForDoc(doc.id, doc.name, doc.pageCount));
      }
    });
    return seeded;
  }
}

/**
 * Get analytics for a single document.
 * Fetches from the backend; falls back to mock data if unavailable.
 */
export async function getDocumentAnalytics(
  documentId: string,
): Promise<DocumentAnalytics | null> {
  try {
    return await backendClient.get<DocumentAnalytics>(`/api/analytics/${documentId}`);
  } catch {
    await delay();
    const all = await listDocumentAnalytics();
    return all.find((a) => a.documentId === documentId) ?? null;
  }
}
