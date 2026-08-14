/**
 * Documents API - sender-side document management and link generation.
 * Uses the real Express backend at http://localhost:4000.
 */

import {
  collection,
  doc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  setDoc,
  getDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "../../../firebase";
import type { Document, Recipient, RevisionMeta, TrackingLink } from "../types";

/**
 * Get a single document by ID.
 */
export async function getDocumentById(id: string): Promise<Document | null> {
  const docRef = doc(db, "documents", id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    name: data.name ?? "",
    url: data.dataUrl ?? data.latestDocxUrl ?? "",
    dataUrl: data.dataUrl ?? "",
    pageCount: data.pageCount ?? 0,
    sizeBytes: data.sizeBytes ?? 0,
    uploadedAt: data.createdAt?.toDate?.()?.toISOString() ?? "",
    sharedWith: data.sharedWith ?? [],
    uploadedBy: data.ownerId ?? "",
    ownerId: data.ownerId ?? "",
    docType: data.docType ?? "pdf",
    currentVersion: data.currentVersion ?? undefined,
    latestPdfUrl: data.latestPdfUrl ?? undefined,
    latestDocxUrl: data.latestDocxUrl ?? undefined,
    revisions: data.revisions ?? [],
  } as Document;
}

/**
 * List all documents owned by the current Firebase user.
 */
export async function listDocuments(): Promise<Document[]> {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];
  const q = query(collection(db, "documents"), where("ownerId", "==", uid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: data.name ?? "",
      url: data.dataUrl ?? data.latestDocxUrl ?? "",
      dataUrl: data.dataUrl ?? "",
      pageCount: data.pageCount ?? 0,
      sizeBytes: data.sizeBytes ?? 0,
      uploadedAt: data.createdAt?.toDate?.()?.toISOString() ?? "",
      sharedWith: data.sharedWith ?? [],
      uploadedBy: data.ownerId ?? uid,
      ownerId: data.ownerId ?? uid,
      docType: data.docType ?? "pdf",
      currentVersion: data.currentVersion ?? undefined,
      latestPdfUrl: data.latestPdfUrl ?? undefined,
      latestDocxUrl: data.latestDocxUrl ?? undefined,
      revisions: data.revisions ?? [],
    } as Document;
  });
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
    uploaderRecipientId?: string;
    uploader?: Pick<Recipient, "id" | "username" | "email" | "name">;
  },
): Promise<Document> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("You must be signed in to upload documents");

  // Convert PDF file to base64 data URL for Firestore storage.
  let dataUrl = "";
  if (input.file) {
    dataUrl = await readFileAsDataUrl(input.file);
  }

  // Create the Firestore document with the PDF data.
  const docRef = doc(collection(db, "documents"));
  await setDoc(docRef, {
    name: input.name,
    ownerId: uid,
    dataUrl,
    pageCount: input.pageCount,
    sizeBytes: input.sizeBytes,
    sharedWith: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Automatically grant the owner access to the document
  const accessRef = doc(db, "documents", docRef.id, "access", uid);
  await setDoc(accessRef, {
    userId: uid,
    role: "owner",
    grantedBy: uid,
    grantedAt: serverTimestamp(),
    active: true,
  });

  return {
    id: docRef.id,
    name: input.name,
    url: dataUrl,
    dataUrl,
    pageCount: input.pageCount,
    sizeBytes: input.sizeBytes,
    uploadedAt: new Date().toISOString(),
    sharedWith: [],
    uploadedBy: uid,
    ownerId: uid,
  };
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
 * Register a newly uploaded editable Word (.docx) document.
 * Reads the file as a base64 data URL and stores it in Firestore
 * with docType "docx" so it can be opened/edited in the in-browser editor
 * and shared via the existing tracking-link pipeline.
 *
 * NOTE: Firestore documents have a 1MB size limit. Large .docx files
 * should be compressed or split before upload.
 */
export async function registerEditableDocument(
  file: File,
  pageCount = 1,
): Promise<Document> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("You must be signed in to upload documents");

  // Firestore has a 1MB document size limit. Check before converting to base64.
  const MAX_DOCX_SIZE = 800 * 1024; // 800KB to leave room for other fields
  if (file.size > MAX_DOCX_SIZE) {
    throw new Error(
      `The .docx file is too large (${(file.size / 1024).toFixed(0)}KB). ` +
        `Firestore can only store documents up to 1MB. ` +
        `Please use a smaller file (under 800KB) or compress it first.`,
    );
  }

  // Convert .docx file to base64 data URL for Firestore storage.
  const dataUrl = await readFileAsDataUrl(file);

  // Create the Firestore document.
  const docRef = doc(collection(db, "documents"));
  await setDoc(docRef, {
    name: file.name,
    ownerId: uid,
    docType: "docx",
    currentVersion: 1,
    dataUrl,
    latestDocxUrl: dataUrl,
    latestPdfUrl: "",
    pageCount,
    sizeBytes: file.size,
    sharedWith: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Automatically grant the owner access to the document.
  const accessRef = doc(db, "documents", docRef.id, "access", uid);
  await setDoc(accessRef, {
    userId: uid,
    role: "owner",
    grantedBy: uid,
    grantedAt: serverTimestamp(),
    active: true,
  });

  return {
    id: docRef.id,
    name: file.name,
    url: dataUrl,
    dataUrl,
    pageCount,
    sizeBytes: file.size,
    uploadedAt: new Date().toISOString(),
    sharedWith: [],
    uploadedBy: uid,
    ownerId: uid,
    docType: "docx",
    currentVersion: 1,
    latestDocxUrl: dataUrl,
    latestPdfUrl: "",
  };
}

/**
 * Save tracked change (revision) metadata to Firestore.
 * Merges new revisions with existing ones on the document.
 *
 * Allows BOTH the document owner and users with "editor" access role
 * to save revisions, so editors can persist their tracked changes.
 *
 * @returns The merged revision array (existing + new) for the caller
 *          to update local state immediately.
 */
export async function saveDocumentRevisions(
  documentId: string,
  revisions: RevisionMeta[],
): Promise<RevisionMeta[]> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("You must be signed in to save revisions");

  const docRef = doc(db, "documents", documentId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) throw new Error("Document not found");

  const data = docSnap.data();
  const isOwner = data?.ownerId === uid;
  if (!isOwner) {
    // Editors with granted access can also save revisions.
    const accessRef = doc(db, "documents", documentId, "access", uid);
    const accessSnap = await getDoc(accessRef);
    const role = accessSnap.exists() ? accessSnap.data()?.role : null;
    if (role !== "editor") {
      throw new Error("You must be the owner or an editor to save revisions");
    }
  }

  const existing = (data?.revisions ?? []) as RevisionMeta[];
  // Merge: keep existing revisions, append new ones (dedupe by id)
  const existingIds = new Set(existing.map((r) => r.id));
  const newRevisions = revisions.filter((r) => !existingIds.has(r.id));
  const merged = [...existing, ...newRevisions];

  await updateDoc(docRef, {
    revisions: merged,
    updatedAt: serverTimestamp(),
  });

  return merged;
}

/**
 * Update the approval status of a specific revision.
 * Allows both the owner and users with "editor" access role.
 */
export async function updateRevisionStatus(
  documentId: string,
  revisionId: string,
  status: "accepted" | "rejected",
): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("You must be signed in to update revisions");

  const docRef = doc(db, "documents", documentId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) throw new Error("Document not found");

  const data = docSnap.data();
  const isOwner = data?.ownerId === uid;
  if (!isOwner) {
    // Check if user has "editor" role via access subcollection
    const accessRef = doc(db, "documents", documentId, "access", uid);
    const accessSnap = await getDoc(accessRef);
    const role = accessSnap.exists() ? accessSnap.data()?.role : null;
    if (role !== "editor") {
      throw new Error("You must be the owner or an editor to review changes");
    }
  }

  const existing = (data?.revisions ?? []) as RevisionMeta[];
  const updated = existing.map((r) =>
    r.id === revisionId ? { ...r, status } : r,
  );

  await updateDoc(docRef, {
    revisions: updated,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Fetch the revision history for a document.
 */
export async function getDocumentRevisions(
  documentId: string,
): Promise<RevisionMeta[]> {
  const docRef = doc(db, "documents", documentId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return [];
  return (snap.data()?.revisions ?? []) as RevisionMeta[];
}

/**
 * Update the page count for an existing document.
 * Used when Syncfusion detects the real page count after loading.
 */
export async function updateDocumentPageCount(
  documentId: string,
  pageCount: number,
): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("You must be signed in to update documents");

  const docRef = doc(db, "documents", documentId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) throw new Error("Document not found");
  if (docSnap.data()?.ownerId !== uid)
    throw new Error("You can only update your own documents");

  await updateDoc(docRef, {
    pageCount,
    updatedAt: serverTimestamp(),
  });
}

/**
 * List all recipients.
 * Fetches from the backend; falls back to mock data if unavailable.
 */
export async function listRecipients(): Promise<Recipient[]> {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      email: data.email ?? "",
      name: data.displayName ?? data.username ?? "",
      username: data.username ?? data.email?.split("@")[0] ?? "",
    } as Recipient;
  });
}

/**
 * Share a document with a recipient by generating a tracking link.
 * Calls the backend; falls back to mock link generation if unavailable.
 */
export async function shareDocument(
  documentId: string,
  recipientId: string,
  role: "viewer" | "editor" = "viewer",
): Promise<TrackingLink> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("You must be signed in to share documents");

  const linkRef = await addDoc(collection(db, "shareLinks"), {
    documentId,
    recipientId,
    createdBy: uid,
    active: true,
    expiresAt: null,
    createdAt: serverTimestamp(),
  });

  const accessRef = doc(db, "documents", documentId, "access", recipientId);
  await setDoc(accessRef, {
    userId: recipientId,
    role,
    grantedBy: uid,
    grantedAt: serverTimestamp(),
    active: true,
  });

  const docRef = doc(db, "documents", documentId);
  const docSnap = await getDoc(docRef);
  const existing = docSnap.data()?.sharedWith ?? [];
  if (!existing.includes(recipientId)) {
    await updateDoc(docRef, { sharedWith: [...existing, recipientId] });
  }

  const linkId = linkRef.id;
  return {
    id: linkId,
    documentId,
    recipientId,
    token: linkId,
    url: `${window.location.origin}/v/${linkId}`,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Update an existing editable Word (.docx) document with a new saved Blob.
 * Allows BOTH the document owner and users with "editor" access role
 * to save the latest content.
 */
export async function updateEditableDocument(
  documentId: string,
  docxBlob: Blob,
  pageCount: number,
  newVersion: number,
): Promise<string> {
  console.log("[documentsApi] starting updateEditableDocument for:", documentId, {
    blobSize: docxBlob.size,
    pageCount,
    newVersion,
  });

  const uid = auth.currentUser?.uid;
  if (!uid) {
    console.error("[documentsApi] Save aborted: user not logged in");
    throw new Error("You must be signed in to save documents");
  }

  // Verify access: owner OR editor role can save content.
  const docRef = doc(db, "documents", documentId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) throw new Error("Document not found");
  const docData = docSnap.data();
  const isOwner = docData?.ownerId === uid;
  if (!isOwner) {
    const accessRef = doc(db, "documents", documentId, "access", uid);
    const accessSnap = await getDoc(accessRef);
    const role = accessSnap.exists() ? accessSnap.data()?.role : null;
    if (role !== "editor") {
      throw new Error("You must be the owner or an editor to save documents");
    }
  }

  // Convert Blob to data URL
  console.log("[documentsApi] converting blob to data url...");
  const dataUrl = await readFileAsDataUrl(new File([docxBlob], "document.docx"));
  console.log("[documentsApi] data url generated. string length:", dataUrl.length);

  const MAX_DOCX_SIZE = 850 * 1024; // 850KB limits
  if (docxBlob.size > MAX_DOCX_SIZE) {
    console.error("[documentsApi] File too large:", docxBlob.size);
    throw new Error(
      `The updated document is too large (${(docxBlob.size / 1024).toFixed(0)}KB). ` +
        `Firestore can only store documents up to 1MB. ` +
        `Please reduce the content size.`
    );
  }

  console.log("[documentsApi] updating firestore doc:", documentId);
  await updateDoc(docRef, {
    dataUrl,
    latestDocxUrl: dataUrl,
    pageCount,
    sizeBytes: docxBlob.size,
    currentVersion: newVersion,
    updatedAt: serverTimestamp(),
  });
  console.log("[documentsApi] firestore updateDoc completed successfully.");

  return dataUrl;
}

/**
 * Check the current user's role access for a specific document.
 */
export async function getDocumentAccessRole(
  documentId: string,
): Promise<"owner" | "editor" | "viewer" | null> {
  const uid = auth.currentUser?.uid;
  if (!uid) return null;

  // 1. Check if owner
  const docRef = doc(db, "documents", documentId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  const data = docSnap.data();
  if (data.ownerId === uid) return "owner";

  // 2. Check access subcollection
  const accessRef = doc(db, "documents", documentId, "access", uid);
  const accessSnap = await getDoc(accessRef);
  if (accessSnap.exists() && accessSnap.data()?.active === true) {
    return accessSnap.data()?.role ?? "viewer";
  }

  return null;
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
  const uid = auth.currentUser?.uid;
  if (!uid) return [];
  const q = query(collection(db, "shareLinks"), where("createdBy", "==", uid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      documentId: data.documentId ?? "",
      recipientId: data.recipientId ?? "",
      token: d.id,
      url: `${window.location.origin}/v/${d.id}`,
      createdAt: data.createdAt?.toDate?.()?.toISOString() ?? "",
    } as TrackingLink;
  });
}

/**
 * Revoke access for a recipient to a document.
 * Sets the access record to inactive and removes from sharedWith array.
 */
export async function revokeAccess(
  documentId: string,
  recipientId: string,
): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("You must be signed in to revoke access");

  // Verify ownership
  const docRef = doc(db, "documents", documentId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) throw new Error("Document not found");
  if (docSnap.data()?.ownerId !== uid) throw new Error("You can only revoke access for your own documents");

  // Set access record to inactive
  const accessRef = doc(db, "documents", documentId, "access", recipientId);
  await updateDoc(accessRef, { active: false });

  // Remove from sharedWith array
  const data = docSnap.data();
  const existing = data?.sharedWith ?? [];
  const updated = existing.filter((id: string) => id !== recipientId);
  await updateDoc(docRef, { sharedWith: updated });
}

/**
 * Toggle access for a recipient to a document.
 * Enables or disables the recipient's access record without removing them
 * from the sharedWith list (so analytics history is preserved).
 */
export async function toggleAccess(
  documentId: string,
  recipientId: string,
  active: boolean,
): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("You must be signed in to manage access");

  // Verify ownership
  const docRef = doc(db, "documents", documentId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) throw new Error("Document not found");
  if (docSnap.data()?.ownerId !== uid)
    throw new Error("You can only manage access for your own documents");

  // Set access record active/inactive
  const accessRef = doc(db, "documents", documentId, "access", recipientId);
  await setDoc(
    accessRef,
    {
      userId: recipientId,
      role: "viewer",
      grantedBy: uid,
      grantedAt: serverTimestamp(),
      active,
    },
    { merge: true },
  );
}

