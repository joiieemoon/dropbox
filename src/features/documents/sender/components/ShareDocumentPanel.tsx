/**
 * ShareDocumentPanel - shown immediately after a successful upload.
 * Lets the uploader select recipients to share the document with and
 * displays the current list of users the document is shared with.
 */

import { useCallback, useMemo, useState } from "react";
import type { Document, Recipient, TrackingLink } from "../../types";
import { shareDocument } from "../../api/documentsApi";

interface ShareDocumentPanelProps {
  /** The document that was just uploaded. */
  document: Document;
  /** All available recipients. */
  recipients: Recipient[];
  /** Callback to update the document in the parent state. */
  onDocumentUpdated: (doc: Document) => void;
  /** Callback when a new tracking link is generated. */
  onLinkGenerated: (link: TrackingLink) => void;
}

export default function ShareDocumentPanel({
  document,
  recipients,
  onDocumentUpdated,
  onLinkGenerated,
}: ShareDocumentPanelProps) {
  const [selectedRecipientId, setSelectedRecipientId] = useState("");
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);
  const [generatedLink, setGeneratedLink] = useState<TrackingLink | null>(null);
  const [copied, setCopied] = useState(false);

  // Recipients who have NOT yet been shared with this document.
  const availableRecipients = useMemo(() => {
    return recipients.filter((r) => !document.sharedWith.includes(r.id));
  }, [recipients, document.sharedWith]);

  // Recipients currently shared with this document.
  const sharedRecipients = useMemo(() => {
    return recipients.filter((r) => document.sharedWith.includes(r.id));
  }, [recipients, document.sharedWith]);

  const handleShare = useCallback(async () => {
    if (!selectedRecipientId) return;
    setSharing(true);
    setShareError(null);
    setShareSuccess(null);
    try {
      const link = await shareDocument(document.id, selectedRecipientId);
      // Update the document's sharedWith list.
      const updatedDoc: Document = {
        ...document,
        sharedWith: [...document.sharedWith, selectedRecipientId],
      };
      onDocumentUpdated(updatedDoc);
      onLinkGenerated(link);
      setGeneratedLink(link);
      setShareSuccess(
        `Document shared successfully! Tracking link generated.`,
      );
      setSelectedRecipientId("");
    } catch {
      setShareError("Failed to share the document. Please try again.");
    } finally {
      setSharing(false);
    }
  }, [document, selectedRecipientId, onDocumentUpdated, onLinkGenerated]);

  return (
    <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50/50 p-4 dark:border-brand-500/30 dark:bg-brand-500/10">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
          Share with users
        </h3>
        <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
          {sharedRecipients.length} shared
        </span>
      </div>

      {/* User selection dropdown */}
      <div className="flex gap-2">
        <select
          value={selectedRecipientId}
          onChange={(e) => setSelectedRecipientId(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
        >
          <option value="">Select a user to share with…</option>
          {availableRecipients.map((rec) => (
            <option key={rec.id} value={rec.id}>
              {rec.username} ({rec.email})
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleShare}
          disabled={!selectedRecipientId || sharing}
          className="shrink-0 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
        >
          {sharing ? "Sharing…" : "Share"}
        </button>
      </div>

      {availableRecipients.length === 0 && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          This document has already been shared with all available users.
        </p>
      )}

      {/* Generated tracking link with copy button */}
      {generatedLink && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-brand-200 bg-white px-3 py-2 dark:border-brand-500/30 dark:bg-gray-900">
          <code className="flex-1 truncate text-xs text-brand-600 dark:text-brand-400">
            {generatedLink.url}
          </code>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(generatedLink.url);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              } catch {
                window.prompt("Copy this link:", generatedLink.url);
              }
            }}
            className="shrink-0 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-600"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      )}

      {shareError && <p className="mt-2 text-sm text-red-500">{shareError}</p>}
      {shareSuccess && (
        <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">
          {shareSuccess}
        </p>
      )}

      {/* Currently shared users list */}
      {sharedRecipients.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Currently shared with
          </p>
          <ul className="space-y-1.5">
            {sharedRecipients.map((rec) => (
              <li
                key={rec.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
              >
                <div className="flex items-center gap-2.5">
                   <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                     {rec.username
                       .split(" ")
                       .map((n) => n[0])
                       .slice(0, 2)
                       .join("")
                       .toUpperCase()}
                   </div>
                   <div>
                     <p className="text-sm font-medium text-gray-800 dark:text-white">
                       {rec.username}
                     </p>
                     <p className="text-xs text-gray-500 dark:text-gray-400">
                       {rec.email}
                     </p>
                   </div>
                </div>
                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
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
                      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Shared
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}