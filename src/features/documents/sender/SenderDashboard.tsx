/**
 * Sender Dashboard - view uploaded PDFs and generate recipient-specific
 * tracking links (DocSend-like replacement mechanic).
 */

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PdfDropzone from "./components/PdfDropzone";
import ShareDocumentPanel from "./components/ShareDocumentPanel";
import {
  listDocuments,
  listRecipients,
  listTrackingLinks,
  registerDocument,
  deleteDocument,
  listSharedDocuments,
} from "../api/documentsApi";
import { getPdfPageCount } from "../utils/pdfUtils";
import { getViewerIdentity, isDocumentOwner } from "../utils/userIdentity";
import { useAppSelector } from "../../../store/hooks";
import { selectUser } from "../../../store/selectors";
import type { Document, Recipient, TrackingLink } from "../types";

export default function SenderDashboard() {
  const navigate = useNavigate();
  const user = useAppSelector(selectUser);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [sharedDocuments, setSharedDocuments] = useState<Document[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [links, setLinks] = useState<TrackingLink[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload state.
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [justUploadedDoc, setJustUploadedDoc] = useState<Document | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listDocuments(), listSharedDocuments(), listRecipients(), listTrackingLinks()])
      .then(([docs, sharedDocs, recs, lks]) => {
        if (cancelled) return;
        setDocuments(docs);
        setSharedDocuments(sharedDocs);
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

  const handleCopyLink = useCallback(async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }, []);

  const handleDeleteDocument = useCallback(async (docId: string) => {
    if (!window.confirm("Are you sure you want to delete this document? This action cannot be undone.")) {
      return;
    }
    try {
      await deleteDocument(docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch (error) {
      console.error("Failed to delete document:", error);
      alert("Failed to delete document. Please try again.");
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
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
        />

        {/* Share panel appears immediately after successful upload */}
        {justUploadedDoc && (
          <ShareDocumentPanel
            document={justUploadedDoc}
            recipients={recipients}
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
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
              <tr>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Pages</th>
                <th className="px-6 py-3 font-medium">Size</th>
                <th className="px-6 py-3 font-medium">Shared With</th>
                <th className="px-6 py-3 font-medium">Share Link</th>
                <th className="px-6 py-3 font-medium">Actions</th>
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
                  const docLinks = links.filter((l) => l.documentId === doc.id);
                  return (
                    <tr
                      key={doc.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-900"
                    >
                      <td className="px-6 py-3 font-medium text-gray-800 dark:text-white">
                        {doc.name}
                      </td>
                      <td className="px-6 py-3 text-gray-500 dark:text-gray-400">
                        {doc.pageCount}
                      </td>
                      <td className="px-6 py-3 text-gray-500 dark:text-gray-400">
                        {(doc.sizeBytes / 1_000_000).toFixed(1)} MB
                      </td>
                      <td className="px-6 py-3">
                        {sharedRecipients.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {sharedRecipients.map((r) => (
                              <span
                                key={r.id}
                                className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
                              >
                                {r.username}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">
                            Not shared
                          </span>
                        )}
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
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/analytics?doc=${doc.id}`)}
                            className="inline-flex items-center gap-1 rounded-lg bg-brand-500 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-brand-600"
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
                          <button
                            type="button"
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-300 px-2.5 py-1 text-xs font-medium text-red-700 transition hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
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
                                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.77H8.084a2.25 2.25 0 01-2.244-2.77L6.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.061-.94-1.75-1.816-1.618l-3.04.768a1.875 1.875 0 01-1.693-1.692l.768-3.04c.132-.876.557-1.476 1.618-1.816z"
                              />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shared with me section */}
      {/* {sharedDocuments.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              Shared with me
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Documents that other users have shared with you
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Pages</th>
                  <th className="px-6 py-3 font-medium">Size</th>
                  <th className="px-6 py-3 font-medium">Owner</th>
                  <th className="px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {sharedDocuments.map((doc) => {
                  const owner = recipients.find((r) => r.id === doc.ownerId);
                  return (
                    <tr
                      key={doc.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-900"
                    >
                      <td className="px-6 py-3 font-medium text-gray-800 dark:text-white">
                        {doc.name}
                      </td>
                      <td className="px-6 py-3 text-gray-500 dark:text-gray-400">
                        {doc.pageCount}
                      </td>
                      <td className="px-6 py-3 text-gray-500 dark:text-gray-400">
                        {(doc.sizeBytes / 1_000_000).toFixed(1)} MB
                      </td>
                      <td className="px-6 py-3 text-gray-500 dark:text-gray-400">
                        {owner ? (
                          <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-white">
                              {owner.name || owner.username}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {owner.email}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">
                            Unknown
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <button
                          type="button"
                          onClick={() => {
                            // Find the share link for this document
                            const docLinks = links.filter((l) => l.documentId === doc.id);
                            if (docLinks.length > 0) {
                              handleCopyLink(docLinks[0].url);
                            } else {
                              alert("No share link found for this document");
                            }
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
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                          Copy Link
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )} */}

      {/* Generated Links Table */}
      {/* <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            Generated Links
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
              <tr>
                <th className="px-6 py-3 font-medium">Link</th>
                <th className="px-6 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {links.map((link) => (
                <tr
                  key={link.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  <td className="px-6 py-3">
                    <code className="text-xs text-brand-600 dark:text-brand-400">
                      {link.url}
                    </code>
                  </td>
                  <td className="px-6 py-3 text-gray-500 dark:text-gray-400">
                    {new Date(link.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div> */}
    </div>
  );
}
