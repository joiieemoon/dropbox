/**
 * DocxViewerPage - standalone page to upload a .docx file and view it
 * read-only in the browser. Completely additive: it does NOT touch the
 * existing PDF upload / share / tracking pipeline.
 */

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DocxDropzone from "./components/DocxDropzone";
import DocxViewer from "./components/DocxViewer";
import { listDocuments, registerEditableDocument } from "../api/documentsApi";
import type { Document } from "../types";

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [docxDocs, setDocxDocs] = useState<Document[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [docxDataUrl, setDocxDataUrl] = useState<string | null>(null);

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
  }, [loadDocxDocuments]);

  const handleFileAccepted = useCallback(async (file: File) => {
    setSelectedFile(file);
    setError(null);
    setSaved(false);
    
    // Convert file to base64 data URL for the viewer
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
      await registerEditableDocument(selectedFile);
      setSaved(true);
      await loadDocxDocuments();
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
              <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
                Word Document Viewer
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Upload a .docx file and preview it directly in the browser.
              </p>
            </div>
          </div>
        </div>
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
                onClick={() => setSelectedFile(null)}
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
             <DocxViewer source={docxDataUrl} title={selectedFile.name} />

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
                  Saved to Firebase
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
                    Saving…
                  </>
                ) : saved ? (
                  "Saved"
                ) : (
                  "Save to Firebase"
                )}
              </button>
            </div>
          </div>
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
                  <th className="px-4 py-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {loadingDocs ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-6 text-center text-xs text-gray-500"
                    >
                      Loading…
                    </td>
                  </tr>
                ) : docxDocs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-6 text-center text-xs text-gray-500"
                    >
                      No Word documents uploaded yet.
                    </td>
                  </tr>
                ) : (
                  docxDocs.map((doc) => (
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
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
