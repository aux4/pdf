import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { loadPdfFromFile, getPdfPageCount } from "./pdf.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

/**
 * Convert PDF pages to PNG images using pdfjs-dist + @napi-rs/canvas.
 * Supports XFA forms that Ghostscript-based tools cannot render.
 * @param {string} pdfPath - Path to the PDF file.
 * @param {number|null} page - Page number to convert, or null for all pages.
 * @param {string|null} outputArg - Output path for a single page or directory for multiple pages.
 * @returns {Promise<string[]>} - Array of output image file paths.
 */
export async function imagePdf(pdfPath, page, outputArg) {
  const { createCanvas, DOMMatrix, Image, ImageData } = await import("@napi-rs/canvas");
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

  // Provide browser globals required by pdfjs rendering pipeline
  global.DOMMatrix = DOMMatrix;
  global.Image = Image;
  global.ImageData = ImageData;
  if (typeof global.OffscreenCanvas === "undefined") {
    global.OffscreenCanvas = class OffscreenCanvas {
      constructor(w, h) { this._c = createCanvas(w, h); }
      getContext(t) { return this._c.getContext(t); }
      get width() { return this._c.width; }
      get height() { return this._c.height; }
      convertToBlob() { return Promise.resolve(null); }
    };
  }

  pdfjsLib.GlobalWorkerOptions.workerSrc = `file://${path.resolve(__dirname, "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs")}`;

  const standardFontDataUrl = `file://${path.resolve(__dirname, "node_modules/pdfjs-dist/standard_fonts")}/`;

  class NodeCanvasFactory {
    create(w, h) { const c = createCanvas(w, h); return { canvas: c, context: c.getContext("2d") }; }
    reset(cc, w, h) { cc.canvas.width = w; cc.canvas.height = h; }
    destroy(cc) {}
  }

  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const canvasFactory = new NodeCanvasFactory();
  const pdf = await pdfjsLib.getDocument({
    data,
    enableXfa: true,
    canvasFactory,
    standardFontDataUrl,
  }).promise;

  const dirName = path.dirname(pdfPath);
  const baseName = path.basename(pdfPath, path.extname(pdfPath));
  const results = [];

  async function renderPage(pageNum) {
    const pdfPage = await pdf.getPage(pageNum);
    const scale = 150 / 72;
    const viewport = pdfPage.getViewport({ scale });
    const { canvas, context } = canvasFactory.create(
      Math.round(viewport.width),
      Math.round(viewport.height)
    );
    await pdfPage.render({ canvasContext: context, viewport, canvasFactory }).promise;
    return canvas.toBuffer("image/png");
  }

  if (page != null) {
    const buf = await renderPage(page);
    const outPath = outputArg || path.join(dirName, `${baseName}_${page}.png`);
    fs.writeFileSync(outPath, buf);
    results.push(outPath);
  } else {
    const savePath = outputArg || dirName;
    const pageCount = await getPdfPageCount(pdf);
    for (let p = 1; p <= pageCount; p++) {
      const buf = await renderPage(p);
      const dest = path.join(savePath, `${baseName}-${p}.png`);
      fs.writeFileSync(dest, buf);
      results.push(dest);
    }
  }

  return results;
}
