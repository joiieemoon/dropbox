import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { listDocumentAnalytics } from "../api/analyticsApi";
import type { DocumentAnalytics } from "../types";
import PageDwellChart from "./components/PageDwellChart";
import RecipientTable from "./components/RecipientTable";

function formatDuration(sec: number): string {
  if (sec <= 0) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function AnalyticsDashboard() {
  const [searchParams] = useSearchParams();
  const requestedDoc = searchParams.get("doc");
  const [analytics, setAnalytics] = useState<DocumentAnalytics[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    listDocumentAnalytics()
      .then((data) => {
        if (cancelled) return;
        setAnalytics(data);
        // Pre-select the document from the URL query param if present.
        const initialDoc =
          data.find((a) => a.documentId === requestedDoc) ?? data[0];
        if (initialDoc) setSelectedDocId(initialDoc.documentId);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [requestedDoc]);

  const selected =
    analytics.find((a) => a.documentId === selectedDocId) ?? null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
            Analytics Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Document-level and recipient-level engagement insights.
          </p>
        </div>
        <select
          value={selectedDocId}
          onChange={(e) => setSelectedDocId(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
        >
          {analytics.map((a) => (
            <option key={a.documentId} value={a.documentId}>
              {a.documentTitle}
            </option>
          ))}
        </select>
      </div>

      {selected ? (
        <>
          {/* Document-level metric cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <MetricCard
              label="Recipients"
              value={String(selected.totalRecipients)}
            />
            <MetricCard
              label="Avg Duration"
              value={formatDuration(selected.avgDurationSec)}
            />
            <MetricCard
              label="Avg Viewed"
              value={`${selected.avgCompletionPercent}%`}
            />
          </div>

          {/* Page dwell chart */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
              Average Seconds Per Page
            </h2>
            <PageDwellChart data={selected.avgPageDwell} />
          </div>

          {/* Recipient table */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                Recipient Engagement
              </h2>
            </div>
            <RecipientTable recipients={selected.recipients} />
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
          No analytics available.
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-gray-800 dark:text-white">
        {value}
      </p>
    </div>
  );
}