/**
 * Delete a document and all its associated data (access, views, shareLinks).
 * Only the document owner can delete it.
 */
export async function deleteDocument(documentId: string): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("You must be signed in to delete documents");

  // Verify ownership
  const docRef = doc(db, "documents", documentId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) throw new Error("Document not found");
  if (docSnap.data()?.ownerId !== uid) throw new Error("You can only delete your own documents");

  // Delete all shareLinks for this document
  const linksQuery = query(collection(db, "shareLinks"), where("documentId", "==", documentId));
  const linksSnap = await getDocs(linksQuery);
  const linkDeletePromises = linksSnap.docs.map((d) => deleteDoc(d.ref));
  await Promise.all(linkDeletePromises);

  // Delete all access records
  const accessQuery = collection(db, "documents", documentId, "access");
  const accessSnap = await getDocs(accessQuery);
  const accessDeletePromises = accessSnap.docs.map((d) => deleteDoc(d.ref));
  await Promise.all(accessDeletePromises);

  // Delete all views
  const viewsQuery = collection(db, "documents", documentId, "views");
  const viewsSnap = await getDocs(viewsQuery);
  const viewDeletePromises = viewsSnap.docs.map((d) => deleteDoc(d.ref));
  await Promise.all(viewDeletePromises);

  // Delete the document itself
  await deleteDoc(docRef);
}

