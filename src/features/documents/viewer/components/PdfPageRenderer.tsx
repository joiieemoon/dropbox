/**
 * PdfPageRenderer - renders a single PDF page using pdfjs-dist.
 * Used for strict per-page viewing and accurate page tracking.
 */

import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

// Configure the PDF.js worker.
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface PdfPageRendererProps {
  /** Base64 data URL or URL of the PDF. */
  pdfSource: string;
  /** 1-based page number to render. */
  pageNumber: number;
  /** Callback when the page finishes rendering. */
  onPageRendered?: (pageNumber: number) => void;
}

export default function PdfPageRenderer({
  pdfSource,
  pageNumber,
  onPageRendered,
}: PdfPageRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let loadingTask: pdfjsLib.PDFDocumentLoadingTask | null = null;

    const renderPage = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load the PDF document.
        loadingTask = pdfjsLib.getDocument({ url: pdfSource });
        const pdfDoc = await loadingTask.promise;

        if (cancelled) return;

        // Get the specific page.
        const page = await pdfDoc.getPage(pageNumber);
        if (cancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        // Calculate scale to fit the container width (max 900px).
        const viewport = page.getViewport({ scale: 1 });
        const containerWidth = Math.min(window.innerWidth - 32, 900);
        const scale = containerWidth / viewport.width;
        const scaledViewport = page.getViewport({ scale });

        // Set canvas dimensions.
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        // Render the page.
        const renderContext = {
          canvas,
          viewport: scaledViewport,
        };
        await page.render(renderContext).promise;

        if (cancelled) return;
        setLoading(false);
        onPageRendered?.(pageNumber);
      } catch {
        if (!cancelled) {
          setError("Failed to render this page.");
          setLoading(false);
        }
      }
    };

    void renderPage();

    return () => {
      cancelled = true;
      loadingTask?.destroy();
    };
  }, [pdfSource, pageNumber, onPageRendered]);

  return (
    <div className="relative">
      {loading && (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      )}
      {error && (
        <div className="flex h-64 items-center justify-center">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className={`mx-auto max-w-full shadow-sm ${loading || error ? "hidden" : ""}`}
      />
    </div>
  );
}