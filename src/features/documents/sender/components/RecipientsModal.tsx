/**
 * RecipientsModal - manage every user shared with a document.
 * Single source of truth for all share CRUD (add, enable/disable, read/edit, revoke).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Modal } from "../../../../components/common/modal/Modal";
import {
  listDocumentAccess,
  revokeAccess,
  shareDocument,
  toggleAccess,
  toggleEditorAccess,
  type DocumentAccessRecord,
} from "../../api/documentsApi";
import {
  toastSuccess,
  toastError,
} from "../../../../components/common/toast/toast";
import type { Document, Recipient, TrackingLink } from "../../types";

interface RecipientsModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** The document whose recipients are being managed. */
  document: Document;
  /** All available users (used for add-user + resolving names). */
  recipients: Recipient[];
  /** The current user's recipient id (excluded from add-user). */
  currentRecipientId?: string;
  /** Called whenever the document's sharedWith list changes. */
  onDocumentUpdated: (doc: Document) => void;
  /** Called when a new tracking link is created by adding a user. */
  onLinkGenerated?: (link: TrackingLink) => void;
}

/** A recipient row derived from sharedWith + access records. */
interface RecipientEntry {
  recipient: Recipient;
  role: "owner" | "editor" | "viewer";
  active: boolean;
}

/** Derive initials (max 2) from a recipient name, e.g. "Ravi Sharma" → "RS". */
function initials(name: string): string {
  const parts = name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean);

  return parts.slice(0, 2).join("").toUpperCase() || "?";
}

