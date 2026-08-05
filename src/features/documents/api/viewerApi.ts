/**
 * Viewer API - handles the public, unauthenticated viewer flow.
 * Uses the real Express backend at http://localhost:4000.
 */

import { backendClient } from "./backendClient";
import { mockStore, mockApi } from "./mockData";
import type { Document, ViewerSession } from "../types";

/** Simulated network latency. */
const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

export interface VerifyTokenResult {
  valid: boolean;
  /** Whether the recipient's email is already known for this token. */
  emailKnown: boolean;
  document?: Document;
  recipientEmail?: string;
}

/**
 * Verify a tracking token. Returns whether the token is valid and
 * whether we already know the recipient's email (so we can skip
 * the email step and go straight to OTP).
 *
 * The authenticated user must be the recipient assigned to this link,
 * or the document uploader. The token alone is not permission to view.
 */
export async function verifyToken(
  token: string,
  viewerRecipientId: string,
): Promise<VerifyTokenResult> {
  try {
    return await backendClient.get<VerifyTokenResult>(
      `/api/links/${token}?viewerRecipientId=${viewerRecipientId}`,
    );
  } catch {
    // 404 => invalid token; fall back to mock logic if backend is unreachable.
    await delay();
    const link = mockStore.links.find((l) => l.token === token);
    if (!link) {
      return { valid: false, emailKnown: false };
    }
    const document = mockStore.documents.find((d) => d.id === link.documentId);
    if (!document) {
      return { valid: false, emailKnown: false };
    }
    // A viewer is authorized if they are the link's intended recipient,
    // are in the document's explicit sharedWith list (valid sharing record),
    // or are the document uploader.
    const isAuthorizedViewer =
      viewerRecipientId === link.recipientId ||
      document.sharedWith.includes(viewerRecipientId) ||
      viewerRecipientId === document.uploadedBy;
    if (!isAuthorizedViewer) {
      return { valid: false, emailKnown: false };
    }
    return {
      valid: true,
      emailKnown: true,
      document,
    };
  }
}

/**
 * Submit the recipient's email for a token.
 * In a real system this would send an OTP email.
 */
export async function submitEmail(
  _token: string,
  email: string,
): Promise<{ success: boolean; message: string }> {
  await delay();
  if (!email || !email.includes("@")) {
    return { success: false, message: "Please enter a valid email address." };
  }
  return { success: true, message: "OTP sent to your email." };
}

/**
 * Verify the OTP code. For the POC, any 6-digit code works.
 */
export async function verifyOtp(
  _token: string,
  otp: string,
): Promise<{ success: boolean; message: string }> {
  await delay();
  if (!/^\d{6}$/.test(otp)) {
    return { success: false, message: "OTP must be 6 digits." };
  }
  return { success: true, message: "Access granted." };
}

/**
 * Grant a viewer session. Returns the scoped session used for telemetry.
 * Verifies access via the backend first, then issues a local scoped token.
 */
export async function grantSession(
  token: string,
  viewerRecipientId: string,
): Promise<ViewerSession> {
  // Verify access against the backend first.
  const result = await verifyToken(token, viewerRecipientId);
  if (!result.valid || !result.document) {
    throw new Error("Permission denied");
  }

  const document = result.document;
  const scopedToken = mockApi.makeToken("scoped");
  return {
    documentId: document.id,
    documentTitle: document.name,
    pageCount: document.pageCount,
    scopedToken,
    recipientId: viewerRecipientId,
    grantedAt: new Date().toISOString(),
  };
}
