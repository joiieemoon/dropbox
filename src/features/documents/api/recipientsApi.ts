/**
 * Recipients API - shared recipient lookup.
 * Fetches from the real Express backend at http://localhost:4000.
 */

import { backendClient } from "./backendClient";
import type { Recipient } from "../types";

/** Cache of fetched recipients to avoid repeated network calls. */
let recipientsCache: Recipient[] | null = null;

/** Fallback seed recipients if the backend is unavailable. */
const fallbackRecipients: Recipient[] = [
  { id: "rec_1", email: "alice@acme.com", name: "Alice Johnson", username: "alice" },
  { id: "rec_2", email: "bob@globex.com", name: "Bob Smith", username: "bob" },
  { id: "rec_3", email: "carol@initech.com", name: "Carol White", username: "carol" },
  { id: "rec_4", email: "dave@umbrella.com", name: "Dave Brown", username: "dave" },
  { id: "rec_5", email: "erin@stark.com", name: "Erin Davis", username: "erin" },
];

/**
 * Fetch recipients from the backend.
 * Returns cached recipients if already fetched.
 */
export async function fetchRecipients(): Promise<Recipient[]> {
  // Return cached recipients if available.
  if (recipientsCache) {
    return [...recipientsCache];
  }

  try {
    const recipients = await backendClient.get<Recipient[]>("/api/recipients");
    recipientsCache = recipients;
    return [...recipients];
  } catch {
    // Fall back to seed recipients if the backend is unreachable.
    return [...fallbackRecipients];
  }
}

/**
 * Synchronously get a recipient by ID.
 * Uses the cache if available, otherwise falls back to the seed data.
 */
export function getRecipientByIdSync(recipientId: string): Recipient | undefined {
  if (recipientsCache) {
    return recipientsCache.find((r) => r.id === recipientId);
  }
  return fallbackRecipients.find((r) => r.id === recipientId);
}

/**
 * Get a recipient by ID, fetching from the API if needed.
 */
export async function getRecipientById(
  recipientId: string,
): Promise<Recipient | undefined> {
  const recipients = await fetchRecipients();
  return recipients.find((r) => r.id === recipientId);
}