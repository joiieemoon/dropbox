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
    const dwellMap = new Map<number, number>();
    let totalDuration = 0;
    let totalCompletion = 0;
    const viewerMap = new Map<string, { seconds: number; completion: number; maxPage: number; firstAccess: string }>();

    viewsSnap.docs.forEach((v) => {
      const vd = v.data();
      const page = vd.page ?? 0;
      const seconds = vd.seconds ?? 0;
      const viewerId = vd.viewerId ?? "";
      const completion = vd.completionPercent ?? 0;

      dwellMap.set(page, (dwellMap.get(page) ?? 0) + seconds);
      totalDuration += seconds;
      totalCompletion += completion;

      if (viewerId) {
        const existing = viewerMap.get(viewerId) ?? { seconds: 0, completion: 0, maxPage: 0, firstAccess: "" };
        existing.seconds += seconds;
        existing.completion = Math.max(existing.completion, completion);
        existing.maxPage = Math.max(existing.maxPage, page);
        if (!existing.firstAccess) {
          existing.firstAccess = vd.viewedAt?.toDate?.()?.toISOString() ?? "";
        }
        viewerMap.set(viewerId, existing);
      }
    });

    const avgPageDwell = Array.from({ length: pageCount }, (_, i) => {
      const page = i + 1;
      return Math.round((dwellMap.get(page) ?? 0) / Math.max(viewsSnap.size, 1));
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

    results.push({
      documentId,
      documentTitle: data.name ?? "",
      pageCount,
      totalRecipients: sharedWith.length,
      openedCount: viewerMap.size,
      openRate: sharedWith.length > 0 ? Math.round((viewerMap.size / sharedWith.length) * 100) : 0,
      avgDurationSec: Math.round(totalDuration / Math.max(viewsSnap.size, 1)),
      avgCompletionPercent: Math.round(totalCompletion / Math.max(viewsSnap.size, 1)),
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