import fs from "fs";
import zlib from "zlib";
import { PDFDocument, PDFName, PDFArray, PDFRawStream } from "pdf-lib";
import { XMLParser, XMLBuilder } from "fast-xml-parser";

const XFA_UI_TYPE_MAP = {
  textEdit: "TextField",
  numericEdit: "TextField",
  dateTimeEdit: "TextField",
  checkButton: "CheckBox",
  choiceList: "Dropdown",
  barcode: "Barcode",
  imageEdit: "Image",
  button: "Button",
  signature: "Signature",
  passwordEdit: "TextField",
};

function isCompressed(stream) {
  if (!stream.dict) return false;
  const filter = stream.dict.lookup(PDFName.of("Filter"));
  if (!filter) return false;
  const str = filter.toString();
  return str.includes("FlateDecode");
}

function streamToString(stream) {
  let bytes;
  if (stream.contents) {
    bytes = stream.contents;
  } else if (typeof stream.getContents === "function") {
    bytes = stream.getContents();
  } else if (typeof stream.asUint8Array === "function") {
    bytes = stream.asUint8Array();
  } else {
    return "";
  }
  const buf = Buffer.from(bytes);
  if (isCompressed(stream)) {
    try {
      return zlib.inflateSync(buf).toString("utf-8");
    } catch {
      return buf.toString("utf-8");
    }
  }
  return buf.toString("utf-8");
}

/**
 * Extract raw XFA XML streams from a PDFDocument.
 * Returns a map of stream-name → XML string, e.g. { template: "...", datasets: "..." }.
 * If XFA is a single stream, returns { xfa: "..." }.
 */
export function extractXfaStreams(pdfDoc) {
  const acroForm = pdfDoc.catalog.lookup(PDFName.of("AcroForm"));
  if (!acroForm) return null;

  const xfa = acroForm.lookup(PDFName.of("XFA"));
  if (!xfa) return null;

  if (xfa instanceof PDFArray) {
    const result = {};
    for (let i = 0; i < xfa.size(); i += 2) {
      const nameObj = xfa.lookup(i);
      const streamObj = xfa.lookup(i + 1);
      const name = nameObj?.toString?.()?.replace(/^\(|\)$/g, "").replace(/^\//,"") || `part${i}`;
      result[name] = streamToString(streamObj);
    }
    return result;
  }

  // Single stream
  return { xfa: streamToString(xfa) };
}

/**
 * Check if a PDFDocument contains XFA form data.
 */
export function hasXfa(pdfDoc) {
  const acroForm = pdfDoc.catalog.lookup(PDFName.of("AcroForm"));
  if (!acroForm) return false;
  const xfa = acroForm.lookup(PDFName.of("XFA"));
  return !!xfa;
}

/**
 * Detect the XFA field type from a <ui> element.
 */
function detectFieldType(uiNode) {
  if (!uiNode) return "TextField";
  for (const key of Object.keys(uiNode)) {
    if (key.startsWith("@_") || key === "#text") continue;
    const mapped = XFA_UI_TYPE_MAP[key];
    if (mapped) return mapped;
  }
  return "TextField";
}

function getTextValue(node) {
  if (node == null) return undefined;
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (node["#text"] != null) return String(node["#text"]);
  if (node.text != null) {
    if (typeof node.text === "object" && node.text["#text"] != null) return String(node.text["#text"]);
    return String(node.text);
  }
  if (node.value != null) return getTextValue(node.value);
  return undefined;
}

function extractCaption(captionNode) {
  if (!captionNode) return undefined;
  return getTextValue(captionNode);
}

function extractOptions(uiNode) {
  if (!uiNode || !uiNode.choiceList) return undefined;
  // Options are typically siblings of <ui> in the field node — handled externally
  return undefined;
}

/**
 * Recursively walk XFA template nodes to find <field> elements.
 */
function walkFields(node, path, fields) {
  if (!node || typeof node !== "object") return;

  const processNode = (item, currentPath) => {
    if (!item || typeof item !== "object") return;

    // Process <field> elements
    if (item["@_name"] !== undefined && item.ui !== undefined) {
      const name = item["@_name"];
      const fullPath = currentPath ? `${currentPath}.${name}` : name;
      const type = detectFieldType(item.ui);
      const caption = extractCaption(item.caption);
      const value = getTextValue(item.value);

      const field = { name: fullPath, type };
      if (caption) field.caption = caption;
      if (value !== undefined) field.value = value;

      // Extract options from <items> for choice lists
      if (item.items) {
        const items = Array.isArray(item.items) ? item.items : [item.items];
        const options = [];
        for (const itemGroup of items) {
          if (itemGroup.text) {
            const texts = Array.isArray(itemGroup.text) ? itemGroup.text : [itemGroup.text];
            for (const t of texts) {
              const v = typeof t === "string" ? t : t["#text"];
              if (v != null) options.push(String(v));
            }
          }
        }
        if (options.length > 0) field.options = options;
      }

      fields.push(field);
    }

    // Recurse into subforms and nested structures
    for (const key of Object.keys(item)) {
      if (key.startsWith("@_") || key === "#text") continue;
      const child = item[key];
      const nextPath = key === "subform" || key === "area" || key === "exclGroup"
        ? (item["@_name"] ? (currentPath ? `${currentPath}.${item["@_name"]}` : item["@_name"]) : currentPath)
        : currentPath;

      if (Array.isArray(child)) {
        for (const c of child) processNode(c, nextPath);
      } else if (typeof child === "object") {
        if (key === "field") {
          // <field> is a direct child
          if (Array.isArray(child)) {
            for (const f of child) processNode(f, nextPath);
          } else {
            processNode(child, nextPath);
          }
        } else if (key === "subform" || key === "area" || key === "exclGroup" || key === "draw") {
          processNode(child, nextPath);
        }
      }
    }
  };

  if (Array.isArray(node)) {
    for (const item of node) processNode(item, path);
  } else {
    processNode(node, path);
  }
}

/**
 * Parse XFA template XML to extract field definitions.
 */
export function parseXfaTemplate(templateXml) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    textNodeName: "#text",
    allowBooleanAttributes: true,
    parseAttributeValue: false,
  });

  const parsed = parser.parse(templateXml);
  const fields = [];

  // Find the template root — might be under different namespace prefixes
  let templateRoot = parsed.template || parsed["xfa:template"];
  if (!templateRoot) {
    // Search all keys for template
    for (const key of Object.keys(parsed)) {
      if (key.toLowerCase().includes("template")) {
        templateRoot = parsed[key];
        break;
      }
    }
  }
  if (!templateRoot) return fields;

  walkFields(templateRoot, "", fields);
  return fields;
}

