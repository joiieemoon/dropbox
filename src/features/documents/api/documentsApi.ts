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
import type { Document, Recipient, TrackingLink } from "../types";

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
      url: data.dataUrl ?? "",
      dataUrl: data.dataUrl ?? "",
      pageCount: data.pageCount ?? 0,
      sizeBytes: data.sizeBytes ?? 0,
      uploadedAt: data.createdAt?.toDate?.()?.toISOString() ?? "",
      sharedWith: data.sharedWith ?? [],
      uploadedBy: data.ownerId ?? uid,
      ownerId: data.ownerId ?? uid,
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
    role: "viewer",
    grantedBy: uid,
    grantedAt: serverTimestamp(),
    active: true,
  });

  const docRef = doc(db, "documents", documentId);
  const docSnap = await getDoc(docRef);
  const existing = docSnap.data()?.sharedWith ?? [];
  await updateDoc(docRef, { sharedWith: [...existing, recipientId] });

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
        } as Document);
      }
    }
    
    return sharedDocs;
  } catch (error) {
    console.error("Failed to fetch shared documents:", error);
    return [];
  }
}
