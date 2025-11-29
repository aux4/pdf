# aux4/pdf

PDF toolkit

A small set of aux4 commands for inspecting and manipulating PDF files. This package exposes utilities to count pages, parse PDF structure, fill PDFs with data, add form fields, and render PDF pages to images.

This package is useful for automation workflows that need quick, scriptable PDF operations (page counts, extracting structure, filling templates, adding form fields, exporting pages as images) and fits into the aux4 ecosystem as a lightweight PDF helper that can be composed with other aux4 packages and scripts.

## Installation

```bash
aux4 aux4 pkger install aux4/pdf
```

## System Dependencies

This package requires system-level tools in some operations. You need to have one of the following system installers available for the dependencies referenced by the package:

- [brew](/r/public/packages/aux4/system-installer-brew)
- [apt](/r/public/packages/aux4/system-installer-apt)

For more details, see [system-installer](/r/public/packages/aux4/pkger/commands/aux4/pkger/system).

## Quick Start

Count the number of pages in a PDF:

```bash
aux4 pdf count sample.pdf
```

This runs the package's page-count routine on sample.pdf and prints the page count to stdout.

## Count pages

Overview

Use the count command to quickly determine the number of pages in a PDF file. This is a minimal, fast operation useful in scripts and CI checks.

Example

```bash
aux4 pdf count invoice.pdf
```

For command-specific details, see [aux4 pdf count](./commands/pdf/count).

## Parse PDF

Overview

The parse command extracts and prints parsed PDF information produced by the package parser. Use it when you need to inspect the PDF structure or extract metadata the parser exposes.

Example

```bash
aux4 pdf parse document.pdf
```

For command-specific details, see [aux4 pdf parse](./commands/pdf/parse).

## Fill a PDF (provide data on stdin)

Overview

The fill command accepts data on stdin and applies it to a PDF template, producing a filled PDF. Provide the template PDF as a positional argument. Optionally pass an output location using the out variable (if omitted, the filled PDF will be saved next to the original file).

Example

Create a JSON array with field objects matching the template's fields (use `aux4 pdf parse` to discover field names and types):

`form-data.json`:

```json
[
  {"name": "Name", "value": "Jane Doe", "type": "TextField"},
  {"name": "Date", "value": "2025-01-15", "type": "TextField"},
  {"name": "Amount", "value": "$123.45", "type": "TextField"}
]
```

Then run:

```bash
cat form-data.json | aux4 pdf fill template.pdf --out filled.pdf
```

This reads the JSON payload from stdin, fills template.pdf, and writes the result to filled.pdf.

For command-specific details, see [aux4 pdf fill](./commands/pdf/fill).

## Add form fields

Overview

The form command accepts field definitions from stdin and adds form fields to a PDF. Use this to programmatically add or modify form structures before distributing templates.

Example

Create a JSON description of form fields:

`fields.json`:

```json
[
  {
    "name": "customer_name",
    "type": "TextField",
    "page": 1,
    "x": 50,
    "y": 700,
    "width": 300,
    "height": 20
  },
  {
    "name": "invoice_date",
    "type": "TextField",
    "page": 1,
    "x": 400,
    "y": 700,
    "width": 120,
    "height": 20
  }
]
```

Then run:

```bash
cat fields.json | aux4 pdf form template.pdf --out template-with-fields.pdf
```

For command-specific details, see [aux4 pdf form](./commands/pdf/form).

## Convert a PDF page to an image

Overview

The image command converts a page from a PDF into an image file. Provide the PDF as the positional argument and optionally use --page and --image to select the page and output filename. If --image is omitted, the image will be saved next to the source PDF.

Example

```bash
aux4 pdf image brochure.pdf --page 2 --image page2.png
```

This converts page 2 of brochure.pdf into page2.png.

For command-specific details, see [aux4 pdf image](./commands/pdf/image).

## Examples

### Fill a template with JSON data

This example shows filling a template using JSON input read from a file. Create the JSON payload (see the Quick Start example) and then pipe it to the fill command:

```bash
cat data/employee-onboarding.json | aux4 pdf fill onboarding-template.pdf --out onboarding-filled.pdf
```

The filled PDF is written to onboarding-filled.pdf.

### Add form fields to a template

Use a JSON array describing fields and pipe it to the form command:

```bash
cat data/fields.json | aux4 pdf form blank-form.pdf --out blank-form-with-fields.pdf
```

This creates blank-form-with-fields.pdf with the new form fields applied.

### Convert multiple pages to images

Convert the first three pages of a PDF to sequential images (example using a loop):

```bash
aux4 pdf image report.pdf --page 1 --image report-page-1.png
aux4 pdf image report.pdf --page 2 --image report-page-2.png
aux4 pdf image report.pdf --page 3 --image report-page-3.png
```

Each command writes the specified page to the given PNG file.

## License

This package is licensed under the Apache-2.0 License.

See [LICENSE](./license) for details.
