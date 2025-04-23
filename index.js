import {
  getPdfFieldsByPage,
  getPdfPageCount,
  getPdfTextByPage,
  loadPdfFromFile,
  sortPdfElements,
} from "./lib/pdf.js";
import {
  fillFieldOptions,
  loadPdfDocumentFromFile,
  setFieldValue,
  savePdfToFile
} from "./lib/doc.js";
import { stdin } from "process";
import { imagePdf } from "./lib/image.js";

export async function parsePdf(pdfPath) {
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
    }));

    pages.push({ page: i, text, fields: pdfFields });
  }

  return pages;
}

export async function fillPdf(inPdfPath, outPdfPath) {
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
  } else {
    console.error("Invalid arguments. Usage:");
    console.error("  node index.js parse '<PDF PATH>'");
    console.error("  node index.js fill '<IN PDF PATH>' '<OUT PDF PATH>'");
    console.error("  node index.js count '<PDF PATH>'");
    console.error("  node index.js image '<PDF PATH>' [<PAGE NUMBER>] [<OUTPUT PATH>]");
    process.exit(1);
  }
})();
