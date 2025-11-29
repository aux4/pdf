import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";

export default {
  input: "index.js",
  output: {
    file: "package/lib/aux4-pdf.js",
    format: "es",
    sourcemap: false,
    inlineDynamicImports: true
  },
  external: (id) => {
    // Node.js built-ins
    if ([
      "fs", "path", "process", "stream", "zlib", "util", "events",
      "buffer", "string_decoder", "url", "http", "https", "crypto",
      "os", "child_process", "assert", "worker_threads", "module"
    ].includes(id)) {
      return true;
    }
    // Native binary dependencies that cannot be bundled
    if (["pdf2pic", "canvas", "gm"].includes(id)) {
      return true;
    }
    // pdf.js-extract has complex worker setup that breaks when bundled
    if (id.startsWith("pdf.js-extract")) {
      return true;
    }
    return false;
  },
  plugins: [
    resolve({
      preferBuiltins: true,
      exportConditions: ["node"]
    }),
    commonjs({
      ignoreDynamicRequires: true,
      ignore: ["canvas"]
    }),
    json()
  ],
  onwarn(warning, warn) {
    // Suppress circular dependency warnings from pdf-lib
    if (warning.code === "CIRCULAR_DEPENDENCY") return;
    // Suppress eval warnings from pdfjs
    if (warning.code === "EVAL") return;
    warn(warning);
  }
};
