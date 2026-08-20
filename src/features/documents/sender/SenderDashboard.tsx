/**
 * Sender Dashboard - view uploaded PDFs and generate recipient-specific
 * tracking links (DocSend-like replacement mechanic).
 */

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { DeleteConfirmationModal } from "../../../components/ui/confirmation-modal/DeleteConfirmationModal";
import { dismissToast, toastSuccess, toastError } from "../../../components/common/toast/toast";
import { copyToClipboard } from "../../../utils/clipboard";
import PdfDropzone from "./components/PdfDropzone";
import ShareDocumentPanel from "./components/ShareDocumentPanel";
import {
  listDocuments,
  listRecipients,
  listTrackingLinks,
  registerDocument,
  deleteDocument,
  revokeAccess,
  shareDocument,
} from "../api/documentsApi";
import { getPdfPageCount } from "../utils/pdfUtils";
import { getViewerIdentity, isDocumentOwner } from "../utils/userIdentity";
import { useAppSelector } from "../../../store/hooks";
import { selectUser } from "../../../store/selectors";
import type { Document, Recipient, TrackingLink } from "../types";

/** Format a byte count into a human-readable size string (e.g. "2.4 MB"). */
function formatFileSize(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)} KB`;
  return `${bytes} B`;
}

export default function SenderDashboard() {
  const navigate = useNavigate();
  const user = useAppSelector(selectUser);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [links, setLinks] = useState<TrackingLink[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload state.
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [justUploadedDoc, setJustUploadedDoc] = useState<Document | null>(null);

  // Share modal state (add user to an already-uploaded document).
  const [shareDoc, setShareDoc] = useState<Document | null>(null);
  const [shareRecipientId, setShareRecipientId] = useState("");
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);

  // Delete confirmation state.
  const [deleteDoc, setDeleteDoc] = useState<Document | null>(null);

  // Revoke access confirmation state.
  const [revokeDoc, setRevokeDoc] = useState<{
    doc: Document;
    recipientId: string;
  } | null>(null);

  const handleShareDocument = useCallback(async () => {
    if (!shareDoc || !shareRecipientId) return;
    setSharing(true);
    setShareError(null);
    setShareSuccess(null);
    try {
      await shareDocument(shareDoc.id, shareRecipientId);
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === shareDoc.id
            ? { ...d, sharedWith: [...d.sharedWith, shareRecipientId] }
            : d,
        ),
      );
      setShareSuccess(
        `Shared with ${recipients.find((r) => r.id === shareRecipientId)?.username ?? "user"}!`,
      );
      toastSuccess(
        `Shared "${shareDoc.name}" with ${recipients.find((r) => r.id === shareRecipientId)?.username ?? "user"}!`,
      );
      setShareRecipientId("");
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
  }, [shareDoc, shareRecipientId, recipients]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listDocuments(), listRecipients(), listTrackingLinks()])
      .then(([docs, recs, lks]) => {
        if (cancelled) return;
        setDocuments(docs);
        setRecipients(recs);
        setLinks(lks);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const viewerIdentity = user ? getViewerIdentity(user, recipients) : undefined;

  const handleFileAccepted = useCallback(
    async (file: File) => {
      if (!user || !viewerIdentity) return;
      setUploading(true);
      setUploadError(null);
      setJustUploadedDoc(null);
      try {
        const pageCount = await getPdfPageCount(file);
        const doc = await registerDocument({
          name: file.name,
          url: URL.createObjectURL(file),
          pageCount,
          sizeBytes: file.size,
          file,
          uploadedBy: viewerIdentity.username,
          uploaderRecipientId: viewerIdentity.recipientId,
          uploader: {
            id: viewerIdentity.recipientId,
            username: user.username,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`.trim() || user.username,
          },
        });
        setDocuments((prev) => [doc, ...prev]);
        setJustUploadedDoc(doc);

        // Show a success toast with the file name, size, and a close button.
        const message = `${file.name} (${formatFileSize(file.size)}) uploaded successfully`;
        const toastId = toast.success(
          <div className="flex items-center gap-2">
            <span>{message}</span>
            <button
              type="button"
              onClick={() => dismissToast(toastId)}
              aria-label="Dismiss notification"
              className="ml-1 rounded-full p-0.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
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
            </button>
          </div>,
          { duration: 4000 },
        );
      } catch {
        setUploadError("Failed to upload the PDF. Please try again.");
      } finally {
        setUploading(false);
      }
    },
    [user, viewerIdentity],
  );

  const handleDocumentUpdated = useCallback((updatedDoc: Document) => {
    setDocuments((prev) =>
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

  const handleDeleteDocument = useCallback((doc: Document) => {
    // Open the delete confirmation modal
    setDeleteDoc(doc);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteDoc) return;
    try {
      await deleteDocument(deleteDoc.id);
      setDocuments((prev) => prev.filter((d) => d.id !== deleteDoc.id));
      setDeleteDoc(null);
      toastSuccess(`"${deleteDoc.name}" deleted successfully!`);
    } catch (error) {
      console.error("Failed to delete document:", error);
      toastError("Failed to delete document. Please try again.");
    }
  }, [deleteDoc]);

  const handleRevokeAccess = useCallback(
    (doc: Document, recipientId: string) => {
      // Open the revoke access confirmation modal.
      setRevokeDoc({ doc, recipientId });
    },
    [],
  );

  const handleConfirmRevoke = useCallback(async () => {
    if (!revokeDoc) return;
    const { doc, recipientId } = revokeDoc;
    try {
      await revokeAccess(doc.id, recipientId);
      // Update local state
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === doc.id
            ? {
                ...d,
                sharedWith: d.sharedWith.filter((id) => id !== recipientId),
              }
            : d,
        ),
      );
      setRevokeDoc(null);
      toastSuccess("Access revoked successfully!");
    } catch (error) {
      console.error("Failed to revoke access:", error);
      toastError("Failed to revoke access. Please try again.");
    }
  }, [revokeDoc]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <img
          src="/loading_tracksend.gif"
          alt="Loading…"
          className="h-22 w-22 object-contain"
        />
        {/* <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" /> */}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
            Document Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Upload PDFs and generate recipient-specific tracking links.
          </p>
        </div>
        {user && (
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            {user.image && (
              <img
                src={user.image}
                alt={user.username}
                className="h-9 w-9 rounded-full object-cover"
              />
            )}
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

      {/* Upload Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
          Upload PDF
        </h2>
        <PdfDropzone
          onFileAccepted={handleFileAccepted}
          uploading={uploading}
          error={uploadError}
          disabled={!!justUploadedDoc}
        />

        {/* Share panel appears immediately after successful upload */}
        {justUploadedDoc && (
          <ShareDocumentPanel
            document={justUploadedDoc}
            recipients={recipients}
            currentRecipientId={viewerIdentity?.recipientId}
            onDocumentUpdated={handleDocumentUpdated}
            onLinkGenerated={handleLinkGenerated}
          />
        )}
      </div>

      {/* Documents Table */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            Uploaded Documents
          </h2>
        </div>
        {documents.filter(
          (doc) => !viewerIdentity || isDocumentOwner(doc, viewerIdentity),
        ).length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
              <svg
                className="h-8 w-8 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
              No documents uploaded
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Upload your first PDF to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Pages</th>
                  <th className="px-6 py-3 font-medium">Size</th>
                  <th className="px-6 py-3 font-medium">Shared With</th>
                  <th className="px-6 py-3 font-medium">Share Link</th>
                  <th className="px-6 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {documents
                  .filter(
                    (doc) =>
                      !viewerIdentity || isDocumentOwner(doc, viewerIdentity),
                  )
                  .map((doc) => {
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
                        <td className="px-6 py-3 font-mediums text-gray-800 dark:text-white">
                          {doc.name}
                        </td>
                        <td className="px-6 py-3 text-gray-500 dark:text-gray-400">
                          {doc.pageCount}
                        </td>
                        <td className="px-6 py-3 text-gray-500 dark:text-gray-400">
                          {(doc.sizeBytes / 1_000_000).toFixed(1)} MB
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex flex-wrap items-center gap-1">
                            {sharedRecipients.map((r) => (
                              <span
                                key={r.id}
                                className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
                              >
                                {r.username}
                                <button
                                  type="button"
                                  onClick={() => handleRevokeAccess(doc, r.id)}
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
                        <td className="px-6 py-3">
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
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-1.5">
                            {/* View */}
                            <div className="group relative">
                              <button
                                type="button"
                                onClick={() =>
                                  doc.docType === "docx"
                                    ? navigate(`/docx-viewer/${doc.id}?name=${encodeURIComponent(doc.name)}`)
                                    : navigate(`/documents/${doc.id}`)
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

                            {/* Edit (docx only) */}
                            {doc.docType === "docx" && (
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
                            )}

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
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:border-red-400 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:border-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-300"
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
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteDoc && (
        <DeleteConfirmationModal
          isOpen={!!deleteDoc}
          title="Delete Document"
          message={`Are you sure you want to delete "${deleteDoc.name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          onClose={() => setDeleteDoc(null)}
          onConfirm={handleConfirmDelete}
        />
      )}

      {/* Revoke Access Confirmation Modal */}
      {revokeDoc && (
        <DeleteConfirmationModal
          isOpen={!!revokeDoc}
          title="Revoke Access"
          message={`Are you sure you want to revoke access? The recipient will no longer be able to view this document.`}
          confirmText="Revoke"
          cancelText="Cancel"
          onClose={() => setRevokeDoc(null)}
          onConfirm={handleConfirmRevoke}
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
