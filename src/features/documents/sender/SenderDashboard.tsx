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
} from "../api/documentsApi";
import { getPdfPageCount } from "../utils/pdfUtils";
import { useAppSelector } from "../../../store/hooks";
import { selectUser } from "../../../store/selectors";
import type { Document, Recipient, TrackingLink } from "../types";

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

  // The logged-in user's recipient ID (mapped from DummyJSON user ID).
  const userRecipientId = user ? `rec_${user.id}` : undefined;

  const handleFileAccepted = useCallback(async (file: File) => {
    setUploading(true);
    setUploadError(null);
    setJustUploadedDoc(null);
    try {
      // Parse the actual PDF page count (not hardcoded to 1).
      const pageCount = await getPdfPageCount(file);
      const doc = await registerDocument({
        name: file.name,
        url: URL.createObjectURL(file),
        pageCount,
        sizeBytes: file.size,
        file,
        uploadedBy: userRecipientId,
      });
      setDocuments((prev) => [doc, ...prev]);
      setJustUploadedDoc(doc);
    } catch {
      setUploadError("Failed to upload the PDF. Please try again.");
    } finally {
      setUploading(false);
    }
  }, [userRecipientId]);

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
                .filter((doc) => !userRecipientId || doc.uploadedBy === userRecipientId)
                .map((doc) => {
                const sharedRecipients = recipients.filter((r) =>
                  doc.sharedWith.includes(r.id),
                );
                const docLinks = links.filter((l) => l.documentId === doc.id);
                return (
                  <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
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
                        <span className="text-xs text-gray-400">Not shared</span>
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
                        <span className="text-xs text-gray-400">No link yet</span>
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
                              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                          </svg>
                          Analytics
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

      {/* Generated Links Table */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
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
                <tr key={link.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
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
      </div>
    </div>
  );
}