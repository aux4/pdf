Encrypts a PDF file with a password using 256-bit AES encryption. The command takes the input PDF as a positional argument, requires a --password flag, and optionally accepts --out for the output path. If --out is omitted, the original file is overwritten.

This command uses qpdf under the hood. The same password is used for both the user and owner passwords.

### Example: Protect a PDF with a password

```bash
aux4 pdf protect document.pdf --password secret123 --out protected.pdf
```

This encrypts document.pdf with the password "secret123" and saves the result to protected.pdf.

### Example: Protect a PDF in place

```bash
aux4 pdf protect document.pdf --password secret123
```

This encrypts document.pdf in place, overwriting the original file.

See also: [aux4 pdf unprotect](./unprotect) to remove password protection from a PDF.