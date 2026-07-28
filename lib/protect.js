import { execSync } from "child_process";
import fs from "fs";
import path from "path";

function runQpdf(command) {
  try {
    execSync(command, { stdio: "pipe" });
  } catch (err) {
    // exit code 3 = succeeded with warnings, treat as success
    if (err.status === 3) return;
    // Surface qpdf's own message (e.g. "qpdf: file.pdf: invalid password")
    // instead of letting a raw Node execSync error bubble up as a stack trace.
    const stderr = err.stderr ? err.stderr.toString().trim() : "";
    const clean = new Error(stderr || err.message);
    clean.isQpdfError = true;
    throw clean;
  }
}

// qpdf refuses to run when the input and output paths are the same
// ("input file and output file are the same"). To support in-place
// protect/unprotect we run qpdf into a temporary sibling file and then
// move it over the original once qpdf succeeds.
function runInPlaceSafe(inPath, outPath, buildCommand) {
  const inPlace = path.resolve(inPath) === path.resolve(outPath);
  if (!inPlace) {
    runQpdf(buildCommand(inPath, outPath));
    return;
  }

  const dir = path.dirname(path.resolve(outPath));
  const tmp = path.join(dir, `.aux4-pdf-${process.pid}-${Date.now()}.tmp.pdf`);
  try {
    runQpdf(buildCommand(inPath, tmp));
    fs.renameSync(tmp, outPath);
  } catch (err) {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    throw err;
  }
}

export function protectPdf(inPath, outPath, password) {
  runInPlaceSafe(
    inPath,
    outPath,
    (src, dest) =>
      `qpdf --encrypt ${escapeArg(password)} ${escapeArg(password)} 256 -- ${escapeArg(src)} ${escapeArg(dest)}`
  );
}

export function unprotectPdf(inPath, outPath, password) {
  runInPlaceSafe(
    inPath,
    outPath,
    (src, dest) => `qpdf --password=${escapeArg(password)} --decrypt ${escapeArg(src)} ${escapeArg(dest)}`
  );
}

export function isProtected(filePath) {
  try {
    execSync(`qpdf --requires-password ${escapeArg(filePath)}`, {
      stdio: "pipe",
    });
    // exit code 0 means a password IS required
    return true;
  } catch (err) {
    // exit code 2 = not encrypted, 3 = encrypted with correct password supplied
    return false;
  }
}

function escapeArg(arg) {
  return `'${arg.replace(/'/g, "'\\''")}'`;
}
