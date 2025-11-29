import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

export default {
  input: "index.js",
  output: {
    file: "package/lib/aux4-pdf.js",
    format: "es",
    sourcemap: false
  },
  external: [
    "fs",
    "path",
    "process",
    "pdf-lib",
    "pdf.js-extract/lib/pdfjs/pdf.js",
    "pdf2pic"
  ],
  plugins: [
    resolve({
      preferBuiltins: true
    }),
    commonjs()
  ]
};
