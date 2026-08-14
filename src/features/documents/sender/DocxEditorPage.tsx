import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DocxEditor, { type DocxEditorSaveResult } from "./components/DocxEditor";
import {
  getDocumentById,
  getDocumentAccessRole,
  getDocumentRevisions,
  updateEditableDocument,
  saveDocumentRevisions,
  updateRevisionStatus,
} from "../api/documentsApi";
import type { Document } from "../types";

export default function DocxEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<Document | null>(null);
  const [role, setRole] = useState<"owner" | "editor" | "viewer" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus , setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    Promise.all([getDocumentById(id), getDocumentAccessRole(id)])
      .then(([d, r]) => {
        if (!d) {
          throw new Error("Document not found");
        }
        if (!r || (r !== "owner" && r !== "editor")) {
          throw new Error("You do not have permission to edit this document");
        }
        setDoc(d);
        setRole(r);
      })
      .catch((e) => {
        console.error("[DocxEditorPage] Access check failed:", e);
        setError(e instanceof Error ? e.message : "Access denied or document not found.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const handleRevisionStatusChange = useCallback(
    async (revisionId: string, status: "accepted" | "rejected") => {
      if (!id) return;
      try {
        await updateRevisionStatus(id, revisionId, status);
        setDoc((prev) =>
          prev
            ? {
                ...prev,
                revisions: (prev.revisions ?? []).map((r) =>
                  r.id === revisionId ? { ...r, status } : r,
                ),
              }
            : null,
        );
      } catch (e) {
        console.error("[DocxEditorPage] Failed to update revision status:", e);
      }
    },
    [id],
  );

  const handleSave = useCallback(
    async (result: DocxEditorSaveResult, newVersion: number) => {
      if (!id || !doc) {
        console.warn("[DocxEditorPage] Save skipped: id or doc missing", { id, doc });
        return;
      }
      console.log("[DocxEditorPage] Starting handleSave:", { id, newVersion, docName: doc.name });
      setSaveStatus("saving");
      setSaveMessage(null);

      try {
        console.log("[DocxEditorPage] Calling updateEditableDocument with blob size:", result.docxBlob.size);
        const updatedUrl = await updateEditableDocument(
          id,
          result.docxBlob,
          result.pageCount,
          newVersion
        );
        console.log("[DocxEditorPage] updateEditableDocument completed successfully. URL size:", updatedUrl.length);

        // Save tracked change (revision) metadata to Firestore.
        // saveDocumentRevisions returns the canonical merged revision array
        // (existing + new) so local state always mirrors Firebase.
        let mergedRevisions = result.revisions ?? [];
        if (result.revisions && result.revisions.length > 0) {
          console.log("[DocxEditorPage] Saving revisions to Firestore:", result.revisions.length);
          mergedRevisions = await saveDocumentRevisions(id, result.revisions);
          console.log("[DocxEditorPage] Merged revisions now total:", mergedRevisions.length);
        } else {
          // Even if there are no NEW revisions this save, refresh from Firestore
          // so the Change History panel reflects any revisions saved by other editors.
          try {
            mergedRevisions = await getDocumentRevisions(id);
          } catch {
            // Fall back to whatever we already have locally
            mergedRevisions = doc.revisions ?? [];
          }
        }

        setDoc((prev) =>
          prev
            ? {
                ...prev,
                currentVersion: newVersion,
                pageCount: result.pageCount,
                url: updatedUrl,
                dataUrl: updatedUrl,
                revisions: mergedRevisions,
              }
            : null
        );
        setSaveStatus("success");
        setSaveMessage(`Version ${newVersion} saved successfully!`);
        setTimeout(() => {
          setSaveStatus("idle");
          setSaveMessage(null);
        }, 3000);
      } catch (e) {
        console.error("[DocxEditorPage] Failed to save document version:", e);
        setSaveStatus("error");
        setSaveMessage(
          e instanceof Error ? e.message : "Failed to save document. Please try again."
        );
      }
    },
    [id, doc]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm font-semibold text-red-600 dark:text-red-400">
            {error || "Access Denied"}
          </p>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            You must be the owner or have been granted editor access to edit this document.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/docx-viewer")}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
        >
          ← Back to Word Documents
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/docx-viewer")}
            className="rounded-lg border border-gray-300 p-1.5 text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            aria-label="Back to Word Documents"
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
              Edit: {doc.name}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Role: <span className="font-semibold capitalize text-brand-600 dark:text-brand-400">{role}</span> · Version {doc.currentVersion ?? 1}
            </p>
          </div>
        </div>

        {saveMessage && (
          <div
            className={`rounded-lg px-4 py-2 text-xs font-semibold shadow-sm transition-all duration-300 ${
              saveStatus === "success"
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-200 dark:border-red-800"
            }`}
          >
            {saveMessage}
          </div>
        )}
      </div>

      <DocxEditor
        source={doc.dataUrl ?? doc.url ?? null}
        title={doc.name}
        pageCount={doc.pageCount}
        version={doc.currentVersion ?? 1}
        revisions={doc.revisions ?? []}
        onSave={handleSave}
        onRevisionStatusChange={handleRevisionStatusChange}
        height="75vh"
      />
    </div>
  );
}
