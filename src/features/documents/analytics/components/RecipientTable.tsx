import type { RecipientAnalytics } from "../../types";

interface Props {
  recipients: RecipientAnalytics[];
}

function formatDuration(sec: number): string {
  if (sec <= 0) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function RecipientTable({ recipients }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
          <tr>
            <th className="px-6 py-3 font-medium">Recipient</th>
            <th className="px-6 py-3 font-medium">First Access</th>
            <th className="px-6 py-3 font-medium">Duration</th>
            <th className="px-6 py-3 font-medium">Viewed</th>
            <th className="px-6 py-3 font-medium">Max Page</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {recipients.map((r) => (
            <tr key={r.recipientId} className="hover:bg-gray-50 dark:hover:bg-gray-900">
              <td className="px-6 py-3">
                <div className="font-medium text-gray-800 dark:text-white">{r.username}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{r.email}</div>
              </td>
              <td className="px-6 py-3 text-gray-500 dark:text-gray-400">
                {r.firstAccessAt ? new Date(r.firstAccessAt).toLocaleString() : "—"}
              </td>
              <td className="px-6 py-3 text-gray-500 dark:text-gray-400">
                {formatDuration(r.totalDurationSec)}
              </td>
              <td className="px-6 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      className="h-full rounded-full bg-brand-500"
                      style={{ width: `${r.completionPercent}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {r.completionPercent}%
                  </span>
                </div>
              </td>
              <td className="px-6 py-3 text-gray-500 dark:text-gray-400">
                {r.maxPageReached > 0 ? r.maxPageReached : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}