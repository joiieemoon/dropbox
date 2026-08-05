/**
 * Documents API - sender-side document management and link generation.
 * Uses the real Express backend at http://localhost:4000.
 */

import { backendClient } from "./backendClient";
import { mockStore, mockApi } from "./mockData";
import { fetchRecipients } from "./recipientsApi";
import type { Document, Recipient, TrackingLink } from "../types";

/** Simulated network latency. */
const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

/**
 * List all uploaded documents.
 * Fetches from the backend; falls back to mock data if unavailable.
 */
export async function listDocuments(): Promise<Document[]> {
  try {
    return await backendClient.get<Document[]>("/api/documents");
  } catch {
    await delay();
    return [...mockStore.documents];
  }
}

/**
 * Register a newly uploaded PDF document.
 * Reads the file as a base64 data URL so it can be stored as JSON
 * in localStorage and rendered in the viewer.
 */
export async function registerDocument(
  input: Pick<Document, "name" | "url" | "pageCount" | "sizeBytes"> & {
    file?: File;
    uploadedBy?: string;
  },
): Promise<Document> {
  let dataUrl: string | undefined;
  if (input.file) {
    dataUrl = await readFileAsDataUrl(input.file);
  }
  try {
    return await backendClient.post<Document>("/api/documents", {
      name: input.name,
      url: input.url,
      pageCount: input.pageCount,
      sizeBytes: input.sizeBytes,
      dataUrl,
      uploadedBy: input.uploadedBy,
    });
  } catch {
    // Backend unreachable — fall back to mock store for the POC.
    await delay();
    const doc: Document = {
      id: mockApi.makeToken("doc"),
      name: input.name,
      url: input.url,
      pageCount: input.pageCount,
      sizeBytes: input.sizeBytes,
      dataUrl,
      uploadedAt: new Date().toISOString(),
      sharedWith: [],
      uploadedBy: input.uploadedBy,
    };
    mockApi.addDocument(doc);
    return doc;
  }
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
 * Fetches from the backend; falls back to mock data if unavailable.
 */
export async function listRecipients(): Promise<Recipient[]> {
  try {
    return await backendClient.get<Recipient[]>("/api/recipients");
  } catch {
    return fetchRecipients();
  }
}

/**
 * Share a document with a recipient by generating a tracking link.
 * Calls the backend; falls back to mock link generation if unavailable.
 */
export async function shareDocument(
  documentId: string,
  recipientId: string,
): Promise<TrackingLink> {
  try {
    return await backendClient.post<TrackingLink>("/api/links", {
      documentId,
      recipientId,
    });
  } catch {
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

    // Update the document's sharedWith list.
    const doc = mockStore.documents.find((d) => d.id === documentId);
    if (doc && !doc.sharedWith.includes(recipientId)) {
      doc.sharedWith.push(recipientId);
      // Persist the updated document list.
      try {
        localStorage.setItem(
          "doc_tracking_documents",
          JSON.stringify(mockStore.documents),
        );
      } catch {
        // Ignore persistence errors.
      }
    }

    return link;
  }
}

/**
 * Generate a unique tracking link for a document + recipient.
 */
export async function generateTrackingLink(
  documentId: string,
  recipientId: string,
): Promise<TrackingLink> {
  return shareDocument(documentId, recipientId);
}

/**
 * List all generated tracking links.
 * Fetches from the backend; falls back to mock data if unavailable.
 */
export async function listTrackingLinks(): Promise<TrackingLink[]> {
  try {
    return await backendClient.get<TrackingLink[]>("/api/links");
  } catch {
    await delay();
    return [...mockStore.links];
  }
}
