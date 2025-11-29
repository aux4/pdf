Parses a PDF and returns a JSON representation of each page's textual content and any form fields present. The command runs the package's parsing routine to extract page-level text and to enumerate form fields with metadata (name, type, current value, options for dropdowns, and a ref object describing the field's bounding box). This output is suitable for inspection, indexing, or driving further programmatic processing such as automated form filling or validation.

When a PDF contains AcroForm fields the parser will return a non-empty "fields" array for the page(s) where fields are found. Each field object contains properties such as name, alternativeText, value (string or array), type (e.g. TextField, Dropdown, CheckBox), options (for dropdowns), and ref (x, y, width, height). For non-fillable PDFs the fields array will be empty and only the extracted page text is returned.

Invoke the command as: aux4 pdf parse <file>. The command accepts a single positional argument: the path to the PDF file to parse. Use the output when you need to discover form fields, inspect form structure, or extract human-readable text for indexing or testing.

### Example: Parsing a fillable PDF

This example shows how to run the parser against a PDF that contains form fields. The output is an array of page objects; each page contains "page", "text" and "fields". Fields include form metadata and location information.

```bash
aux4 pdf parse sample-fillable-form.pdf
```

```json
[
  {
    "page": 1,
    "text": "... text with placeholders or surrounding content ...",
    "fields": [
      {
        "name": "Name",
        "type": "TextField",
        "value": "",
        "ref": { "x": 202.468, "y": 587.91, "width": 209.821, "height": 22 }
      },
      {
        "name": "Dropdown2",
        "type": "Dropdown",
        "value": ["Choice 1"],
        "options": ["Choice 1","Choice 2","Choice 3","Choice 4"]
      }
    ]
  }
]
```

### Example: Parsing a non-fillable PDF

When the PDF has no AcroForm fields the parser still returns the page text but the "fields" array will be empty.

```bash
aux4 pdf parse sample-non-fillable-form.pdf
```

```json
[
  {
    "page": 1,
    "text": "... extracted page text ...",
    "fields": []
  }
]
```

Related commands: [aux4 pdf fill](./fill), [aux4 pdf form](./form), [aux4 pdf count](./count)