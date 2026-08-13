/**
 * DocxViewerPage - upload a .docx file, preview it read-only, and share it
 * with users via tracking links - just like the PDF upload flow.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import DocxEditor from "./components/DocxEditor";

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
    } catch (e) {
      console.error("[DocxViewerPage] Failed to save to Firebase:", e);
      setError(
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

  const handleCopyLink = useCallback(async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }, []);

  const handleShareDocument = useCallback(async () => {
    if (!shareDoc || !shareRecipientId) return;
    setSharing(true);
    setShareError(null);
    setShareSuccess(null);
    try {
      const link = await shareDocument(shareDoc.id, shareRecipientId, shareRole);
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
      setShareRecipientId("");
      setShareRole("viewer");
      setTimeout(() => {
        setShareDoc(null);
        setShareSuccess(null);
      }, 1200);
    } catch {
      setShareError("Failed to share the document. Please try again.");
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
      } catch (error) {
        console.error("Failed to revoke access:", error);
        alert("Failed to revoke access. Please try again.");
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
                  "Upload to Firebase"
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
              Previously uploaded .docx files saved in Firestore.
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
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                navigate(
                                  `/docx-viewer/${doc.id}?name=${encodeURIComponent(doc.name)}`,
                                )
                              }
                              className="inline-flex items-center gap-1 rounded-lg bg-brand-500 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-brand-600"
                            >
                              Open
                            </button>
                            <a
                              href={`/docx-editor/${doc.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg bg-blue-500 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-blue-600"
                            >
                              Edit
                            </a>
                            <button
                              type="button"
                              onClick={() =>
                                navigate(`/analytics?doc=${doc.id}`)
                              }
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-emerald-600"
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
                                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2 2z"
                                />
                              </svg>
                              Analytics
                            </button>
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
              onChange={(e) => setShareRole(e.target.value as "viewer" | "editor")}
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
