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
            <th className="px-6 py-3 font-medium">Email Opened</th>
            <th className="px-6 py-3 font-medium">First Access</th>
            <th className="px-6 py-3 font-medium">Duration</th>
            <th className="px-6 py-3 font-medium">Viewed</th>
            <th className="px-6 py-3 font-medium">Events</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {recipients.map((r) => (
            <tr key={r.recipientId} className="hover:bg-gray-50 dark:hover:bg-gray-900">
              <td className="px-6 py-3">
                <div className="font-medium text-gray-800 dark:text-white">{r.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{r.email}</div>
              </td>
              <td className="px-6 py-3">
                {r.emailOpened ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-500/10 dark:text-green-400">
                    Opened
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                    Not opened
                  </span>
                )}
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
              <td className="px-6 py-3">
                <div className="flex flex-wrap gap-1">
                  {r.events.map((e) => (
                    <span
                      key={e.id}
                      className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                    >
                      {e.type}
                    </span>
                  ))}
                  {r.events.length === 0 && (
                    <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}