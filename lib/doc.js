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
