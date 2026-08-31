import { Modal } from "../../../../components/common/modal/Modal";
import type { SharedRecipient } from "../lib/documentAnalyticsRows";

interface AllRecipientsModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentTitle: string;
  recipients: SharedRecipient[];
}

/** Derive initials (max 2) from a recipient name, e.g. "Ravi Sharma" → "RS". */
function initials(name: string): string {
  const parts = name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean);
  return parts.slice(0, 2).join("").toUpperCase() || "?";
}

/**
 * AllRecipientsModal - shows every participant assigned to a single document.
 * Reuses the shared Modal component. Scrollable for documents with many recipients.
 */
export default function AllRecipientsModal({
  isOpen,
  onClose,
  documentTitle,
  recipients,
}: AllRecipientsModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
          All {recipients.length } Recipients
        </h2>
        <p className="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">
          {documentTitle}
        </p>

        

        {recipients.length === 0 ? (
          <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
            No recipients for this document.
          </p>
        ) : (
          <ul className="mt-5 max-h-[55vh] space-y-2 overflow-y-auto pr-1">
            {recipients.map((recipient) => (
              <RecipientListItem key={recipient.id} recipient={recipient} />
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}

function RecipientListItem({ recipient }: { recipient: SharedRecipient }) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
        {initials(recipient.name)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-800 dark:text-white">
          {recipient.name}
        </p>
        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
          {recipient.email || "—"}
        </p>
      </div>
      <span
        className={
          recipient.viewed
            ? "shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
            : "shrink-0 rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400"
        }
      >
        {recipient.viewed ? "Viewed" : "Not viewed"}
      </span>
    </li>
  );
}
