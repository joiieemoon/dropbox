/**
 * Download utilities for the browser.
 * No third-party libraries required.
 */

function assertBrowser(): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("download utilities are only available in the browser");
  }
}

/**
 * Trigger a file download from a Blob.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  assertBrowser();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Download a file from a string or BufferSource.
 */
export function downloadFile(
  data: BlobPart,
  filename: string,
  mimeType: string = "application/octet-stream",
): void {
  const blob = new Blob([data], { type: mimeType });
  downloadBlob(blob, filename);
}

/**
 * Download data as a JSON file.
 */
export function downloadJSON<T>(
  data: T,
  filename: string = "data.json",
): void {
  const json = JSON.stringify(data, null, 2);
  downloadFile(json, filename, "application/json");
}

/**
 * Download data as a CSV file.
 */
export function downloadCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string = "data.csv",
  columns?: (keyof T)[],
): void {
  const keys = columns ?? (data.length > 0 ? (Object.keys(data[0]) as (keyof T)[]) : []);
  if (keys.length === 0) {
    downloadFile("", filename, "text/csv");
    return;
  }

  const header = keys.join(",");
  const rows = data.map((item) =>
    keys
      .map((key) => {
        const value = item[key];
        const str = value == null ? "" : String(value);
        // Escape quotes and wrap in quotes if contains comma or newline
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      })
      .join(","),
  );

  const csv = [header, ...rows].join("\n");
  downloadFile(csv, filename, "text/csv;charset=utf-8;");
}

/**
 * Download data as a plain text file.
 */
export function downloadTXT(
  text: string,
  filename: string = "data.txt",
): void {
  downloadFile(text, filename, "text/plain");
}

/**
 * Download a file from a URL (e.g. image, PDF).
 */
export async function downloadFromURL(
  url: string,
  filename: string = "download",
): Promise<void> {
  assertBrowser();
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    downloadBlob(blob, filename);
  } catch (error) {
    console.error("downloadFromURL failed:", error);
    throw error;
  }
}

const download = {
  downloadBlob,
  downloadFile,
  downloadJSON,
  downloadCSV,
  downloadTXT,
  downloadFromURL,
};

export default download;