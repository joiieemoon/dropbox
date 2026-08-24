/**
 * UploadProgressToast - floating upload progress indicator fixed to the
 * bottom-right corner. Shows real upload progress (0-100%) with an animated
 * progress bar, file name, and success/error states.
 */

import { useEffect, useState } from "react";

export type UploadProgressStatus = "uploading" | "success" | "error";

interface UploadProgressToastProps {
  /** File name being uploaded. */
  fileName: string;
  /** Document type: "pdf" or "docx". */
  docType: "pdf" | "docx";
  /** Current upload progress 0-100. */
  progress: number;
  /** Current status of the upload. */
  status: UploadProgressStatus;
  /** Optional error message to display. */
  errorMessage?: string | null;
  /** Called when the user dismisses the toast. */
  onDismiss?: () => void;
}

export default function UploadProgressToast({
  fileName,
  docType,
  progress,
  status,
  errorMessage = null,
  onDismiss,
}: UploadProgressToastProps) {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);

  // Auto-dismiss on success after a short delay.
  useEffect(() => {
    if (status === "success") {
      const timer = setTimeout(() => {
        setLeaving(true);
        setTimeout(() => {
          setVisible(false);
          onDismiss?.();
        }, 300);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [status, onDismiss]);

  if (!visible) return null;

  const clampedProgress = Math.min(100, Math.max(0, progress));
  const isSuccess = status === "success";
  const isError = status === "error";

  const iconSrc = docType === "pdf" ? "/pdf.png" : "/docx.png";

  return (
    <div
      className={`fixed bottom-5 right-5 z-[999999] w-80 overflow-hidden rounded-xl border bg-white shadow-2xl transition-all duration-300 dark:bg-gray-800 ${
        leaving
          ? "translate-y-4 opacity-0"
          : "translate-y-0 opacity-100"
      } ${
        isError
          ? "border-red-200 dark:border-red-800"
          : isSuccess
            ? "border-emerald-200 dark:border-emerald-800"
            : "border-gray-200 dark:border-gray-700"
      }`}
      role="status"
      aria-live="polite"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-3">
        <img
          src={iconSrc}
          alt={`${docType.toUpperCase()} icon`}
          className="h-8 w-8 shrink-0 object-contain"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-800 dark:text-white">
            {fileName}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {isSuccess
              ? "Upload complete"
              : isError
                ? "Upload failed"
                : `Uploading… ${Math.round(clampedProgress)}%`}
          </p>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={() => {
              setLeaving(true);
              setTimeout(() => {
                setVisible(false);
                onDismiss();
              }, 300);
            }}
            aria-label="Dismiss upload notification"
            className="rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Progress bar / status */}
      <div className="px-4 pb-4 pt-2">
        {isSuccess ? (
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            <svg
              className="h-5 w-5"
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
            Uploaded successfully
          </div>
        ) : isError ? (
          <div className="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
            {errorMessage ?? "Upload failed. Please try again."}
          </div>
        ) : (
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-full rounded-full bg-brand-500 transition-all duration-300 ease-out"
              style={{ width: `${clampedProgress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}