/**
 * Recursively extract data values from XFA datasets XML.
 * Returns a flat map of dotted-path → value.
 */
function walkData(node, path, result) {
  if (node == null) return;
  if (typeof node === "string" || typeof node === "number") {
    result[path] = String(node);
    return;
  }
  if (typeof node !== "object") return;

  for (const key of Object.keys(node)) {
    if (key.startsWith("@_") || key === "@_xmlns" || key === "@_xmlns:xfa") continue;
    if (key === "#text") {
      if (path) result[path] = String(node[key]);
      continue;
    }
    const child = node[key];
    const childPath = path ? `${path}.${key}` : key;
    if (Array.isArray(child)) {
      child.forEach((item, idx) => walkData(item, `${childPath}[${idx}]`, result));
    } else {
      walkData(child, childPath, result);
    }
  }
}

/**
 * Parse XFA datasets XML and return a flat value map.
 */
export function parseXfaDatasets(datasetsXml) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    textNodeName: "#text",
    allowBooleanAttributes: true,
    parseAttributeValue: false,
  });

  const parsed = parser.parse(datasetsXml);
  const values = {};

  // Find the datasets/data root
  let datasets = parsed.datasets || parsed["xfa:datasets"];
  if (!datasets) {
    for (const key of Object.keys(parsed)) {
      if (key.toLowerCase().includes("datasets")) {
        datasets = parsed[key];
        break;
      }
    }
  }
  if (!datasets) return values;

  let data = datasets.data || datasets["xfa:data"];
  if (!data) {
    for (const key of Object.keys(datasets)) {
      if (key.toLowerCase().includes("data") && !key.startsWith("@_")) {
        data = datasets[key];
        break;
      }
    }
  }
  if (!data) return values;

  walkData(data, "", values);
  return values;
}

/**
 * Merge data values into XFA datasets XML.
 * `entries` is an array of { name, value } objects.
 * Returns the updated datasets XML string.
 */
