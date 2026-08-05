/**
 * Viewer API - handles the public, unauthenticated viewer flow.
 * Mocked for the POC; swap with real endpoints later.
 */

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
 */
export async function verifyToken(token: string): Promise<VerifyTokenResult> {
  await delay();
  const link = mockStore.links.find((l) => l.token === token);
  if (!link) {
    return { valid: false, emailKnown: false };
  }
  const document = mockStore.documents.find((d) => d.id === link.documentId);
  const recipient = mockStore.recipients.find((r) => r.id === link.recipientId);
  if (!document || !recipient) {
    return { valid: false, emailKnown: false };
  }
  return {
    valid: true,
    emailKnown: true,
    document,
    recipientEmail: recipient.email,
  };
}

/**
 * Submit the recipient's email for a token.
 * In a real system this would send an OTP email.
 */
export async function submitEmail(
  token: string,
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
  token: string,
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
 */
export async function grantSession(token: string): Promise<ViewerSession> {
  await delay();
  const link = mockStore.links.find((l) => l.token === token);
  if (!link) {
    throw new Error("Invalid token");
  }
  const document = mockStore.documents.find((d) => d.id === link.documentId);
  if (!document) {
    throw new Error("Document not found");
  }
  const recipient = mockStore.recipients.find((r) => r.id === link.recipientId);

  const scopedToken = mockApi.makeToken("scoped");
  return {
    documentId: document.id,
    documentTitle: document.name,
    pageCount: document.pageCount,
    scopedToken,
    recipientId: recipient?.id ?? "unknown",
    grantedAt: new Date().toISOString(),
  };
}