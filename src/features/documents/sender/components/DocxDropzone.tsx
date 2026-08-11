/**
 * DocxDropzone - drag-and-drop / click-to-select upload for .docx files.
 * Completely separate from PdfDropzone so the existing PDF upload flow is untouched.
 */

import { useCallback, useRef, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";

interface DocxDropzoneProps {
  /** Called with the selected .docx file. */
  onFileAccepted: (file: File) => void;
  /** Whether a file has already been selected. */
  hasFile?: boolean;
  /** Optional error message from the parent. */
  error?: string | null;
}

const MAX_FILE_SIZE_MB = 1;

export default function DocxDropzone({
  onFileAccepted,
  hasFile = false,
  error = null,
}: DocxDropzoneProps) {
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      setLocalError(null);

      if (rejectedFiles.length > 0) {
        const rejected = rejectedFiles[0];
        const code = rejected.errors[0]?.code;
        if (code === "file-invalid-type") {
          setLocalError(
            "Only Word documents are supported. Please select a .docx file.",
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

      const file = acceptedFiles[0];
      if (!file) return;

      // Extra safety checks.
      if (
        !file.name.toLowerCase().endsWith(".docx") &&
        file.type !==
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        setLocalError("Only .docx files are supported.");
        return;
      }
      if (file.size === 0) {
        setLocalError(
          "The selected file is empty. Please choose a valid document.",
        );
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
    [onFileAccepted],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
    },
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE_MB * 1024 * 1024,
    multiple: false,
    noClick: true, // handle click manually to keep the hidden input in control
  });

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const displayError = error ?? localError;

  const dropzoneClassName = `flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
    hasFile ? "cursor-default opacity-60" : "cursor-pointer"
  } ${
    isDragActive
      ? "border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-500/10"
      : "border-gray-300 bg-gray-50 hover:border-brand-400 hover:bg-brand-50/50 dark:border-gray-600 dark:bg-gray-900 dark:hover:border-brand-500 dark:hover:bg-brand-500/5"
  }`;

  return (
    <div>
      <div
        {...getRootProps()}
        onClick={handleClick}
        className={dropzoneClassName}
      >
        <input {...getInputProps()} ref={inputRef} />
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
          <svg
            className="h-6 w-6"
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
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {hasFile ? (
            "Document selected — choose another to replace it"
          ) : isDragActive ? (
            "Drop the Word document here…"
          ) : (
            <>
              Drag & drop your Word document here, or{" "}
              <span className="text-brand-600 dark:text-brand-400">browse</span>
            </>
          )}
        </p>
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
          .docx files only · up to {MAX_FILE_SIZE_MB} MB
        </p>
      </div>

      {displayError && (
        <p className="mt-3 text-sm text-red-500">{displayError}</p>
      )}
    </div>
  );
}