import { formatDuration } from "../lib/formatDuration";
import { formatLastActivity } from "../lib/formatLastActivity";
import type { DocumentAnalyticsRow } from "../lib/documentAnalyticsRows";
import SharedRecipients from "./SharedRecipients";

interface DocumentAnalyticsTableProps {
  rows: DocumentAnalyticsRow[];
  /** Currently selected document id (highlighted row). */
  selectedDocumentId?: string;
  /** Called when a row is clicked so the caller can update its selection. */
  onSelectDocument: (documentId: string) => void;
}

/**
 * DocumentAnalyticsTable - lists every uploaded document with analytics:
 * document, shared-with, views, avg duration, completion, last activity.
 * Clicking a row selects that document.
 */
export default function DocumentAnalyticsTable({
  rows,
  selectedDocumentId,
  onSelectDocument,
}: DocumentAnalyticsTableProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
          Documents
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Analytics for all uploaded documents.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
          No documents to display yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
              <tr>
                <th className="px-6 py-3 font-medium">Document</th>
                <th className="px-6 py-3 font-medium">Shared With</th>
                <th className="px-6 py-3 text-right font-medium">Views</th>
                <th className="px-6 py-3 text-right font-medium">
                  Avg Duration
                </th>
                <th className="px-6 py-3 text-right font-medium">Completion</th>
                <th className="px-6 py-3 text-right font-medium">
                  Last Activity
                </th>
                <th className="px-6 py-3 text-right font-medium">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {rows.map((row) => {
                const durationLabel =
                  row.avgDurationSec > 0
                    ? formatDuration(row.avgDurationSec)
                    : "—";

                return (
                  <tr
                    key={row.documentId}
                    className={`transition-colors ${
                      row.documentId === selectedDocumentId
                        ? "bg-brand-50/60 dark:bg-brand-500/10"
                        : "hover:bg-gray-50 dark:hover:bg-gray-900"
                    }`}
                  >
                    <td className="max-w-72 px-6 py-3">
                      <div
                        className="truncate font-medium text-gray-800 dark:text-white"
                        title={row.documentTitle}
                      >
                        {row.documentTitle}
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <SharedRecipients
                        recipients={row.sharedWith}
                        documentTitle={row.documentTitle}
                      />
                    </td>
                    <td className="px-6 py-3 text-right text-gray-600 dark:text-gray-300">
                      {row.views}
                    </td>
                    <td className="whitespace-nowrap px-6 py-3 text-right text-gray-600 dark:text-gray-300">
                      {durationLabel}
                    </td>
                    <td className="px-6 py-3">
                      <CompletionCell percent={row.completionPercent} />
                    </td>
                    <td className="whitespace-nowrap px-6 py-3 text-right text-gray-600 dark:text-gray-300">
                      {formatLastActivity(row.lastActivityAt)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onSelectDocument(row.documentId)}
                        aria-label={`View analytics for ${row.documentTitle}`}
                        title={`View analytics for ${row.documentTitle}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:focus-visible:ring-brand-400"
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
                            d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CompletionCell({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <div className="flex items-center justify-end gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className="h-full rounded-full bg-brand-500"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="w-10 shrink-0 text-right text-xs font-medium text-gray-600 dark:text-gray-300">
        {clamped}%
      </span>
    </div>
  );
}
