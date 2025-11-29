Counts the number of pages in a PDF and prints the result as a single integer to stdout. The command runs the package's Node helper (lib/aux4-pdf.js) with the count action and the provided file path; it emits the page count with no surrounding text so it can be used in scripts or piped into other tools.

The command expects a PDF file path as a positional argument. If the file cannot be read or is not a valid PDF, the helper will return an error; otherwise the exact page count is printed. This works for both fillable and non-fillable PDFs and is suitable for quick checks in automation.

You can combine this with related PDF operations such as parsing or rendering a page to an image. See [aux4 pdf parse](./parse) or [aux4 pdf image](./image) for related functionality.

### Example: Count pages

Given a PDF in the working directory, run:

```bash
aux4 pdf count sample-fillable-form.pdf
```

The command prints the page count, for example:

```text
1
```
