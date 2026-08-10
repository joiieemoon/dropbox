/**
 * RecipientAnalyticsTable - expandable MUI-style table showing per-recipient analytics
 * with expandable rows containing page-by-page time tracking graphs.
 */

import { useState, useCallback } from "react";
import { getRecipientPageDwell } from "../../api/analyticsApi";
import type { RecipientAnalytics } from "../../types";

interface RecipientAnalyticsTableProps {
  documentId: string;
  recipients: RecipientAnalytics[];
  pageCount: number;
}

interface PageDwellData {
  page: number;
  seconds: number;
}

export default function RecipientAnalyticsTable({
  documentId,
  recipients,
  pageCount,
}: RecipientAnalyticsTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [pageDwellData, setPageDwellData] = useState<Map<string, PageDwellData[]>>(new Map());
  const [loading, setLoading] = useState(false);

  const handleRowClick = useCallback(async (recipientId: string) => {
    if (expandedRow === recipientId) {
      setExpandedRow(null);
      return;
    }

    setExpandedRow(recipientId);
    setLoading(true);

    try {
      const data = await getRecipientPageDwell(documentId, recipientId);
      setPageDwellData(data);
    } catch (error) {
      console.error("Failed to fetch page dwell data:", error);
    } finally {
      setLoading(false);
    }
  }, [documentId, expandedRow]);

  const getPageDwellForRecipient = (recipientId: string): PageDwellData[] => {
    const data = pageDwellData.get(recipientId) || [];
    
    // Aggregate seconds by page (in case of multiple events per page from 5s flush intervals)
    const aggregated = new Map<number, number>();
    data.forEach(d => {
      aggregated.set(d.page, (aggregated.get(d.page) || 0) + d.seconds);
    });
    
    return Array.from(aggregated.entries())
      .map(([page, seconds]) => ({ page, seconds }))
      .sort((a, b) => a.page - b.page);
  };

  const formatDuration = (seconds: number): string => {
    if (seconds <= 0) return "0s";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const getMaxSeconds = (dwellData: PageDwellData[]): number => {
    return Math.max(...dwellData.map(d => d.seconds), 1);
  };

  if (recipients.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
        No recipients to display
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
          <tr>
            <th className="px-6 py-3 font-medium">Recipient</th>
            <th className="px-6 py-3 font-medium">Duration</th>
            <th className="px-6 py-3 font-medium">Completion</th>
            <th className="px-6 py-3 font-medium">Max Page</th>
            <th className="px-6 py-3 font-medium">First Access</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {recipients.map((recipient) => {
            const isExpanded = expandedRow === recipient.recipientId;
            const dwellData = getPageDwellForRecipient(recipient.recipientId);
            const maxSeconds = getMaxSeconds(dwellData);

            return (
              <>
                <tr
                  key={recipient.recipientId}
                  onClick={() => handleRowClick(recipient.recipientId)}
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                        {recipient.username
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-white">
                          {recipient.name || recipient.username}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {recipient.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-gray-500 dark:text-gray-400">
                    {formatDuration(recipient.totalDurationSec)}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-16 rounded-full bg-gray-200 dark:bg-gray-700">
                        <div
                          className="h-2 rounded-full bg-brand-500"
                          style={{ width: `${Math.min(recipient.completionPercent, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {recipient.completionPercent}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-gray-500 dark:text-gray-400">
                    {recipient.maxPageReached > 0 ? (
                      <span className="inline-flex items-center rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                        Page {recipient.maxPageReached}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-gray-500 dark:text-gray-400">
                    {recipient.firstAccessAt ? (
                      <span className="text-xs">
                        {new Date(recipient.firstAccessAt).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                </tr>
                {isExpanded && (
                  <tr key={`${recipient.recipientId}-expanded`}>
                    <td colSpan={5} className="px-6 py-4">
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
                        <h4 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white">
                          Time Spent Per Page
                        </h4>
                        {loading ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                          </div>
                        ) : dwellData.length > 0 ? (
                          <div className="space-y-2">
                            {Array.from({ length: pageCount }, (_, i) => {
                              const page = i + 1;
                              const pageInfo = dwellData.find(d => d.page === page);
                              const seconds = pageInfo?.seconds || 0;
                              const widthPercent = (seconds / maxSeconds) * 100;

                              return (
                                <div key={page} className="flex items-center gap-3">
                                  <div className="w-12 text-xs text-gray-600 dark:text-gray-400">
                                    Pg {page}
                                  </div>
                                  <div className="flex-1 h-6 rounded bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
                                    <div
                                      className="h-full rounded bg-brand-500 transition-all"
                                      style={{ width: `${widthPercent}%` }}
                                    />
                                    <div className="absolute inset-0 flex items-center px-2">
                                      <span className="text-xs font-medium text-gray-100 dark:text-gray-300">
                                        {seconds > 0 ? `${seconds}s` : "-"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            No page-level data available for this recipient.
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}