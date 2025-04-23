import fs from "fs";
import pdfjs from "pdf.js-extract/lib/pdfjs/pdf.js";

export async function loadPdfFromFile(pdfPath) {
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const loadingTask = pdfjs.getDocument({ data });
  return await loadingTask.promise;
}

export async function getPdfPageCount(pdf) {
  return pdf.numPages;
}

export async function getPdfContentByPage(pdf, pageNum) {
  const text = await getPdfTextByPage(pdf, pageNum);
  const fields = await getPdfFieldsByPage(pdf, pageNum);
  const combined = [...text, ...fields];
  sortPdfElements(combined);
  return combined.map((item) => item.content).join(" ");
}

export async function getPdfFieldsByPage(pdf, pageNum) {
  const page = await pdf.getPage(pageNum);
  const annotations = await page.getAnnotations();
  return annotations
    .filter((ann) => ann.subtype === "Widget")
    .map((ann) => ({
      name: ann.fieldName,
      alternativeText: ann.alternativeText,
      value: ann.fieldValue,
      type: "Widget",
      content: `[Field:${ann.fieldName}]`,
      page: pageNum,
      x: ann.rect[0],
      y: ann.rect[1],
      width: ann.rect[2] - ann.rect[0],
      height: ann.rect[3] - ann.rect[1],
    }));
}

export async function getPdfTextByPage(pdf, pageNum) {
  const page = await pdf.getPage(pageNum);
  const textContent = await page.getTextContent();
  return textContent.items.map((item) => ({
    type: "Text",
    content: item.str,
    page: pageNum,
    x: item.transform[4],
    y: item.transform[5],
    width: item.width,
    height: item.height,
  }));
}

export function sortPdfElements(elements) {
  elements.sort((a, b) => {
    const dy = b.y - a.y;
    if (Math.abs(dy) > 5) return dy;

    const dx = a.x - b.x;
    if (Math.abs(dx) > 5) return dx;

    const dWidth = b.width - a.width;
    if (Math.abs(dWidth) > 5) return dWidth;

    const dHeight = b.height - a.height;
    return dHeight;
  });
}

