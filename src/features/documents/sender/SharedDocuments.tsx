/**
 * Shared Documents Page - shows documents shared with the current user
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  listSharedDocuments,
  listRecipients,
  listTrackingLinks,
} from "../api/documentsApi";
import type { Document, Recipient } from "../types";

export default function SharedDocuments() {
  const navigate = useNavigate();
  const [sharedDocuments, setSharedDocuments] = useState<Document[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listSharedDocuments(), listRecipients(), listTrackingLinks()])
      .then(([sharedDocs, recs]) => {
        if (cancelled) return;
        setSharedDocuments(sharedDocs);
        setRecipients(recs);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-30">
        <img
          src="/loading_tracksend.gif"
          alt="Loading…"
          className="h-22 w-22 object-contain"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Shared with me
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Documents that other users have shared with you
        </p>
      </div>

      {sharedDocuments.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
            <svg
              className="h-8 w-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
            No shared documents
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            You don't have any documents shared with you yet.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Pages</th>
                  <th className="px-6 py-3 font-medium">Size</th>
                  <th className="px-6 py-3 font-medium">Owner</th>
                  <th className="px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {sharedDocuments.map((doc) => {
                  const owner = recipients.find((r) => r.id === doc.ownerId);
                  return (
                    <tr
                      key={doc.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-900"
                    >
                      <td className="px-6 py-3 font-medium text-gray-800 dark:text-white">
                        {doc.name}
                      </td>
                      <td className="px-6 py-3 text-gray-500 dark:text-gray-400">
                        {doc.pageCount}
                      </td>
                      <td className="px-6 py-3 text-gray-500 dark:text-gray-400">
                        {(doc.sizeBytes / 1_000_000).toFixed(1)} MB
                      </td>
                      <td className="px-6 py-3 text-gray-500 dark:text-gray-400">
                        {owner ? (
                          <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-white">
                              {owner.name || owner.username}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {owner.email}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Unknown</span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-1.5">
                          {/* View */}
                          <div className="group relative">
                            <button
                              type="button"
                              onClick={() =>
                                doc.docType === "docx"
                                  ? navigate(`/docx-viewer/${doc.id}?name=${encodeURIComponent(doc.name)}`)
                                  : navigate(`/documents/${doc.id}`)
                              }
                              title="View document"
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 dark:border-gray-600 dark:text-gray-300 dark:hover:border-blue-500 dark:hover:bg-blue-500/10 dark:hover:text-blue-300"
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
                                  d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                            </button>
                            <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 dark:bg-gray-700">
                              View
                            </span>
                          </div>

                          {/* Edit (docx editor share only) */}
                          {doc.docType === "docx" &&
                            doc.sharedRole === "editor" && (
                              <div className="group relative">
                                <a
                                  href={`/docx-editor/${doc.id}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  title="Edit document"
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600 dark:border-gray-600 dark:text-gray-300 dark:hover:border-indigo-500 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300"
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
                                      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
                                    />
                                  </svg>
                                </a>
                                <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 dark:bg-gray-700">
                                  Edit
                                </span>
                              </div>
                            )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
