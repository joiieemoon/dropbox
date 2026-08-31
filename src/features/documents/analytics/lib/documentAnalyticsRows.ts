import type { DocumentAnalytics } from "../../types";

export interface SharedRecipient {
  id: string;
  name: string;
  email: string;
  /** Whether the recipient has viewed the document (access status). */
  viewed: boolean;
}

/** A single row of the document analytics table (one uploaded document). */
export interface DocumentAnalyticsRow {
  documentId: string;
  documentTitle: string;
  sharedWith: SharedRecipient[];
  /** Total number of views. */
  views: number;
  /** Average viewing duration in seconds (0 = no data). */
  avgDurationSec: number;
  /** Completion percentage 0-100. */
  completionPercent: number;
  /** ISO timestamp of the most recent viewing activity, or null. */
  lastActivityAt: string | null;
}

/**
 * Map the already-loaded DocumentAnalytics payload into table rows.
 * Kept as a pure mapper so the table can later be connected to a real API
 * simply by feeding it different row sources.
 */
export function buildDocumentAnalyticsRows(
  analytics: DocumentAnalytics[],
): DocumentAnalyticsRow[] {
  return analytics.map((a) => {
    let lastActivityAt: string | null = null;
    for (const r of a.recipients) {
      if (r.firstAccessAt && (!lastActivityAt || r.firstAccessAt > lastActivityAt)) {
        lastActivityAt = r.firstAccessAt;
      }
    }

    return {
      documentId: a.documentId,
      documentTitle: a.documentTitle,
      sharedWith: a.recipients.map((r) => ({
        id: r.recipientId,
        name: r.name || r.username || r.email || r.recipientId,
        email: r.email,
        viewed: Boolean(r.firstAccessAt),
      })),
      views: a.openedCount,
      avgDurationSec: a.avgDurationSec,
      completionPercent: a.avgCompletionPercent,
      lastActivityAt,
    };
  });
}
