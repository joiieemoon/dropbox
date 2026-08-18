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
      ? "border-blue-400 bg-blue-50 dark:border-blue-500 dark:bg-blue-500/10"
      : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100/50 dark:border-gray-600 dark:bg-gray-900 dark:hover:border-gray-500 dark:hover:bg-gray-500/5"
  }`;

  return (
    <div>
      <div
        {...getRootProps()}
        onClick={handleClick}
        className={dropzoneClassName}
      >
        <input {...getInputProps()} ref={inputRef} />
        <div className="mb-3 flex h-15 w-15 items-center justify-center rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
          {/* <svg
            className="h-7 w-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 8.25C3 7.007 4.007 6 5.25 6h5.19l.72.72a2.25 2.25 0 0 0 1.59.65h4.09a2.25 2.25 0 0 1 2.25 2.25v6.75a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15.75V8.25Z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 13.5c0 .28.22.5.5.5h1c.28 0 .5-.22.5-.5v-1c0-.28-.22-.5-.5-.5h-1c-.28 0-.5.22-.5.5Z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 10.5h2.25a.75.75 0 0 1 0 1.5H15a.75.75 0 0 1 0-1.5Z"
            />
          </svg> */}
          <img
            src="/docx.png"
            alt="PDF icon"
            className="mb-3 h-12 w-12 object-contain"
          />
        </div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {hasFile ? (
            "Document selected — choose another to replace it"
          ) : isDragActive ? (
            "Drop the Word document here…"
          ) : (
            <>
              Drag & drop your Word document here, or{" "}
              <span className="text-gray-600 dark:text-gray-400">browse</span>
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
