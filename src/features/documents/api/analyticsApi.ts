/**
 * Analytics API - reads view events from Firestore.
 * Aggregates documents/{documentId}/views into DocumentAnalytics.
 */

import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { db, auth } from "../../../firebase";
import type { DocumentAnalytics, RecipientAnalytics } from "../types";

/** List all documents with their analytics from Firestore. */
export async function listDocumentAnalytics(): Promise<DocumentAnalytics[]> {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];

  // Fetch all documents owned by the current user.
  const docsQuery = query(collection(db, "documents"), where("ownerId", "==", uid));
  const docsSnap = await getDocs(docsQuery);
  const results: DocumentAnalytics[] = [];

  for (const docSnap of docsSnap.docs) {
    const data = docSnap.data();
    const documentId = docSnap.id;
    const pageCount = data.pageCount ?? 0;
    const sharedWith = data.sharedWith ?? [];

    // Fetch view events for this document.
    const viewsQuery = collection(db, "documents", documentId, "views");
    const viewsSnap = await getDocs(viewsQuery);

    // Aggregate view data.
    // Each beacon flush sends DELTA values (queue is cleared after each flush),
    // so we SUM all events to get the correct total.
    const dwellMap = new Map<number, number>(); // Sum of seconds per page
    let totalDuration = 0; // Sum of all page dwell seconds
    const viewerMap = new Map<string, { seconds: number; completion: number; maxPage: number; firstAccess: string }>();

    viewsSnap.docs.forEach((v) => {
      const vd = v.data();
      const page = vd.page ?? 0;
      const seconds = vd.seconds ?? 0;
      const viewerId = vd.viewerId ?? "";
      const completion = vd.completionPercent ?? 0;

      // Skip summary events (they have completionPercent and duplicate the total)
      if (vd.completionPercent !== undefined) {
        // Still track viewerId and completion for recipient analytics
        if (viewerId) {
          const existing = viewerMap.get(viewerId) ?? { seconds: 0, completion: 0, maxPage: 0, firstAccess: "" };
          existing.completion = Math.max(existing.completion, completion);
          existing.maxPage = Math.max(existing.maxPage, page);
          if (!existing.firstAccess) {
            existing.firstAccess = vd.viewedAt?.toDate?.()?.toISOString() ?? "";
          }
          viewerMap.set(viewerId, existing);
        }
        return;
      }

      // Only process individual page dwell events
      // SUM seconds per page (each flush sends delta since last flush)
      dwellMap.set(page, (dwellMap.get(page) ?? 0) + seconds);
      totalDuration += seconds;

      if (viewerId) {
        const existing = viewerMap.get(viewerId) ?? { seconds: 0, completion: 0, maxPage: 0, firstAccess: "" };
        existing.seconds += seconds;
        existing.maxPage = Math.max(existing.maxPage, page);
        if (!existing.firstAccess) {
          existing.firstAccess = vd.viewedAt?.toDate?.()?.toISOString() ?? "";
        }
        viewerMap.set(viewerId, existing);
      }
    });

    // Calculate average page dwell per recipient (not per event)
    const avgPageDwell = Array.from({ length: pageCount }, (_, i) => {
      const page = i + 1;
      const totalSeconds = dwellMap.get(page) ?? 0;
      
      // Count how many recipients viewed this page
      const recipientsWhoViewed = viewerMap.size;
      
      return Math.round(totalSeconds / Math.max(recipientsWhoViewed, 1));
    });

    // Fetch recipient details from Firestore users collection.
    const recipientPromises = sharedWith.map(async (recipientId: string) => {
      const v = viewerMap.get(recipientId);
      try {
        const userRef = doc(db, "users", recipientId);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();
        return {
          recipientId,
          email: userData?.email ?? "",
          name: userData?.displayName ?? userData?.username ?? "",
          username: userData?.username ?? "",
          emailOpened: false,
          firstAccessAt: v?.firstAccess ?? null,
          totalDurationSec: v?.seconds ?? 0,
          completionPercent: v?.completion ?? 0,
          maxPageReached: v?.maxPage ?? 0,
          events: [],
        } as RecipientAnalytics;
      } catch {
        return {
          recipientId,
          email: "",
          name: "",
          username: "",
          emailOpened: false,
          firstAccessAt: v?.firstAccess ?? null,
          totalDurationSec: v?.seconds ?? 0,
          completionPercent: v?.completion ?? 0,
          maxPageReached: v?.maxPage ?? 0,
          events: [],
        } as RecipientAnalytics;
      }
    });

    const recipients = await Promise.all(recipientPromises);

    // Calculate average completion from viewerMap
    let avgCompletion = 0;
    if (viewerMap.size > 0) {
      const totalCompletion = Array.from(viewerMap.values()).reduce((sum, v) => sum + v.completion, 0);
      avgCompletion = Math.round(totalCompletion / viewerMap.size);
    }

    results.push({
      documentId,
      documentTitle: data.name ?? "",
      pageCount,
      totalRecipients: sharedWith.length,
      openedCount: viewerMap.size,
      openRate: sharedWith.length > 0 ? Math.round((viewerMap.size / sharedWith.length) * 100) : 0,
      avgDurationSec: Math.round(totalDuration / Math.max(viewerMap.size, 1)),
      avgCompletionPercent: avgCompletion,
      avgPageDwell,
      recipients,
    });
  }

  return results;
}

/** Get analytics for a single document. */
export async function getDocumentAnalytics(
  documentId: string,
): Promise<DocumentAnalytics | null> {
  const all = await listDocumentAnalytics();
  return all.find((a) => a.documentId === documentId) ?? null;
}

/**
 * Get per-recipient page dwell data for a document.
 * @param documentId - The document ID
 * @param recipientId - Optional specific recipient ID to filter by
 * Returns a map of recipientId -> array of page dwell times (aggregated by page).
 */
export async function getRecipientPageDwell(
  documentId: string,
  recipientId?: string,
): Promise<Map<string, { page: number; seconds: number }[]>> {
  const viewsQuery = collection(db, "documents", documentId, "views");
  const viewsSnap = await getDocs(viewsQuery);

  const recipientMap = new Map<string, Map<number, number>>();

  viewsSnap.docs.forEach((v) => {
    const vd = v.data();
    const viewerId = vd.viewerId ?? "";
    const page = vd.page ?? 0;
    const seconds = vd.seconds ?? 0;

    // Skip summary events (they have completionPercent)
    if (vd.completionPercent !== undefined) {
      return;
    }

    // If recipientId is specified, only include that recipient's data
    if (recipientId && viewerId !== recipientId) {
      return;
    }

    if (viewerId && page > 0) {
      const pageMap = recipientMap.get(viewerId) ?? new Map<number, number>();
      pageMap.set(page, (pageMap.get(page) || 0) + seconds);
      recipientMap.set(viewerId, pageMap);
    }
  });

  // Convert Map<number, number> to Array<{page, seconds}>
  const result = new Map<string, { page: number; seconds: number }[]>();
  recipientMap.forEach((pageMap, viewerId) => {
    const aggregated = Array.from(pageMap.entries())
      .map(([page, seconds]) => ({ page, seconds }))
      .sort((a, b) => a.page - b.page);
    result.set(viewerId, aggregated);
  });

  return result;
}
