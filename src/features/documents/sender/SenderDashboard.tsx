/**
 * Sender Dashboard - view uploaded PDFs and generate recipient-specific
 * tracking links (DocSend-like replacement mechanic).
 */

import { useCallback, useEffect, useState } from "react";
import FileInput from "../../../components/form/input/components/file-input/FileInput";
import {
  listDocuments,
  listRecipients,
  generateTrackingLink,
  listTrackingLinks,
  registerDocument,
} from "../api/documentsApi";
import type { Document, Recipient, TrackingLink } from "../types";

export default function SenderDashboard() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [links, setLinks] = useState<TrackingLink[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload state.
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Link generation form state.
  const [selectedDocId, setSelectedDocId] = useState("");
  const [selectedRecipientId, setSelectedRecipientId] = useState("");
  const [generatedLink, setGeneratedLink] = useState<TrackingLink | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      if (file.type !== "application/pdf") {
        setUploadError("Only PDF files are supported.");
        return;
      }
      setUploading(true);
      setUploadError(null);
      try {
        const doc = await registerDocument({
          name: file.name,
          url: URL.createObjectURL(file),
          pageCount: 1, // POC: page count is estimated; real parsing would use pdf.js
          sizeBytes: file.size,
          file,
        });
        setDocuments((prev) => [doc, ...prev]);
      } catch {
        setUploadError("Failed to upload the PDF. Please try again.");
      } finally {
        setUploading(false);
        event.target.value = "";
      }
    },
    [],
  );

  const handleGenerate = useCallback(async () => {
    if (!selectedDocId || !selectedRecipientId) return;
    setGenerating(true);
    setCopied(false);
    try {
      const link = await generateTrackingLink(selectedDocId, selectedRecipientId);
      setGeneratedLink(link);
      setLinks((prev) => [link, ...prev]);
    } finally {
      setGenerating(false);
    }
  }, [selectedDocId, selectedRecipientId]);

  const handleCopy = useCallback(async () => {
    if (!generatedLink) return;
    try {
      await navigator.clipboard.writeText(generatedLink.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be unavailable; fall back to prompt.
      window.prompt("Copy this link:", generatedLink.url);
    }
  }, [generatedLink]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Document Management
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Upload PDFs and generate recipient-specific tracking links.
        </p>
      </div>

      {/* Upload Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
          Upload PDF
        </h2>
        <FileInput onChange={handleFileChange} />
        {uploading && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Uploading…
          </p>
        )}
        {uploadError && <p className="mt-2 text-sm text-red-500">{uploadError}</p>}
      </div>

      {/* Link Generation Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
          Generate Tracking Link
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Document
            </label>
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            >
              <option value="">Select a document…</option>
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Recipient
            </label>
            <select
              value={selectedRecipientId}
              onChange={(e) => setSelectedRecipientId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            >
              <option value="">Select a recipient…</option>
              {recipients.map((rec) => (
                <option key={rec.id} value={rec.id}>
                  {rec.name} ({rec.email})
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={!selectedDocId || !selectedRecipientId || generating}
          className="mt-4 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
        >
          {generating ? "Generating…" : "Generate Link"}
        </button>

        {generatedLink && (
          <div className="mt-4 rounded-lg border border-brand-200 bg-brand-50 p-4 dark:border-brand-500/30 dark:bg-brand-500/10">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-brand-600 dark:text-brand-400">
              Your tracking link
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded-md bg-white px-3 py-2 text-sm text-gray-800 dark:bg-gray-900 dark:text-white">
                {generatedLink.url}
              </code>
              <button
                type="button"
                onClick={handleCopy}
                className="shrink-0 rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
              >
                {copied ? "Copied!" : "Copy Link"}
              </button>
            </div>
          </div>
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
                <th className="px-6 py-3 font-medium">Uploaded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {documents.map((doc) => (
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
                  <td className="px-6 py-3 text-gray-500 dark:text-gray-400">
                    {new Date(doc.uploadedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
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