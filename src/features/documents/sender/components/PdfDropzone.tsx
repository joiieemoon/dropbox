/**
 * PdfDropzone - robust drag-and-drop / click-to-select PDF upload component.
 * Handles edge cases: non-PDF files, empty files, multiple files, drag state.
 */

import { useCallback, useRef, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";

interface PdfDropzoneProps {
  /** Called with the selected PDF file. */
  onFileAccepted: (file: File) => void;
  /** Whether an upload is currently in progress. */
  uploading?: boolean;
  /** Optional error message to display. */
  error?: string | null;
  /** Whether the dropzone is disabled. */
  disabled?: boolean;
}

const MAX_FILE_SIZE_MB = 2;

export default function PdfDropzone({
  onFileAccepted,
  uploading = false,
  error = null,
  disabled = false,
}: PdfDropzoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (disabled) return;
      // Clear previous local error.
      setLocalError(null);

      // Handle rejected files with clear error messages.
      if (rejectedFiles.length > 0) {
        const rejected = rejectedFiles[0];
        const code = rejected.errors[0]?.code;
        if (code === "file-invalid-type") {
          setLocalError(
            "Only PDF files are supported. Please select a .pdf file.",
          );
        } else if (code === "file-too-large") {
          setLocalError(
            `File is too large. Maximum size is ${MAX_FILE_SIZE_MB} MB.`,
          );
        } else {
          setLocalError(
            "This file could not be uploaded. Please try another file.",
          );
        }
        return;
      }

      // Take only the first accepted file (single-file upload).
      const file = acceptedFiles[0];
      if (!file) return;

      // Extra safety checks.
      if (
        file.type !== "application/pdf" &&
        !file.name.toLowerCase().endsWith(".pdf")
      ) {
        setLocalError(
          "Only PDF files are supported. Please select a .pdf file.",
        );
        return;
      }
      if (file.size === 0) {
        setLocalError("The selected file is empty. Please choose a valid PDF.");
        return;
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setLocalError(
          `File is too large. Maximum size is ${MAX_FILE_SIZE_MB} MB.`,
        );
        return;
      }

      onFileAccepted(file);
    },
    [onFileAccepted, disabled],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE_MB * 1024 * 1024,
    multiple: false,
    noClick: true, // We handle click manually to avoid double-triggering.
    disabled,
  });

  const handleClick = useCallback(() => {
    if (!disabled) {
      inputRef.current?.click();
    }
  }, [disabled]);

  const displayError = error ?? localError;

  const dropzoneClassName = `flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
    disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
  } ${
    isDragActive || dragActive
      ? "border-blue-400 bg-blue-50 dark:border-blue-500 dark:bg-blue-500/10"
      : disabled
        ? "border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800"
        : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100/50 dark:border-gray-600 dark:bg-gray-900 dark:hover:border-gray-500 dark:hover:bg-gray-500/5"
  }`;

  return (
    <div>
      <div
        {...getRootProps()}
        onClick={handleClick}
        onDragEnter={() => !disabled && setDragActive(true)}
        onDragLeave={() => setDragActive(false)}
        className={dropzoneClassName}
      >
        <input {...getInputProps()} ref={inputRef} />
        <img
          src="/pdf.png"
          alt="PDF icon"
          className="mb-3 h-12 w-12 object-contain"
        />
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {isDragActive || dragActive ? (
            "Drop the PDF here…"
          ) : (
            <>
              Drag & drop your PDF here, or{" "}
              <span className="text-gray-600 dark:text-gray-400">browse</span>
            </>
          )}
        </p>
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
          PDF files only · up to {MAX_FILE_SIZE_MB} MB
        </p>
      </div>

      {uploading && (
        <div className="mt-3 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          Uploading PDF…
        </div>
      )}

      {displayError && (
        <p className="mt-3 text-sm text-red-500">{displayError}</p>
      )}
    </div>
  );
}