export default function RecipientsModal({
  isOpen,
  onClose,
  document,
  recipients,
  currentRecipientId,
  onDocumentUpdated,
  onLinkGenerated,
}: RecipientsModalProps) {
  const [accessRecords, setAccessRecords] = useState<DocumentAccessRecord[]>(
    [],
  );
  const [loadingRecords, setLoadingRecords] = useState(false);

  // Add-user form starts collapsed; the user must click "Add user" to open it.
  const [showAddForm, setShowAddForm] = useState(false);

  // Per-recipient mutation state.
  const [pendingId, setPendingId] = useState<string | null>(null);
  const pendingRef = useRef(false);
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);

  // Add-user state.
  const [newRecipientId, setNewRecipientId] = useState("");
  const [newRole, setNewRole] = useState<"viewer" | "editor">("viewer");
  const [adding, setAdding] = useState(false);

  const isDocx = document.docType === "docx";

  // Load access records whenever the modal opens (or the doc changes).
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    // Clear previous records immediately so stale access data is never shown
    // while the new document's access data is being fetched.
    setAccessRecords([]);
    setLoadingRecords(true);

    listDocumentAccess(document.id)
      .then((records) => {
        if (!cancelled) {
          setAccessRecords(records);
        }
      })
      .catch((error) => {
        console.error(
          "[RecipientsModal] Failed to load access records:",
          error,
        );

        if (!cancelled) {
          setAccessRecords([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingRecords(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, document.id]);

  // Reset transient state when the modal closes.
  useEffect(() => {
    if (!isOpen) {
      setPendingId(null);
      pendingRef.current = false;
      setConfirmRevokeId(null);
      setNewRecipientId("");
      setNewRole("viewer");
      setShowAddForm(false);
    }
  }, [isOpen]);

  // Every recipient currently shared with the document, merged with access state.
  const sharedEntries: RecipientEntry[] = document.sharedWith.map((id) => {
    const rec = recipients.find((r) => r.id === id);
    const acc = accessRecords.find((a) => a.recipient.id === id);

    return {
      recipient: rec ??
        acc?.recipient ?? {
          id,
          email: "",
          name: "",
          username: id,
        },
      role: acc?.role ?? "viewer",
      active: acc?.active ?? true,
    };
  });

  // Users that can still be added (not shared yet, not the current user).
  const availableRecipients = recipients.filter(
    (r) => !document.sharedWith.includes(r.id) && r.id !== currentRecipientId,
  );

  const updateAccessRecord = useCallback(
    (id: string, patch: Partial<DocumentAccessRecord>) => {
      setAccessRecords((prev) =>
        prev.map((a) => (a.recipient.id === id ? { ...a, ...patch } : a)),
      );
    },
    [],
  );

  /** Toggle edit mode (editor) vs read mode (viewer) for a recipient. */
  const handleRoleChange = useCallback(
    async (id: string, role: "viewer" | "editor") => {
      if (pendingRef.current) return;

      pendingRef.current = true;
      setPendingId(id);

      try {
        if (role === "editor") {
          await toggleEditorAccess(document.id, id, true);
        } else {
          await toggleAccess(document.id, id, true);
        }

        updateAccessRecord(id, {
          role,
          active: true,
        });

        toastSuccess(
          role === "editor"
            ? "Edit access enabled."
            : "Read-only mode enabled.",
        );
      } catch (error) {
        console.error("[RecipientsModal] Failed to change role:", error);
        toastError("Failed to update access role. Please try again.");
      } finally {
        pendingRef.current = false;
        setPendingId(null);
      }
    },
    [document.id, updateAccessRecord],
  );

  /** Enable/disable access while preserving the current role. */
  const handleToggleActive = useCallback(
    async (entry: RecipientEntry, active: boolean) => {
      if (pendingRef.current) return;

      pendingRef.current = true;
      setPendingId(entry.recipient.id);

      try {
        if (entry.role === "editor") {
          await toggleEditorAccess(document.id, entry.recipient.id, active);
        } else {
          await toggleAccess(document.id, entry.recipient.id, active);
        }

        updateAccessRecord(entry.recipient.id, {
          active,
        });

        toastSuccess(active ? "Access enabled." : "Access disabled.");
      } catch (error) {
        console.error("[RecipientsModal] Failed to toggle access:", error);
        toastError("Failed to update access. Please try again.");
      } finally {
        pendingRef.current = false;
        setPendingId(null);
      }
    },
    [document.id, updateAccessRecord],
  );

  /** Revoke access entirely (removes from sharedWith + deactivates record). */
  const handleConfirmRevoke = useCallback(
    async (id: string) => {
      if (pendingRef.current) return;

      pendingRef.current = true;
      setPendingId(id);

      try {
        await revokeAccess(document.id, id);

        onDocumentUpdated({
          ...document,
          sharedWith: document.sharedWith.filter((r) => r !== id),
        });

        // Drop the local access record too so a re-add in this same session
        // starts fresh and the stale record can't win the .find() lookup.
        setAccessRecords((prev) =>
          prev.filter((a) => a.recipient.id !== id),
        );

        setConfirmRevokeId(null);

        toastSuccess("Access revoked successfully!");
      } catch (error) {
        console.error("[RecipientsModal] Failed to revoke access:", error);
        toastError("Failed to revoke access. Please try again.");
      } finally {
        pendingRef.current = false;
        setPendingId(null);
      }
    },
    [document, onDocumentUpdated],
  );

  /** Share the document with a new user from the add-user section. */
  const handleAddUser = useCallback(async () => {
    if (!newRecipientId || adding) return;

    setAdding(true);

    try {
      const role = isDocx ? newRole : "viewer";

      const link = await shareDocument(document.id, newRecipientId, role);

      onDocumentUpdated({
        ...document,
        sharedWith: [...document.sharedWith, newRecipientId],
      });

      setAccessRecords((prev) => {
        const recipient =
          recipients.find((r) => r.id === newRecipientId) ??
          ({
            id: newRecipientId,
            email: "",
            name: "",
            username: newRecipientId,
          } as Recipient);

        const record: DocumentAccessRecord = {
          recipient,
          role,
          active: true,
        };

        // Upsert instead of blind-append: if a stale record for this user
        // exists (e.g. shared then revoked earlier in the same session),
        // replace it so the row immediately reflects the freshly granted
        // role instead of the outdated one.
        const existingIndex = prev.findIndex(
          (a) => a.recipient.id === newRecipientId,
        );

        if (existingIndex === -1) return [...prev, record];

        return prev.map((a, i) => (i === existingIndex ? record : a));
      });

      onLinkGenerated?.(link);

      toastSuccess(
        `Shared "${document.name}" as ${role} with ${
          recipients.find((r) => r.id === newRecipientId)?.username ?? "user"
        }!`,
      );

      setNewRecipientId("");
      setNewRole("viewer");
      setShowAddForm(false);
    } catch (error) {
      console.error("[RecipientsModal] Failed to share document:", error);
      toastError("Failed to share the document. Please try again.");
    } finally {
      setAdding(false);
    }
  }, [
    adding,
    isDocx,
    newRecipientId,
    newRole,
    document,
    recipients,
    onDocumentUpdated,
    onLinkGenerated,
  ]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              Recipients ({document.sharedWith.length})
            </h2>

            <p className="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">
              {document.name}
            </p>
          </div>

          {isDocx && (
            <span className="shrink-0 rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
              Editable document
            </span>
          )}
        </div>

        {/* Do not render recipients until access data has been fetched.
            This prevents the default viewer/active values from flashing
            before the real access records arrive. */}
        {loadingRecords ? (
          <div className="flex min-h-[180px] items-center justify-center py-10">
            <div className="flex flex-col items-center gap-3">
              <div
                className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"
                aria-label="Loading access"
              />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Loading access...
              </span>
            </div>
          </div>
        ) : sharedEntries.length === 0 ? (
          <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
            No recipients for this document yet.
          </p>
        ) : (
          <ul className="mt-5 max-h-[45vh] space-y-2 overflow-y-auto pr-1">
            {sharedEntries.map((entry) => (
              <RecipientListItem
                key={entry.recipient.id}
                entry={entry}
                isDocx={isDocx}
                pending={pendingId === entry.recipient.id}
                confirmingRevoke={confirmRevokeId === entry.recipient.id}
                onRoleChange={handleRoleChange}
                onToggleActive={handleToggleActive}
                onAskRevoke={() => setConfirmRevokeId(entry.recipient.id)}
                onCancelRevoke={() => setConfirmRevokeId(null)}
                onConfirmRevoke={handleConfirmRevoke}
              />
            ))}
          </ul>
        )}

        {/* Add user section */}
        {showAddForm && (
          <div className="mt-5 rounded-xl border border-dashed border-brand-300 bg-brand-50/50 p-4 dark:border-brand-500/30 dark:bg-brand-500/5">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Add user
              </p>

              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                disabled={adding}
                className="rounded-lg p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-60 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                title="Close add user"
                aria-label="Close add user"
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
                    d="M6 6l12 12M18 6L6 18"
                  />
                </svg>
              </button>
            </div>

            {availableRecipients.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                All available users have access to this document.
              </p>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row">
                <select
                  value={newRecipientId}
                  onChange={(e) => setNewRecipientId(e.target.value)}
                  disabled={adding}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                >
                  <option value="">Choose a user…</option>

                  {availableRecipients.map((rec) => (
                    <option key={rec.id} value={rec.id}>
                      {rec.username} ({rec.email})
                    </option>
                  ))}
                </select>

                {isDocx && (
                  <select
                    value={newRole}
                    onChange={(e) =>
                      setNewRole(e.target.value as "viewer" | "editor")
                    }
                    disabled={adding}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                  >
                    <option value="viewer">Viewer (Read-only)</option>
                    <option value="editor">Editor (Can edit & save)</option>
                  </select>
                )}

                <button
                  type="button"
                  onClick={handleAddUser}
                  disabled={!newRecipientId || adding}
                  className="shrink-0 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
                >
                  {adding ? "Adding…" : "Add"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Show the same Add user button at the bottom for both PDF and DOCX. */}
        {!showAddForm && availableRecipients.length > 0 && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-brand-300 px-3 py-1.5 text-sm font-medium text-brand-600 transition hover:bg-brand-50 dark:border-brand-500/40 dark:text-brand-300 dark:hover:bg-brand-500/10"
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
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Add user
          </button>
        )}
      </div>
    </Modal>
  );
}

interface RecipientListItemProps {
  entry: RecipientEntry;
  isDocx: boolean;
  pending: boolean;
  confirmingRevoke: boolean;
  onRoleChange: (id: string, role: "viewer" | "editor") => void;
  onToggleActive: (entry: RecipientEntry, active: boolean) => void;
  onAskRevoke: () => void;
  onCancelRevoke: () => void;
  onConfirmRevoke: (id: string) => void;
}

function RecipientListItem({
  entry,
  isDocx,
  pending,
  confirmingRevoke,
  onRoleChange,
  onToggleActive,
  onAskRevoke,
  onCancelRevoke,
  onConfirmRevoke,
}: RecipientListItemProps) {
  const { recipient, role, active } = entry;

  return (
    <li
      className={`rounded-xl border p-3 dark:border-gray-700 ${
        active
          ? "border-gray-200 bg-gray-50 dark:bg-gray-900"
          : "border-gray-200 bg-gray-50 opacity-70 dark:border-gray-800 dark:bg-gray-900"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
          {initials(recipient.name || recipient.username)}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-800 dark:text-white">
            {recipient.name || recipient.username}
          </p>

          <p className="truncate text-xs text-gray-500 dark:text-gray-400">
            {recipient.email || "—"}
          </p>
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        {role === "owner" ? (
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
            Owner
          </span>
        ) : (
          <>
            {isDocx && (
              <div className="inline-flex overflow-hidden rounded-lg border border-gray-300 dark:border-gray-600">
                <button
                  type="button"
                  disabled={pending || role === "viewer"}
                  onClick={() => onRoleChange(recipient.id, "viewer")}
                  title="Viewer (read-only)"
                  className={`px-2.5 py-1 text-xs font-medium transition disabled:cursor-not-allowed ${
                    role === "viewer"
                      ? "bg-brand-500 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  Read-only
                </button>

                <button
                  type="button"
                  disabled={pending || role === "editor"}
                  onClick={() => onRoleChange(recipient.id, "editor")}
                  title="Editor (can edit & save)"
                  className={`px-2.5 py-1 text-xs font-medium transition disabled:cursor-not-allowed ${
                    role === "editor"
                      ? "bg-brand-500 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  Can edit
                </button>
              </div>
            )}

            {/* Enable / disable access switch */}
            <button
              type="button"
              onClick={() => onToggleActive(entry, !active)}
              disabled={pending}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60 ${
                active ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"
              }`}
              title={
                active ? "Click to disable access" : "Click to enable access"
              }
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  active ? "translate-x-[22px]" : "translate-x-0.5"
                }`}
              />
            </button>

            <span className="text-xs text-gray-500 dark:text-gray-400">
              {active
                ? role === "editor"
                  ? "Edit access on"
                  : "Read mode on"
                : "Access off"}
            </span>

            <div className="ml-auto">
              {confirmingRevoke ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-red-600 dark:text-red-400">
                    Revoke?
                  </span>

                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => onConfirmRevoke(recipient.id)}
                    className="rounded-lg bg-red-500 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-red-600 disabled:opacity-60"
                  >
                    Yes
                  </button>

                  <button
                    type="button"
                    disabled={pending}
                    onClick={onCancelRevoke}
                    className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-600 transition hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onAskRevoke}
                  disabled={pending}
                  title="Revoke access"
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
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
                  Revoke
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </li>
  );
}
