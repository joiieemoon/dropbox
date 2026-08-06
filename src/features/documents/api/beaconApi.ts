/**
 * Beacon API - writes viewing telemetry to Firestore.
 * Each beacon creates a view event under documents/{documentId}/views/{viewId}.
 */

import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../../../firebase";
import type { BeaconPayload } from "../types";

/**
 * Send a beacon payload by writing a view event to Firestore.
 * The Firestore security rules enforce that only users with access
 * to the document can create view records.
 */
export async function sendBeacon(payload: BeaconPayload): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  console.log("[beaconApi] Sending beacon:", {
    documentId: payload.documentId,
    pageDwells: payload.pageDwells,
    totalDurationSec: payload.totalDurationSec,
    maxPageReached: payload.maxPageReached,
    completionPercent: payload.completionPercent,
  });

  // Write each page dwell as a separate view event.
  for (const dwell of payload.pageDwells) {
    await addDoc(
      collection(db, "documents", payload.documentId, "views"),
      {
        viewerId: uid,
        page: dwell.page,
        seconds: dwell.seconds,
        viewedAt: serverTimestamp(),
      },
    );
  }

  // Also record the overall session completion.
  await addDoc(
    collection(db, "documents", payload.documentId, "views"),
    {
      viewerId: uid,
      page: payload.maxPageReached,
      seconds: payload.totalDurationSec,
      completionPercent: payload.completionPercent,
      viewedAt: serverTimestamp(),
    },
  );

  console.log(`[beaconApi] Sent ${payload.pageDwells.length} page dwell events + 1 summary event`);
}
