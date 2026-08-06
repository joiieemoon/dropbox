/**
 * Maps Firebase Auth users to document-tracking identities.
 *
 * Firebase UID is the secure, stable identity for all ownerId,
 * recipientId, and access records. Do NOT map users as rec_X.
 */

import { auth } from "../../../firebase";
import type { UserProfile } from "../../../api/types/auth.types";
import type { Document, Recipient } from "../types";

export interface ViewerIdentity {
  username: string;
  recipientId: string;
  uid: string;
  email: string;
}

/**
 * Read the signed-in account from Firebase Auth.
 * Returns the Firebase UID as the secure identity.
 */
export function getStoredViewerIdentity(): ViewerIdentity | null {
  if (typeof window === "undefined") return null;
  const user = auth.currentUser;
  if (!user) return null;
  return {
    username: user.displayName ?? user.email?.split("@")[0] ?? "",
    recipientId: user.uid,
    uid: user.uid,
    email: user.email ?? "",
  };
}

/** Resolve the logged-in user's tracking identity from Firebase. */
export function getViewerIdentity(
  user: UserProfile,
  recipients: Recipient[] = [],
): ViewerIdentity {
  void recipients;
  const uid = user.firebaseUid ?? "";
  return {
    username: user.username,
    recipientId: uid,
    uid,
    email: user.email,
  };
}

/** Whether the user owns this document (checks Firebase UID). */
export function isDocumentOwner(
  doc: Document,
  identity: ViewerIdentity,
): boolean {
  if (!doc.ownerId) return false;
  return doc.ownerId === identity.uid;
}

/** Whether a viewer may open a shared link for this document. */
export function canViewSharedDocument(
  doc: Document,
  linkRecipientId: string,
  identity: ViewerIdentity,
): boolean {
  return (
    identity.uid === linkRecipientId ||
    doc.sharedWith.includes(identity.uid) ||
    isDocumentOwner(doc, identity)
  );
}
