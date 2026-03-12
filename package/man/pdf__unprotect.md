Removes password protection from an encrypted PDF file. The command takes the input PDF as a positional argument, requires a --password flag with the correct password, and optionally accepts --out for the output path. If --out is omitted, the original file is overwritten.

This command uses qpdf under the hood to decrypt the PDF.

### Example: Unprotect a PDF

```bash
aux4 pdf unprotect protected.pdf --password secret123 --out decrypted.pdf
```

This decrypts protected.pdf using the password "secret123" and saves the result to decrypted.pdf.

### Example: Unprotect a PDF in place

```bash
aux4 pdf unprotect protected.pdf --password secret123
```

This decrypts protected.pdf in place, overwriting the original file.

See also: [aux4 pdf protect](./protect) to password-protect a PDF.