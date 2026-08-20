/**
 * DocxViewerPage - upload a .docx file, preview it read-only, and share it
 * with users via tracking links - just like the PDF upload flow.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { DeleteConfirmationModal } from "../../../components/ui/confirmation-modal/DeleteConfirmationModal";
import { useNavigate } from "react-router-dom";
import { toastSuccess, toastError } from "../../../components/common/toast/toast";
import { copyToClipboard } from "../../../utils/clipboard";
import DocxDropzone from "./components/DocxDropzone";
import DocxViewer from "./components/DocxViewer";
import ShareDocumentPanel from "./components/ShareDocumentPanel";
import {
  listDocuments,
  listRecipients,
  listTrackingLinks,
  registerEditableDocument,
  shareDocument,
  revokeAccess,
  updateDocumentPageCount,
} from "../api/documentsApi";
import { getViewerIdentity } from "../utils/userIdentity";
import { useAppSelector } from "../../../store/hooks";
import { selectUser } from "../../../store/selectors";
import type { Document, Recipient, TrackingLink } from "../types";
import { deleteDocument } from "../api/documentsApi";
/** Convert a File to a base64 data URL */
const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export default function DocxViewerPage() {
  const navigate = useNavigate();
  const user = useAppSelector(selectUser);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [docxDocs, setDocxDocs] = useState<Document[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [docxDataUrl, setDocxDataUrl] = useState<string | null>(null);
  const [justUploadedDoc, setJustUploadedDoc] = useState<Document | null>(null);

  // Recipients & tracking links for sharing
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [links, setLinks] = useState<TrackingLink[]>([]);

  // Share modal state
  const [shareDoc, setShareDoc] = useState<Document | null>(null);
  // Delete confirmation state
  const [deleteDoc, setDeleteDoc] = useState<Document | null>(null);
  const [shareRecipientId, setShareRecipientId] = useState("");
  const [shareRole, setShareRole] = useState<"viewer" | "editor">("viewer");
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);

  const loadDocxDocuments = useCallback(async () => {
    setLoadingDocs(true);
    try {
      const all = await listDocuments();
      setDocxDocs(all.filter((d) => d.docType === "docx"));
    } catch {
      // ignore list error
    } finally {
      setLoadingDocs(false);
    }
  }, []);

  useEffect(() => {
    void loadDocxDocuments();
    Promise.all([listRecipients(), listTrackingLinks()])
      .then(([recs, lks]) => {
        setRecipients(recs);
        setLinks(lks);
      })
      .catch(() => {
        // ignore
      });
  }, [loadDocxDocuments]);

  const viewerIdentity = user ? getViewerIdentity(user, recipients) : undefined;

  const handleFileAccepted = useCallback(async (file: File) => {
    setSelectedFile(file);
    setError(null);
    setSaved(false);
    setJustUploadedDoc(null);
    try {
      const dataUrl = await fileToDataUrl(file);
      setDocxDataUrl(dataUrl);
    } catch (err) {
      console.error("[DocxViewerPage] Failed to convert file:", err);
      setError("Failed to read the file. Please try again.");
    }
  }, []);
  const handleDeleteDocument = useCallback((doc: Document) => {
    // Open the delete confirmation modal
    setDeleteDoc(doc);
  }, []);
  const handleSaveToFirebase = useCallback(async () => {
    if (!selectedFile) return;
    setSaving(true);
    setError(null);
    try {
      const doc = await registerEditableDocument(selectedFile);
      setSaved(true);
      setJustUploadedDoc(doc);
      await loadDocxDocuments();
      // Close the preview after saving to Firebase.
      setSelectedFile(null);
      setDocxDataUrl(null);
      toastSuccess(
        `${selectedFile.name} (${(selectedFile.size / 1_000_000).toFixed(1)} MB) uploaded successfully!`,
      );
    } catch (e) {
      console.error("[DocxViewerPage] Failed to save to Firebase:", e);
      setError(
        e instanceof Error
          ? e.message
          : "Failed to save the document to Firebase. Please try again.",
      );
      toastError(
        e instanceof Error
          ? e.message
          : "Failed to save the document to Firebase. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }, [selectedFile, loadDocxDocuments]);

  // Update the page count in Firestore once Syncfusion detects the real count.
  // Use a ref to avoid stale closures and prevent flickering.
  const justUploadedDocRef = useRef<Document | null>(null);
  justUploadedDocRef.current = justUploadedDoc;

  const handlePageCountChange = useCallback((pageCount: number) => {
    const doc = justUploadedDocRef.current;
    if (!doc) return;
    if (pageCount <= 1) return;
    // Update the local state so the table shows the real page count.
    setDocxDocs((prev) =>
      prev.map((d) => (d.id === doc.id ? { ...d, pageCount } : d)),
    );
    setJustUploadedDoc((prev) => (prev ? { ...prev, pageCount } : prev));
    // Persist to Firestore.
    void updateDocumentPageCount(doc.id, pageCount).catch((e) => {
      console.error("[DocxViewerPage] Failed to update page count:", e);
    });
  }, []);

  const handleDocumentUpdated = useCallback((updatedDoc: Document) => {
    setDocxDocs((prev) =>
      prev.map((d) => (d.id === updatedDoc.id ? updatedDoc : d)),
    );
    setJustUploadedDoc(updatedDoc);
  }, []);

  const handleLinkGenerated = useCallback((link: TrackingLink) => {
    setLinks((prev) => [link, ...prev]);
  }, []);

  const handleCopyLink = useCallback((url: string) => {
    // Copy silently — no popups or prompts.
    copyToClipboard(url);
    toastSuccess("Tracking link copied to clipboard!");
  }, []);

  const handleShareDocument = useCallback(async () => {
    if (!shareDoc || !shareRecipientId) return;
    setSharing(true);
    setShareError(null);
    setShareSuccess(null);
    try {
      const link = await shareDocument(
        shareDoc.id,
        shareRecipientId,
        shareRole,
      );
      setDocxDocs((prev) =>
        prev.map((d) =>
          d.id === shareDoc.id
            ? { ...d, sharedWith: [...d.sharedWith, shareRecipientId] }
            : d,
        ),
      );
      setLinks((prev) => [link, ...prev]);
      setShareSuccess(
        `Shared as ${shareRole} with ${recipients.find((r) => r.id === shareRecipientId)?.username ?? "user"}! Tracking link generated.`,
      );
      toastSuccess(
        `Shared "${shareDoc.name}" as ${shareRole} with ${recipients.find((r) => r.id === shareRecipientId)?.username ?? "user"}!`,
      );
      setShareRecipientId("");
      setShareRole("viewer");
      setTimeout(() => {
        setShareDoc(null);
        setShareSuccess(null);
      }, 1200);
    } catch {
      setShareError("Failed to share the document. Please try again.");
      toastError("Failed to share the document. Please try again.");
    } finally {
      setSharing(false);
    }
  }, [shareDoc, shareRecipientId, shareRole, recipients]);

  const handleRevokeAccess = useCallback(
    async (docId: string, recipientId: string) => {
      if (
        !window.confirm(
          "Are you sure you want to revoke access? The recipient will no longer be able to view this document.",
        )
      ) {
        return;
      }
      try {
        await revokeAccess(docId, recipientId);
        setDocxDocs((prev) =>
          prev.map((d) =>
            d.id === docId
              ? {
                  ...d,
                  sharedWith: d.sharedWith.filter((id) => id !== recipientId),
                }
              : d,
          ),
        );
        toastSuccess("Access revoked successfully!");
      } catch (error) {
        console.error("Failed to revoke access:", error);
        toastError("Failed to revoke access. Please try again.");
      }
    },
    [],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/documents")}
              className="rounded-lg border border-gray-300 p-1.5 text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              aria-label="Back to documents"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
                Word Document Viewer
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Upload a .docx file, preview it, and share it with users via
                tracking links.
              </p>
            </div>
          </div>
        </div>
        {user && (
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-white">
                {user.username}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user.email}
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
            Upload Word Document
          </h2>
          <DocxDropzone onFileAccepted={handleFileAccepted} />
        </div>

        {selectedFile && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                <span className="font-medium text-gray-700 dark:text-gray-200">
                  {selectedFile.name}
                </span>{" "}
                · {(selectedFile.size / 1_000_000).toFixed(2)} MB
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setJustUploadedDoc(null);
                  setSaved(false);
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Choose another file
              </button>
            </div>
            <DocxViewer
              source={docxDataUrl}
              title={selectedFile.name}
              onPageCountChange={handlePageCountChange}
              height="50vh"
            />

            <div className="flex items-center justify-end gap-3">
              {saved && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {/* Saved to Firebase */}
                  Uploaded
                </span>
              )}
              <button
                type="button"
                onClick={handleSaveToFirebase}
                disabled={saving || saved}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Uploading…
                  </>
                ) : saved ? (
                  "Uploaded"
                ) : (
                  "Upload to Storage"
                )}
              </button>
            </div>
          </div>
        )}

        {justUploadedDoc && (
          <ShareDocumentPanel
            document={justUploadedDoc}
            recipients={recipients}
            currentRecipientId={viewerIdentity?.recipientId}
            onDocumentUpdated={handleDocumentUpdated}
            onLinkGenerated={handleLinkGenerated}
          />
        )}

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              My Word Documents
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Previously uploaded .docx files saved in store.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium">Size</th>
                  <th className="px-4 py-2 font-medium">Version</th>
                  <th className="px-4 py-2 font-medium">Shared With</th>
                  <th className="px-4 py-2 font-medium">Share Link</th>
                  <th className="px-4 py-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {loadingDocs ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-6 text-center text-xs text-gray-500"
                    >
                      Loading…
                    </td>
                  </tr>
                ) : docxDocs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-6 text-center text-xs text-gray-500"
                    >
                      No Word documents uploaded yet.
                    </td>
                  </tr>
                ) : (
                  docxDocs.map((doc) => {
                    const sharedRecipients = recipients.filter((r) =>
                      doc.sharedWith.includes(r.id),
                    );
                    const docLinks = links.filter(
                      (l) => l.documentId === doc.id,
                    );
                    return (
                      <tr
                        key={doc.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-900"
                      >
                        <td className="px-4 py-2 font-medium text-gray-800 dark:text-white">
                          {doc.name}
                        </td>
                        <td className="px-4 py-2 text-gray-500 dark:text-gray-400">
                          {(doc.sizeBytes / 1024).toFixed(0)} KB
                        </td>
                        <td className="px-4 py-2 text-gray-500 dark:text-gray-400">
                          {doc.currentVersion ?? 1}
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex flex-wrap items-center gap-1">
                            {sharedRecipients.map((r) => (
                              <span
                                key={r.id}
                                className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
                              >
                                {r.username}
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRevokeAccess(doc.id, r.id)
                                  }
                                  className="ml-0.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30"
                                  title="Revoke access"
                                >
                                  <svg
                                    className="h-3 w-3 text-red-600 dark:text-red-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M6 18L18 6M6 6l12 12"
                                    />
                                  </svg>
                                </button>
                              </span>
                            ))}
                            {sharedRecipients.length === 0 && (
                              <span className="text-xs text-gray-400">
                                Not shared
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setShareDoc(doc);
                                setShareRecipientId("");
                                setShareError(null);
                                setShareSuccess(null);
                              }}
                              className="inline-flex items-center gap-0.5 rounded-full border border-dashed border-brand-300 px-2 py-0.5 text-xs font-medium text-brand-600 transition hover:bg-brand-50 dark:border-brand-500/40 dark:text-brand-300 dark:hover:bg-brand-500/10"
                            >
                              <svg
                                className="h-3 w-3"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M12 4.5v15m7.5-7.5h-15"
                                />
                              </svg>
                              Add
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          {docLinks.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => handleCopyLink(docLinks[0].url)}
                              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                            >
                              <svg
                                className="h-3.5 w-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                              </svg>
                              Copy Link
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">
                              No link yet
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-1.5">
                            {/* View */}
                            <div className="group relative">
                              <button
                                type="button"
                                onClick={() =>
                                  navigate(
                                    `/docx-viewer/${doc.id}?name=${encodeURIComponent(doc.name)}`,
                                  )
                                }
                                title="View document"
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 dark:border-gray-600 dark:text-gray-300 dark:hover:border-blue-500 dark:hover:bg-blue-500/10 dark:hover:text-blue-300"
                              >
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                </svg>
                              </button>
                              <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 dark:bg-gray-700">
                                View
                              </span>
                            </div>

                            {/* Edit */}
                            <div className="group relative">
                              <a
                                href={`/docx-editor/${doc.id}`}
                                target="_blank"
                                rel="noreferrer"
                                title="Edit document"
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600 dark:border-gray-600 dark:text-gray-300 dark:hover:border-indigo-500 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300"
                              >
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
                                  />
                                </svg>
                              </a>
                              <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 dark:bg-gray-700">
                                Edit
                              </span>
                            </div>

                            {/* Analytics */}
                            <div className="group relative">
                              <button
                                type="button"
                                onClick={() =>
                                  navigate(`/analytics?doc=${doc.id}`)
                                }
                                title="View analytics"
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-600 dark:border-gray-600 dark:text-gray-300 dark:hover:border-emerald-500 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300"
                              >
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2 2z"
                                  />
                                </svg>
                              </button>
                              <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 dark:bg-gray-700">
                                Analytics
                              </span>
                            </div>

                            {/* Delete */}
                            <div className="group relative">
                              <button
                                type="button"
                                onClick={() => handleDeleteDocument(doc)}
                                title="Delete document"
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition hover:border-red-400 hover:bg-red-50 hover:text-gray-700 dark:border-gray-800 dark:text-red-400 dark:hover:border-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                              >
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.77H8.084a2.25 2.25 0 01-2.244-2.77L6.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.061-.94-1.75-1.816-1.618l-3.04.768a1.875 1.875 0 01-1.693-1.692l.768-3.04c.132-.876.557-1.476 1.618-1.816z"
                                  />
                                </svg>
                              </button>
                              <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 dark:bg-gray-700">
                                Delete
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteDoc && (
        <DeleteConfirmationModal
          isOpen={!!deleteDoc}
          title="Delete Document"
          message={`Are you sure you want to delete "${deleteDoc.name}"? This action cannot be undone.`}
          onClose={() => setDeleteDoc(null)}
          onConfirm={() => {
            void deleteDocument(deleteDoc.id)
              .then(() => {
                setDocxDocs((prev) =>
                  prev.filter((d) => d.id !== deleteDoc.id),
                );
                toastSuccess(`"${deleteDoc.name}" deleted successfully!`);
              })
              .catch((error) => {
                console.error("Failed to delete document:", error);
                toastError("Failed to delete document. Please try again.");
              })
              .finally(() => {
                setDeleteDoc(null);
              });
          }}
        />
      )}

      {/* Share Modal */}
      {shareDoc && (
        <div
          className="fixed inset-0 z-99999990 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => {
            if (!sharing) {
              setShareDoc(null);
              setShareRecipientId("");
              setShareError(null);
              setShareSuccess(null);
            }
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Share Document
              </h3>
              <button
                type="button"
                onClick={() => {
                  if (!sharing) {
                    setShareDoc(null);
                    setShareRecipientId("");
                    setShareError(null);
                    setShareSuccess(null);
                  }
                }}
                className="rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <p className="mb-4 truncate text-sm text-gray-500 dark:text-gray-400">
              {shareDoc.name}
            </p>

            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Select user to share with
            </label>
            <select
              value={shareRecipientId}
              onChange={(e) => setShareRecipientId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            >
              <option value="">Choose a user…</option>
              {recipients
                .filter(
                  (r) =>
                    !shareDoc.sharedWith.includes(r.id) &&
                    r.id !== viewerIdentity?.recipientId,
                )
                .map((rec) => (
                  <option key={rec.id} value={rec.id}>
                    {rec.username} ({rec.email})
                  </option>
                ))}
            </select>

            <label className="mt-3 mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Access level
            </label>
            <select
              value={shareRole}
              onChange={(e) =>
                setShareRole(e.target.value as "viewer" | "editor")
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            >
              <option value="viewer">Viewer (Read-only)</option>
              <option value="editor">Editor (Can edit & save)</option>
            </select>

            {shareError && (
              <p className="mt-2 text-sm text-red-500">{shareError}</p>
            )}
            {shareSuccess && (
              <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">
                {shareSuccess}
              </p>
            )}

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  if (!sharing) {
                    setShareDoc(null);
                    setShareRecipientId("");
                    setShareError(null);
                    setShareSuccess(null);
                  }
                }}
                disabled={sharing}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleShareDocument}
                disabled={!shareRecipientId || sharing}
                className="flex-1 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
              >
                {sharing ? "Sharing…" : "Share"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