/**
 * List documents shared with the current user.
 * Queries the access subcollection to find documents where the user has access.
 */
export async function listSharedDocuments(): Promise<Document[]> {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];

  try {
    // Query all documents and filter by access
    const allDocsQuery = query(collection(db, "documents"));
    const allDocsSnap = await getDocs(allDocsQuery);
    
    const sharedDocs: Document[] = [];
    
    for (const docSnap of allDocsSnap.docs) {
      const data = docSnap.data();
      
      // Skip if user is the owner
      if (data.ownerId === uid) continue;
      
      // Check if user has access
      const accessRef = doc(db, "documents", docSnap.id, "access", uid);
      const accessSnap = await getDoc(accessRef);
      
      if (accessSnap.exists() && accessSnap.data()?.active === true) {
        sharedDocs.push({
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
          docType: data.docType ?? "pdf",
          currentVersion: data.currentVersion ?? undefined,
          latestPdfUrl: data.latestPdfUrl ?? undefined,
          latestDocxUrl: data.latestDocxUrl ?? undefined,
          sharedRole: accessSnap.data()?.role ?? "viewer",
          revisions: data.revisions ?? [],
        } as Document);
      }
    }
    
    return sharedDocs;
  } catch (error) {
    console.error("Failed to fetch shared documents:", error);
    return [];
  }
}
