import { execSync } from "child_process";

function runQpdf(command) {
  try {
    execSync(command, { stdio: "pipe" });
  } catch (err) {
    // exit code 3 = succeeded with warnings, treat as success
    if (err.status === 3) return;
    throw err;
  }
}

export function protectPdf(inPath, outPath, password) {
  runQpdf(`qpdf --encrypt ${escapeArg(password)} ${escapeArg(password)} 256 -- ${escapeArg(inPath)} ${escapeArg(outPath)}`);
}

export function unprotectPdf(inPath, outPath, password) {
  runQpdf(`qpdf --password=${escapeArg(password)} --decrypt ${escapeArg(inPath)} ${escapeArg(outPath)}`);
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