export function updateXfaDatasets(datasetsXml, entries) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    textNodeName: "#text",
    allowBooleanAttributes: true,
    parseAttributeValue: false,
    preserveOrder: true,
  });

  const builder = new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    textNodeName: "#text",
    preserveOrder: true,
    format: true,
    suppressEmptyNode: false,
  });

  const parsed = parser.parse(datasetsXml);

  // Build a lookup for quick matching
  const entryMap = {};
  for (const e of entries) {
    entryMap[e.name] = e.value;
  }

  // Walk the parsed tree and update values
  function updateNode(nodes, path) {
    if (!Array.isArray(nodes)) return;
    for (const node of nodes) {
      for (const key of Object.keys(node)) {
        if (key === ":@" || key === "#text") continue;
        const children = node[key];
        if (!Array.isArray(children)) continue;

        for (const child of children) {
          const childKeys = Object.keys(child).filter(k => k !== ":@" && k !== "#text");
          if (childKeys.length === 0 && child["#text"] !== undefined) {
            // This is a leaf text node — check the parent tag
            continue;
          }
          for (const ck of childKeys) {
            const childPath = path ? `${path}.${ck}` : ck;
            const grandChildren = child[ck];

            // Check if this field should be updated
            if (entryMap[childPath] !== undefined || entryMap[ck] !== undefined) {
              const val = entryMap[childPath] ?? entryMap[ck];
              // Replace content
              if (Array.isArray(grandChildren)) {
                child[ck] = [{ "#text": String(val) }];
              }
            } else {
              updateNode([child], path);
            }
          }
        }
      }
    }
  }

  updateNode(parsed, "");
  return builder.build(parsed);
}

/**
 * Write updated XFA streams back into a PDF.
 * `pdfDoc` is a pdf-lib PDFDocument, `streams` is the updated stream map.
 */
export async function writeXfaStreams(pdfDoc, streams) {
  const acroForm = pdfDoc.catalog.lookup(PDFName.of("AcroForm"));
  if (!acroForm) throw new Error("No AcroForm dictionary in PDF");

  const xfa = acroForm.lookup(PDFName.of("XFA"));
  if (!xfa) throw new Error("No XFA entry in AcroForm");

  if (xfa instanceof PDFArray) {
    for (let i = 0; i < xfa.size(); i += 2) {
      const nameObj = xfa.lookup(i);
      const name = nameObj?.toString?.()?.replace(/^\(|\)$/g, "").replace(/^\//,"") || "";
      if (streams[name]) {
        const streamObj = xfa.lookup(i + 1);
        if (streamObj) {
          let encoded = Buffer.from(streams[name], "utf-8");
          if (isCompressed(streamObj)) {
            encoded = zlib.deflateSync(encoded);
          }
          if (streamObj.contents !== undefined) {
            streamObj.contents = encoded;
          } else if (typeof streamObj.setContents === "function") {
            streamObj.setContents(encoded);
          }
          // Update length
          if (streamObj.dict) {
            streamObj.dict.set(PDFName.of("Length"), pdfDoc.context.obj(encoded.length));
          }
        }
      }
    }
  }
}

/**
 * High-level: parse an XFA PDF and return fields with current values.
 */
export function getXfaFields(pdfDoc) {
  const streams = extractXfaStreams(pdfDoc);
  if (!streams) return [];

  // Get template (field definitions)
  const templateXml = streams.template || streams.xfa || "";
  const fields = templateXml ? parseXfaTemplate(templateXml) : [];

  // Get current values from datasets
  const datasetsXml = streams.datasets || "";
  if (datasetsXml) {
    const dataValues = parseXfaDatasets(datasetsXml);
    // Merge data values into fields
    for (const field of fields) {
      // Try matching by full path and by leaf name
      const leafName = field.name.split(".").pop();
      for (const [dataPath, val] of Object.entries(dataValues)) {
        const dataLeaf = dataPath.split(".").pop();
        if (dataLeaf === leafName || dataPath.endsWith(field.name)) {
          field.value = val;
          break;
        }
      }
    }
  }

  return fields;
}

/**
 * High-level: fill XFA form fields in a PDF.
 * Returns updated PDFDocument bytes.
 */
export async function fillXfaFields(pdfPath, entries) {
  const data = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(data);

  const streams = extractXfaStreams(pdfDoc);
  if (!streams) throw new Error("PDF does not contain XFA form data");

  const datasetsXml = streams.datasets;
  if (!datasetsXml) throw new Error("PDF does not contain XFA datasets");

  const updatedXml = updateXfaDatasets(datasetsXml, entries);
  streams.datasets = updatedXml;

  await writeXfaStreams(pdfDoc, streams);

  return await pdfDoc.save();
}
