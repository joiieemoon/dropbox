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
  listDocumentEditors,
  toggleEditorAccess,
  type DocumentEditorAccess,
} from "../api/documentsApi";
import type { Document } from "../types";
import { useSidebar } from "../../../context/SidebarContext";
export default function DocxEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<Document | null>(null);
  const [role, setRole] = useState<"owner" | "editor" | "viewer" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus , setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [editors, setEditors] = useState<DocumentEditorAccess[]>([]);
  const [editorsLoading, setEditorsLoading] = useState(false);
  const [togglingEditorId, setTogglingEditorId] = useState<string | null>(null);
  const { isMobile } = useSidebar();
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

  // Load editors list when the page loads (only for document owners).
  useEffect(() => {
    if (!id || role !== "owner") return;
    setEditorsLoading(true);
    listDocumentEditors(id)
      .then((editors) => setEditors(editors))
      .catch((e) => {
        console.error("[DocxEditorPage] Failed to load editors:", e);
      })
      .finally(() => {
        setEditorsLoading(false);
      });
  }, [id, role]);

  const handleToggleEditorAccess = useCallback(
    async (recipientId: string, currentlyActive: boolean) => {
      if (!id) return;
      setTogglingEditorId(recipientId);
      try {
        await toggleEditorAccess(id, recipientId, !currentlyActive);
        setEditors((prev) =>
          prev.map((e) =>
            e.recipient.id === recipientId
              ? { ...e, active: !currentlyActive }
              : e,
          ),
        );
      } catch (e) {
        console.error("[DocxEditorPage] Failed to toggle editor access:", e);
        alert("Failed to update editor access. Please try again.");
      } finally {
        setTogglingEditorId(null);
      }
    },
    [id],
  );

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


  if(isMobile) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
      <div className="flex flex-col items-center justify-center gap-4 py-20"> Edit Mode is only supported on desktop browsers. Please use a desktop browser to edit this document.</div>
      <button
        type="button"
        onClick={() => navigate("/docx-viewer")}
        className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
      >
        ← Back to Word Documents
      </button>
      </div>
    )
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

      {/* Editors Access Table - only visible to the document owner */}
      {role === "owner" && (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                  Editor Access
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Users who can edit this document. Toggle to enable or disable their editing access.
                </p>
              </div>
              <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                {editors.length} editor{editors.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {editorsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            </div>
          ) : editors.length === 0 ? (
            <div className="p-10 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                <svg
                  className="h-6 w-6 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                  />
                </svg>
              </div>
              <h3 className="mb-1 text-sm font-semibold text-gray-800 dark:text-white">
                No editors yet
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Share this document with users as "Editor" to grant them editing access.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
                  <tr>
                    <th className="px-6 py-3 font-medium">User</th>
                    <th className="px-6 py-3 font-medium">Email</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Edit Access</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {editors.map(({ recipient, active }) => (
                    <tr
                      key={recipient.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-900"
                    >
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                            {recipient.username
                              .split(" ")
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join("")
                              .toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-800 dark:text-white">
                            {recipient.name || recipient.username}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-gray-500 dark:text-gray-400">
                        {recipient.email || "—"}
                      </td>
                      <td className="px-6 py-3">
                        {active ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                            Disabled
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <button
                          type="button"
                          onClick={() =>
                            handleToggleEditorAccess(recipient.id, active)
                          }
                          disabled={togglingEditorId === recipient.id}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60 ${
                            active
                              ? "bg-emerald-500"
                              : "bg-gray-300 dark:bg-gray-600"
                          }`}
                          title={
                            active
                              ? "Click to disable editing access"
                              : "Click to enable editing access"
                          }
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                              active
                                ? "translate-x-[22px]"
                                : "translate-x-0.5"
                            }`}
                          />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
