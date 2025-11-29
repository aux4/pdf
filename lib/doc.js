import fs from "fs";
import { PDFDocument } from "pdf-lib";

export async function loadPdfDocumentFromUrl(url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return PDFDocument.load(arrayBuffer);
}

export async function loadPdfDocumentFromFile(filepath) {
  const file = fs.readFileSync(filepath);
  return PDFDocument.load(file);
}

export async function fillFieldOptions(pdf, fields) {
  const form = pdf.getForm();
  fields.forEach((field) => {
    const pdfField = form.getField(field.name);
    field.type = pdfField.constructor.name.replace("PDF", "");
    if (pdfField.getOptions) {
      field.options = pdfField.getOptions();
    }
  });
}

export function setFieldValue(pdf, fields, fieldName, value) {
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

export async function savePdfToFile(pdf, outputPath) {
  const pdfData = await pdf.save({ updateFieldAppearances: false });
  fs.writeFileSync(outputPath, pdfData);
}
/**
 * Add new form fields to a PDF based on description objects.
 * @param {string} inPdfPath - Path to source PDF.
 * @param {string} outPdfPath - Path to save modified PDF.
 * @param {Array} elements - Array of field definitions.
 */
export async function addForm(inPdfPath, outPdfPath, elements) {
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
