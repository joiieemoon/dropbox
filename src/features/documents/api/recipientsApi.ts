/**
 * Recipients API - reads users from Firestore.
 * Recipients are Firebase users who can be granted document access.
 */

import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../firebase";
import type { Recipient } from "../types";

/** Cache of fetched recipients to avoid repeated network calls. */
let recipientsCache: Recipient[] | null = null;

/**
 * Fetch recipients from Firestore users collection.
 * Returns cached recipients if already fetched.
 */
export async function fetchRecipients(): Promise<Recipient[]> {
  if (recipientsCache) {
    return [...recipientsCache];
  }

  try {
    const snap = await getDocs(collection(db, "users"));
    const recipients: Recipient[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        email: data.email ?? "",
        name: data.displayName ?? data.username ?? "",
        username: data.username ?? data.email?.split("@")[0] ?? "",
      } as Recipient;
    });
    recipientsCache = recipients;
    return [...recipients];
  } catch (error) {
    console.error("Failed to fetch recipients:", error);
    return [];
  }
}

/**
 * Synchronously get a recipient by ID.
 * Uses the cache if available.
 */
export function getRecipientByIdSync(recipientId: string): Recipient | undefined {
  return recipientsCache?.find((r) => r.id === recipientId);
}

/**
 * Get a recipient by ID, fetching from Firestore if needed.
 */
export async function getRecipientById(
  recipientId: string,
): Promise<Recipient | undefined> {
  const recipients = await fetchRecipients();
  return recipients.find((r) => r.id === recipientId);
}
