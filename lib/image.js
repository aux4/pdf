import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { loadPdfFromFile, getPdfPageCount } from "./pdf.js";

const DPI = 150;

/**
 * Convert PDF pages to PNG images using poppler's `pdftocairo`.
 * poppler is declared as a system dependency of the package, so only the
 * host platform's build is installed at install time — no native binaries
 * are shipped inside the package.
 * @param {string} pdfPath - Path to the PDF file.
 * @param {number|null} page - Page number to convert, or null for all pages.
 * @param {string|null} outputArg - Output path for a single page or directory for multiple pages.
 * @returns {Promise<string[]>} - Array of output image file paths.
 */
export async function imagePdf(pdfPath, page, outputArg) {
  const dirName = path.dirname(pdfPath);
  const baseName = path.basename(pdfPath, path.extname(pdfPath));
  const results = [];

  if (page != null) {
    const outPath = outputArg || path.join(dirName, `${baseName}_${page}.png`);
    renderPage(pdfPath, page, outPath);
    results.push(outPath);
  } else {
    const savePath = outputArg || dirName;
    const pdf = await loadPdfFromFile(pdfPath);
    const pageCount = await getPdfPageCount(pdf);
    for (let p = 1; p <= pageCount; p++) {
      const dest = path.join(savePath, `${baseName}-${p}.png`);
      renderPage(pdfPath, p, dest);
      results.push(dest);
    }
  }

  return results;
}

function renderPage(pdfPath, pageNum, outPath) {
  // `pdftocairo -singlefile` always appends `.png`, so render to the base name
  // and move it into place if the requested path differs.
  const outBase = outPath.replace(/\.png$/i, "");
  try {
    execFileSync(
      "pdftocairo",
      ["-png", "-r", String(DPI), "-f", String(pageNum), "-l", String(pageNum), "-singlefile", pdfPath, outBase],
      { stdio: ["ignore", "ignore", "pipe"] }
    );
  } catch (err) {
    if (err.code === "ENOENT") {
      throw new Error(
        "pdftocairo not found. Install poppler (e.g. 'brew install poppler' or 'apt install poppler-utils')."
      );
    }
    const stderr = err.stderr ? err.stderr.toString().trim() : "";
    throw new Error(stderr || err.message);
  }

  const produced = `${outBase}.png`;
  if (produced !== outPath) {
    fs.renameSync(produced, outPath);
  }
}
