/**
 * Documents API - sender-side document management and link generation.
 * Mocked for the POC; swap with real endpoints later.
 */

import { mockStore, mockApi } from "./mockData";
import type { Document, Recipient, TrackingLink } from "../types";

/** Simulated network latency. */
const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

/**
 * List all uploaded documents.
 */
export async function listDocuments(): Promise<Document[]> {
  await delay();
  return [...mockStore.documents];
}

/**
 * Register a newly uploaded PDF document.
 * Reads the file as a base64 data URL so it can be stored as JSON
 * in localStorage and rendered in the viewer.
 */
export async function registerDocument(
  input: Pick<Document, "name" | "url" | "pageCount" | "sizeBytes"> & {
    file?: File;
  },
): Promise<Document> {
  await delay();
  let dataUrl: string | undefined;
  if (input.file) {
    dataUrl = await readFileAsDataUrl(input.file);
  }
  const doc: Document = {
    id: mockApi.makeToken("doc"),
    name: input.name,
    url: input.url,
    pageCount: input.pageCount,
    sizeBytes: input.sizeBytes,
    dataUrl,
    uploadedAt: new Date().toISOString(),
  };
  mockApi.addDocument(doc);
  return doc;
}

/** Read a File as a base64 data URL. */
function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * List all recipients.
 */
export async function listRecipients(): Promise<Recipient[]> {
  await delay();
  return [...mockStore.recipients];
}

/**
 * Generate a unique tracking link for a document + recipient.
 */
export async function generateTrackingLink(
  documentId: string,
  recipientId: string,
): Promise<TrackingLink> {
  await delay();
  const token = mockApi.makeToken("v");
  const link: TrackingLink = {
    id: mockApi.makeToken("link"),
    documentId,
    recipientId,
    token,
    url: `${window.location.origin}/v/${token}`,
    createdAt: new Date().toISOString(),
  };
  mockApi.addLink(link);
  return link;
}

/**
 * List all generated tracking links.
 */
export async function listTrackingLinks(): Promise<TrackingLink[]> {
  await delay();
  return [...mockStore.links];
}