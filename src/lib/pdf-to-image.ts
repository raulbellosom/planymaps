/**
 * PDF-to-image utility (client-side only)
 * Renders the first page of a PDF to a PNG Blob using pdfjs-dist
 */

export interface PdfImageResult {
  blob: Blob;
  width: number;
  height: number;
}

/**
 * Renders the first page of a PDF file to a PNG Blob.
 * Scale 2 = 2x device pixel ratio for sharp rendering.
 */
export async function pdfPageToImageBlob(
  file: File,
  scale = 2,
): Promise<PdfImageResult> {
  // Lazy-import so this module is never loaded in SSR
  const pdfjs = await import("pdfjs-dist");

  // Point the worker at the bundled worker from the package
  // (Next.js copies this to /_next/static/chunks/)
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2D canvas context");

  await page.render({ canvasContext: ctx, viewport, canvas }).promise;

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error("canvas.toBlob returned null"));
    }, "image/png");
  });

  return {
    blob,
    width: Math.round(viewport.width / scale),
    height: Math.round(viewport.height / scale),
  };
}
