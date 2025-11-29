import fs from 'fs';
import pdfjs from 'pdf.js-extract/lib/pdfjs/pdf.js';
import { PDFDocument } from 'pdf-lib';
import { stdin } from 'process';
import path from 'path';

async function loadPdfFromFile(pdfPath) {
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const loadingTask = pdfjs.getDocument({ data });
  return await loadingTask.promise;
}

async function getPdfPageCount(pdf) {
  return pdf.numPages;
}

async function getPdfFieldsByPage(pdf, pageNum) {
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

async function getPdfTextByPage(pdf, pageNum) {
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

function sortPdfElements(elements) {
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

async function loadPdfDocumentFromFile(filepath) {
  const file = fs.readFileSync(filepath);
  return PDFDocument.load(file);
}

async function fillFieldOptions(pdf, fields) {
  const form = pdf.getForm();
  fields.forEach((field) => {
    const pdfField = form.getField(field.name);
    field.type = pdfField.constructor.name.replace("PDF", "");
    if (pdfField.getOptions) {
      field.options = pdfField.getOptions();
    }
  });
}

function setFieldValue(pdf, fields, fieldName, value) {
  const currentField = fields.find((field) => field.name === fieldName);

  const form = pdf.getForm();
  const getter = `get${currentField.type}`;
  const field = form[getter](fieldName);

  if (field) {
    if (currentField.type === "TextField") {
      field.setText(value);
    } else if (currentField.type === "CheckBox") {
      if (value) {
        field.check();
      } else {
        field.uncheck();
      }
    } else if (currentField.type === "RadioGroup") {
      field.select(value);
    } else if (currentField.type === "ComboBox") {
      field.select(value);
    } else if (currentField.type === "ListBox") {
      field.select(value);
    } else if (currentField.type === "Button") {
      field.setValue(value);
    } else {
      console.error(`Field ${fieldName} type ${field.type} not supported`);
    }
  } else {
    console.error(`Field ${fieldName} not found`);
  }
}

async function savePdfToFile(pdf, outputPath) {
  const pdfData = await pdf.save({ updateFieldAppearances: false });
  fs.writeFileSync(outputPath, pdfData);
}
/**
 * Add new form fields to a PDF based on description objects.
 * @param {string} inPdfPath - Path to source PDF.
 * @param {string} outPdfPath - Path to save modified PDF.
 * @param {Array} elements - Array of field definitions.
 */
async function addForm(inPdfPath, outPdfPath, elements) {
  const pdfDoc = await loadPdfDocumentFromFile(inPdfPath);
  const form = pdfDoc.getForm();
  const pages = pdfDoc.getPages();
  for (const el of elements) {
    const { name, alternativeText, type, page, x, y, width, height, options } = el;
    const pdfPage = pages[page - 1];
    switch (type) {
      case 'TextField': {
        const fld = form.createTextField(name);
        if (alternativeText) fld.setAltText?.(alternativeText);
        // Add text field without border
        fld.addToPage(pdfPage, { x, y, width, height, borderWidth: 0 });
        break;
      }
      case 'CheckBox': {
        const fld = form.createCheckBox(name);
        if (alternativeText) fld.setAltText?.(alternativeText);
        fld.addToPage(pdfPage, { x, y, width, height });
        break;
      }
      case 'RadioGroup': {
        const fld = form.createRadioGroup(name);
        if (alternativeText) fld.setAltText?.(alternativeText);
        if (Array.isArray(options)) {
          const count = options.length;
          const cellW = width / count;
          options.forEach((opt, idx) => {
            const ox = x + idx * cellW;
            fld.addOptionToPage(opt, pdfPage, { x: ox, y, width: cellW, height });
          });
        }
        break;
      }
      case 'ComboBox':
      case 'Dropdown': {
        const fld = form.createDropdown(name);
        if (Array.isArray(options)) fld.addOptions(options);
        fld.addToPage(pdfPage, { x, y, width, height });
        break;
      }
      case 'ListBox': {
        const fld = form.createOptionList(name);
        if (Array.isArray(options)) fld.addOptions(options);
        fld.addToPage(pdfPage, { x, y, width, height });
        break;
      }
      default:
        console.warn(`Unsupported form field type: ${type}`);
    }
  }
  await savePdfToFile(pdfDoc, outPdfPath);
}

/**
 * Convert PDF pages to PNG images.
 * @param {string} pdfPath - Path to the PDF file.
 * @param {number|null} page - Page number to convert, or null for all pages.
 * @param {string|null} outputArg - Output path for a single page or directory for multiple pages.
 * @returns {Promise<string[]>} - Array of output image file paths.
 */
async function imagePdf(pdfPath, page, outputArg) {
  // Dynamically import pdf2pic only when needed and load the PDF
  const { default: PDF2Pic } = await import('pdf2pic');
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

async function parsePdf(pdfPath) {
  const pdf = await loadPdfFromFile(pdfPath);
  const pdfDoc = await loadPdfDocumentFromFile(pdfPath);

  const pages = [];

  const pageCount = await getPdfPageCount(pdf);

  for (let i = 1; i <= pageCount; i++) {
    const texts = await getPdfTextByPage(pdf, i);
    const fields = await getPdfFieldsByPage(pdf, i);

    await fillFieldOptions(pdfDoc, fields);

    const elements = [...texts, ...fields];
    sortPdfElements(elements);

    const text = elements.map((item) => item.content).join(" ");
    const pdfFields = fields.map((item) => ({
      name: item.name,
      alternativeText: item.alternativeText,
      value: item.value,
      type: item.type,
      options: item.options,
      ref: {
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height,
      }
    }));

    pages.push({ page: i, text, fields: pdfFields });
  }

  return pages;
}

async function fillPdf(inPdfPath, outPdfPath) {
  const pdfDoc = await loadPdfDocumentFromFile(inPdfPath);

  // Read JSON from stdin
  const inputJson = await new Promise((resolve, reject) => {
    let data = "";
    stdin.setEncoding("utf-8");
    stdin.on("data", (chunk) => (data += chunk));
    stdin.on("end", () => resolve(data));
    stdin.on("error", (err) => reject(err));
  });

  const fieldValues = JSON.parse(inputJson);

  // Set field values
  for (const field of fieldValues) {
    const { name, value } = field;
    setFieldValue(pdfDoc, fieldValues, name, value);
  }

  // Save the updated PDF to the output path
  await savePdfToFile(pdfDoc, outPdfPath);
}

(async () => {
  const args = process.argv.slice(2);

  if (args[0] === "parse" && args.length === 2) {
    const pdfPath = args[1];
    const result = await parsePdf(pdfPath);
    console.log(JSON.stringify(result, null, 2));
  } else if (args[0] === "fill" && args.length === 3) {
    const inPdfPath = args[1];
    const outPdfPath = args[2] || inPdfPath;
    await fillPdf(inPdfPath, outPdfPath);
    console.log(`PDF filled and saved to ${outPdfPath}`);
  } else if (args[0] === "count" && args.length === 2) {
    const pdfPath = args[1];
    const pdf = await loadPdfFromFile(pdfPath);
    const pageCount = await getPdfPageCount(pdf);
    console.log(pageCount);
  } else if (args[0] === "image" && args.length >= 2 && args.length <= 4) {
    const pdfPath = args[1];
    let page = null;
    let outputArg = null;
    if (args.length >= 3) {
      const maybe = parseInt(args[2], 10);
      if (!isNaN(maybe)) {
        page = maybe;
      } else {
        outputArg = args[2];
      }
    }
    if (args.length === 4) {
      outputArg = args[3];
    }
    const outputPaths = await imagePdf(pdfPath, page, outputArg);
    outputPaths.forEach((p) => console.log(p));
  } else if (args[0] === "form" && args.length === 3) {
    const inPdfPath = args[1];
    const outPdfPath = args[2];
    // Read JSON array from stdin
    const inputJson = await new Promise((resolve, reject) => {
      let data = "";
      stdin.setEncoding("utf-8");
      stdin.on("data", (chunk) => (data += chunk));
      stdin.on("end", () => resolve(data));
      stdin.on("error", (err) => reject(err));
    });
    const elements = JSON.parse(inputJson);
    await addForm(inPdfPath, outPdfPath, elements);
    console.log(`Form fields added and saved to ${outPdfPath}`);
  } else {
    console.error("Invalid arguments. Usage:");
    console.error("  node index.js parse '<PDF PATH>'");
    console.error("  node index.js fill '<IN PDF PATH>' '<OUT PDF PATH>'");
    console.error("  node index.js count '<PDF PATH>'");
    console.error("  node index.js image '<PDF PATH>' [<PAGE NUMBER>] [<OUTPUT PATH>]");
    console.error("  node index.js form '<IN PDF PATH>' '<OUT PDF PATH>' <form definitions JSON via stdin>");
    process.exit(1);
  }
})();

export { fillPdf, parsePdf };
