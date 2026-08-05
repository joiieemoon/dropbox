/**
 * PDF utilities - parse PDF files to extract metadata like page count.
 */

import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

// Configure the PDF.js worker.
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

/**
 * Get the page count of a PDF file.
 *
 * @param file - the PDF File object
 * @returns the number of pages in the PDF
 */
export async function getPdfPageCount(file: File): Promise<number> {
  try {
    // Convert the file to an ArrayBuffer for pdf.js to parse.
    const buffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: buffer });
    const pdfDoc = await loadingTask.promise;
    const pageCount = pdfDoc.numPages;
    loadingTask.destroy();
    return pageCount;
  } catch {
    // Fall back to 1 if parsing fails.
    return 1;
  }
}