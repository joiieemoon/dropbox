/**
 * Viewer API - handles the public viewer flow using Firebase.
 * Reads shareLinks/{linkId} and verifies access via Firestore.
 */

import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import type { Document, ViewerSession } from "../types";

export interface VerifyTokenResult {
  valid: boolean;
  /** Whether the recipient's email is already known for this token. */
  emailKnown: boolean;
  document?: Document;
  recipientEmail?: string;
}

/**
 * Verify direct access to a document by ID.
 * Used when a logged-in user clicks "View" on a shared document.
 */
export async function verifyDirectAccess(
  documentId: string,
  identity: { uid: string; email: string },
): Promise<VerifyTokenResult> {
  const uid = identity.uid;

  console.log("[verifyDirectAccess] Checking access for:", { documentId, uid });

  // Read documents/{documentId}
  const docRef = doc(db, "documents", documentId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    console.log("[verifyDirectAccess] Document not found");
    return { valid: false, emailKnown: false };
  }

  const data = docSnap.data();
  console.log("[verifyDirectAccess] Document found:", { name: data.name, ownerId: data.ownerId });

  // Check if user has access via access subcollection
  const accessRef = doc(db, "documents", documentId, "access", uid);
  const accessSnap = await getDoc(accessRef);

  console.log("[verifyDirectAccess] Access record exists:", accessSnap.exists());
  if (accessSnap.exists()) {
    console.log("[verifyDirectAccess] Access data:", accessSnap.data());
  }

  const hasAccess = accessSnap.exists() && accessSnap.data()?.active === true;
  console.log("[verifyDirectAccess] Has access:", hasAccess);

  if (!hasAccess) return { valid: false, emailKnown: false };

  const document: Document = {
    id: docSnap.id,
    name: data.name ?? "",
    url: data.dataUrl ?? "",
    dataUrl: data.dataUrl ?? "",
    pageCount: data.pageCount ?? 0,
    sizeBytes: data.sizeBytes ?? 0,
    uploadedAt: data.createdAt?.toDate?.()?.toISOString() ?? "",
    sharedWith: data.sharedWith ?? [],
    uploadedBy: data.ownerId ?? "",
    ownerId: data.ownerId ?? "",
  };

  return { valid: true, emailKnown: true, document, recipientEmail: identity.email };
}

/**
 * Verify a tracking token (shareLinks/{linkId}).
 * The authenticated user must be the link recipient or the document owner.
 */
export async function verifyToken(
  token: string,
  identity: { uid: string; email: string },
): Promise<VerifyTokenResult> {
  // Use the identity uid passed from ViewerGate instead of auth.currentUser
  const uid = identity.uid;

  console.log("[verifyToken] Verifying token:", { token, uid });

  if (!uid) {
    console.log("[verifyToken] No user ID in identity");
    return { valid: false, emailKnown: false };
  }

  // 1. Read shareLinks/{linkId}
  const linkRef = doc(db, "shareLinks", token);
  const linkSnap = await getDoc(linkRef);

  console.log("[verifyToken] Link exists:", linkSnap.exists());
  if (!linkSnap.exists()) {
    console.log("[verifyToken] Link not found");
    return { valid: false, emailKnown: false };
  }

  const link = linkSnap.data();
  console.log("[verifyToken] Link data:", { documentId: link.documentId, recipientId: link.recipientId, active: link.active });

  if (!link.active) {
    console.log("[verifyToken] Link not active");
    return { valid: false, emailKnown: false };
  }

  // 2. Check if user has active access via access subcollection
  // The access subcollection is the source of truth for permissions
  const accessRef = doc(db, "documents", link.documentId, "access", uid);
  const accessSnap = await getDoc(accessRef);

  console.log("[verifyToken] Access record exists:", accessSnap.exists());
  if (accessSnap.exists()) {
    console.log("[verifyToken] Access data:", accessSnap.data());
  }

  const hasAccess = accessSnap.exists() && accessSnap.data()?.active === true;
  console.log("[verifyToken] Has access:", hasAccess);

  // User must have active access in the access subcollection
  if (!hasAccess) {
    console.log("[verifyToken] Access denied - no active access");
    return { valid: false, emailKnown: false };
  }

  // 3. Read documents/{documentId}
  const docRef = doc(db, "documents", link.documentId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return { valid: false, emailKnown: false };

  const data = docSnap.data();

  // Step 2 already validated access (isLinkRecipient || hasAccess)
  // No need for redundant check here

  const document: Document = {
    id: docSnap.id,
    name: data.name ?? "",
    url: data.dataUrl ?? "",
    dataUrl: data.dataUrl ?? "",
    pageCount: data.pageCount ?? 0,
    sizeBytes: data.sizeBytes ?? 0,
    uploadedAt: data.createdAt?.toDate?.()?.toISOString() ?? "",
    sharedWith: data.sharedWith ?? [],
    uploadedBy: data.ownerId ?? "",
    ownerId: data.ownerId ?? "",
  };

  return { valid: true, emailKnown: true, document, recipientEmail: identity.email };
}

/**
 * Submit the recipient's email for a token.
 * With Firebase Auth, the user is already authenticated, so this is a no-op.
 */
export async function submitEmail(
  token: string,
  email: string,
): Promise<{ success: boolean; message: string }> {
  void token;
  if (!email || !email.includes("@")) {
    return { success: false, message: "Please enter a valid email address." };
  }
  return { success: true, message: "Access granted." };
}

/**
 * Verify the OTP code. With Firebase Auth, the user is already authenticated.
 */
export async function verifyOtp(
  token: string,
  otp: string,
): Promise<{ success: boolean; message: string }> {
  void token;
  void otp;
  return { success: true, message: "Access granted." };
}

/**
 * Grant a viewer session. Returns the scoped session used for telemetry.
 * The Firebase UID is the secure identity for the session.
 */
export async function grantSession(
  tokenOrId: string,
  identity: { uid: string; email: string },
): Promise<ViewerSession> {
  // Try to verify as a token first, then as direct access
  let result = await verifyToken(tokenOrId, identity);
  console.log(result, "result testing ");
  // If token verification failed, try direct access
  if (!result.valid) {
    result = await verifyDirectAccess(tokenOrId, identity);
  }

  if (!result.valid || !result.document) {
    throw new Error("Permission denied");
  }

  const document = result.document;
  return {
    documentId: document.id,
    documentTitle: document.name,
    pageCount: document.pageCount,
    scopedToken: tokenOrId,
    recipientId: identity.uid,
    grantedAt: new Date().toISOString(),
  };
}
