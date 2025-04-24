import fs from "node:fs";
import path from "node:path";
import { loadPdfFromFile, getPdfPageCount } from "./pdf.js";

/**
 * Convert PDF pages to PNG images.
 * @param {string} pdfPath - Path to the PDF file.
 * @param {number|null} page - Page number to convert, or null for all pages.
 * @param {string|null} outputArg - Output path for a single page or directory for multiple pages.
 * @returns {Promise<string[]>} - Array of output image file paths.
 */
export async function imagePdf(pdfPath, page, outputArg) {
  // Dynamically import pdf2pic only when needed and load the PDF
  const { default: PDF2Pic } = await import("pdf2pic");
  const pdf = await loadPdfFromFile(pdfPath);
  const dirName = path.dirname(pdfPath);
  const baseName = path.basename(pdfPath, path.extname(pdfPath));
  // If outputArg is provided and single-page, treat as file path; for full-document, treat as directory
  const savePath = outputArg && page == null ? outputArg : dirName;
  const results = [];

  // Helper to build converter options per page using PDF.js viewport for true pixel dimensions
  async function getOptions(pageNum) {
    const density = 150; // DPI for readability
    const pdfPage = await pdf.getPage(pageNum);
    // Use PDF.js viewport to calculate width/height in pixels at given DPI
    const viewport = pdfPage.getViewport({ scale: density / 72 });
    const pixelWidth = Math.round(viewport.width);
    const pixelHeight = Math.round(viewport.height);
    return {
      density,
      format: "png",
      savedir: savePath,
      savename: baseName,
      size: `${pixelWidth}x${pixelHeight}`
    };
  }

  if (page != null) {
    // Single-page conversion
    const opts = await getOptions(page);
    const converter = new PDF2Pic(opts);
    const result = await converter.convert(pdfPath, page);
    let outPath = result.path;
    if (outputArg) {
      fs.renameSync(result.path, outputArg);
      outPath = outputArg;
    }
    results.push(outPath);
  } else {
    // Full-document conversion
    const pageCount = await getPdfPageCount(pdf);
    for (let p = 1; p <= pageCount; p++) {
      const opts = await getOptions(p);
      const converter = new PDF2Pic(opts);
      const result = await converter.convert(pdfPath, p);
      const dest = path.join(savePath, `${baseName}-${p}.png`);
      fs.renameSync(result.path, dest);
      results.push(dest);
    }
  }

  return results;
}
