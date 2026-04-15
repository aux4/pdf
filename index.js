import fs from "fs";
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
import { addForm } from "./lib/doc.js";
import { protectPdf, unprotectPdf, isProtected } from "./lib/protect.js";
import { hasXfa, getXfaFields, fillXfaFields } from "./lib/xfa.js";

function guardProtected(pdfPath) {
  if (isProtected(pdfPath)) {
    console.error("The PDF file is password-protected. Use 'aux4 pdf unprotect' to remove protection first.");
    process.exit(1);
  }
}

export async function parsePdf(pdfPath) {
  const pdf = await loadPdfFromFile(pdfPath);
  const pdfDoc = await loadPdfDocumentFromFile(pdfPath);

  const isXfa = hasXfa(pdfDoc);
  const xfaFields = isXfa ? getXfaFields(pdfDoc) : [];

  const pages = [];
  const pageCount = await getPdfPageCount(pdf);

  for (let i = 1; i <= pageCount; i++) {
    const texts = await getPdfTextByPage(pdf, i);
    const fields = await getPdfFieldsByPage(pdf, i);

    if (!isXfa) {
      await fillFieldOptions(pdfDoc, fields);
    }

    const elements = [...texts, ...fields];
    sortPdfElements(elements);

    const text = elements.map((item) => item.content).join(" ");

    let pdfFields;
    if (isXfa && i === 1) {
      // XFA fields are document-level; attach to page 1
      pdfFields = xfaFields.map((item) => ({
        name: item.name,
        caption: item.caption,
        value: item.value,
        type: item.type,
        options: item.options,
      }));
    } else if (!isXfa) {
      pdfFields = fields.map((item) => ({
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
    } else {
      pdfFields = [];
    }

    const page = { page: i, text, fields: pdfFields };
    if (isXfa && i === 1) page.xfa = true;
    pages.push(page);
  }

  return pages;
}

export async function searchPdf(pdfPath, term) {
  const pdf = await loadPdfFromFile(pdfPath);
  const pageCount = await getPdfPageCount(pdf);
  const results = [];
  const lowerTerm = term.toLowerCase();

  for (let i = 1; i <= pageCount; i++) {
    const texts = await getPdfTextByPage(pdf, i);
    sortPdfElements(texts);

    // Search through individual text items
    for (const item of texts) {
      if (item.content.toLowerCase().includes(lowerTerm)) {
        results.push({
          page: i,
          text: item.content.trim(),
          x: item.x,
          y: item.y
        });
      }
    }

    // Search across concatenated line text for multi-item matches
    const lineGroups = groupTextByLine(texts);
    for (const line of lineGroups) {
      const lineText = line.items.map(t => t.content).join(" ");
      if (lineText.toLowerCase().includes(lowerTerm)) {
        const alreadyFound = results.some(r => r.page === i && Math.abs(r.y - line.y) < 5);
        if (!alreadyFound) {
          results.push({
            page: i,
            text: lineText.trim(),
            x: line.items[0].x,
            y: line.y
          });
        }
      }
    }
  }

  return results;
}

function groupTextByLine(texts) {
  const lines = [];
  for (const item of texts) {
    const existing = lines.find(l => Math.abs(l.y - item.y) < 5);
    if (existing) {
      existing.items.push(item);
    } else {
      lines.push({ y: item.y, items: [item] });
    }
  }
  return lines;
}

export async function fillPdf(inPdfPath, outPdfPath) {
  // Read JSON from stdin
  const inputJson = await new Promise((resolve, reject) => {
    let data = "";
    stdin.setEncoding("utf-8");
    stdin.on("data", (chunk) => (data += chunk));
    stdin.on("end", () => resolve(data));
    stdin.on("error", (err) => reject(err));
  });

  const parsed = JSON.parse(inputJson);

  // Normalize input: accept both object {"name": "value"} and array [{name, value}]
  let entries;
  if (Array.isArray(parsed)) {
    entries = parsed.map((item) => ({ name: item.name, value: item.value }));
  } else {
    entries = Object.entries(parsed).map(([name, value]) => ({ name, value }));
  }

  // Check if PDF uses XFA
  const pdfDoc = await loadPdfDocumentFromFile(inPdfPath);
  if (hasXfa(pdfDoc)) {
    const pdfBytes = await fillXfaFields(inPdfPath, entries);
    fs.writeFileSync(outPdfPath, pdfBytes);
    return;
  }

  // Standard AcroForm fill
  const form = pdfDoc.getForm();
  const pdfFields = form.getFields().map((f) => ({
    name: f.getName(),
    type: f.constructor.name.replace("PDF", "")
  }));

  for (const { name, value } of entries) {
    setFieldValue(pdfDoc, pdfFields, name, value);
  }

  await savePdfToFile(pdfDoc, outPdfPath);
}

(async () => {
  const args = process.argv.slice(2);

  if (args[0] === "protect" && args.length === 4) {
    const inPdfPath = args[1];
    const password = args[2];
    const outPdfPath = args[3] || inPdfPath;
    protectPdf(inPdfPath, outPdfPath, password);
    console.log(`PDF protected and saved to ${outPdfPath}`);
  } else if (args[0] === "unprotect" && args.length === 4) {
    const inPdfPath = args[1];
    const password = args[2];
    const outPdfPath = args[3] || inPdfPath;
    unprotectPdf(inPdfPath, outPdfPath, password);
    console.log(`PDF unprotected and saved to ${outPdfPath}`);
  } else if (args[0] === "parse" && args.length === 2) {
    const pdfPath = args[1];
    guardProtected(pdfPath);
    const result = await parsePdf(pdfPath);
    console.log(JSON.stringify(result, null, 2));
  } else if (args[0] === "fill" && args.length === 3) {
    const inPdfPath = args[1];
    const outPdfPath = args[2] || inPdfPath;
    guardProtected(inPdfPath);
    await fillPdf(inPdfPath, outPdfPath);
    console.log(`PDF filled and saved to ${outPdfPath}`);
  } else if (args[0] === "count" && args.length === 2) {
    const pdfPath = args[1];
    guardProtected(pdfPath);
    const pdf = await loadPdfFromFile(pdfPath);
    const pageCount = await getPdfPageCount(pdf);
    console.log(pageCount);
  } else if (args[0] === "image" && args.length >= 2 && args.length <= 4) {
    const pdfPath = args[1];
    guardProtected(pdfPath);
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
    guardProtected(inPdfPath);
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
  } else if (args[0] === "text" && args.length >= 2) {
    const pdfPath = args[1];
    guardProtected(pdfPath);
    const pdf = await loadPdfFromFile(pdfPath);
    const pageCount = await getPdfPageCount(pdf);
    // Parse page arguments — can be a JSON array or individual numbers
    let pages;
    const pageArg = args[2];
    if (!pageArg) {
      pages = Array.from({ length: pageCount }, (_, i) => i + 1);
    } else {
      try {
        const parsed = JSON.parse(pageArg);
        pages = (Array.isArray(parsed) ? parsed : [parsed]).map(Number).filter(n => n > 0);
      } catch {
        pages = args.slice(2).map(Number).filter(n => !isNaN(n));
      }
    }
    if (pages.length === 0) {
      pages = Array.from({ length: pageCount }, (_, i) => i + 1);
    }
    const output = [];
    for (const i of pages) {
      const texts = await getPdfTextByPage(pdf, i);
      sortPdfElements(texts);
      const lines = [];
      let currentY = null;
      for (const item of texts) {
        if (currentY !== null && Math.abs(item.y - currentY) > 5) {
          lines.push("\n");
        }
        lines.push(item.content);
        currentY = item.y;
      }
      output.push(lines.join(""));
    }
    console.log(output.join("\f\n"));
  } else if (args[0] === "search" && args.length === 3) {
    const pdfPath = args[1];
    const term = args[2];
    guardProtected(pdfPath);
    const results = await searchPdf(pdfPath, term);
    console.log(JSON.stringify(results));
  } else {
    console.error("Invalid arguments. Usage:");
    console.error("  node index.js parse '<PDF PATH>'");
    console.error("  node index.js fill '<IN PDF PATH>' '<OUT PDF PATH>'");
    console.error("  node index.js count '<PDF PATH>'");
    console.error("  node index.js image '<PDF PATH>' [<PAGE NUMBER>] [<OUTPUT PATH>]");
    console.error("  node index.js form '<IN PDF PATH>' '<OUT PDF PATH>' <form definitions JSON via stdin>");
    console.error("  node index.js protect '<IN PDF PATH>' '<OUT PDF PATH>'");
    console.error("  node index.js unprotect '<IN PDF PATH>' '<OUT PDF PATH>'");
    console.error("  node index.js search '<PDF PATH>' '<SEARCH TERM>'");
    process.exit(1);
  }
})();
