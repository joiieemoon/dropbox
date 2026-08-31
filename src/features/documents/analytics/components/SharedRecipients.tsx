import { useState } from "react";
import type { SharedRecipient } from "../lib/documentAnalyticsRows";
import AllRecipientsModal from "./AllRecipientsModal";

interface SharedRecipientsProps {
  recipients: SharedRecipient[];
  documentTitle: string;
}

/**
 * SharedRecipients - compact recipient chips for the "Shared With" column.
 * - 3 or fewer recipients → show all.
 * - more than 3          → show the first 2 plus a clickable "+X" badge that
 *                          opens a modal listing every recipient.
 */
export default function SharedRecipients({
  recipients,
  documentTitle,
}: SharedRecipientsProps) {
  const [showAll, setShowAll] = useState(false);

  const showRemaining = recipients.length > 3;
  const visible = showRemaining ? recipients.slice(0, 2) : recipients;
  const remaining = recipients.length - 2;

  return (
    <>
      <div
        className="flex flex-wrap items-center gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        {visible.map((recipient) => (
          <RecipientChip key={recipient.id} label={recipient.name} />
        ))}

        {showRemaining && (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            title={`Show all ${recipients.length} recipients`}
            aria-label={`Show all ${recipients.length} recipients`}
            className="ml-0.5 inline-flex cursor-pointer items-center rounded-full border border-brand-300 bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700 transition hover:bg-brand-100 hover:ring-2 hover:ring-brand-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-brand-500/40 dark:bg-brand-500/15 dark:text-brand-300 dark:hover:bg-brand-500/25"
          >
            +{remaining}
          </button>
        )}

        {recipients.length === 0 && (
          <span className="text-xs text-gray-400">Not shared</span>
        )}
      </div>

      <AllRecipientsModal
        isOpen={showAll}
        onClose={() => setShowAll(false)}
        documentTitle={documentTitle}
        recipients={recipients}
      />
    </>
  );
}

function RecipientChip({ label }: { label: string }) {
  return (
    <span className="inline-flex max-w-40 items-center truncate rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
      {label}
    </span>
  );
}
