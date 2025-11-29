Add new interactive form fields to an existing PDF. The command reads a JSON array of field description objects from stdin and writes a modified PDF to the specified output path. Use this when you need to programmatically insert text inputs, checkboxes, choice fields or radio groups into documents that either lack fields or need additional fields added.

The JSON input is an array of objects where each object describes one form element. Typical properties are: name, alternativeText, type (TextField, CheckBox, RadioGroup, ComboBox/Dropdown, ListBox), page (1-based page number), x, y, width, height (all in PDF points), and options (for dropdowns, list boxes, and radio groups). Coordinates and dimensions match the values returned by aux4 pdf parse (see the ref object) so you can reuse parsed positions to place fields precisely. RadioGroup options are laid out horizontally across the specified width and split evenly among options.

Fields are created using the provided name — choose unique names to avoid collisions with existing fields. For text fields the command creates a borderless text box by default; for other field types the default rendering is used. If you need to discover existing fields and their coordinates before adding or aligning new ones, run [aux4 pdf parse](./parse). After adding fields you can populate them using [aux4 pdf fill](./fill).

### Example: Add a text field and a checkbox to page 1

This example adds a text input called "CustomerName" and a checkbox called "Agree" to page 1 of sample.pdf and writes the updated PDF to updated.pdf. Use aux4 pdf parse to obtain coordinates if you need exact placement.

```json
[
  {
    "name": "CustomerName",
    "alternativeText": "Customer name",
    "type": "TextField",
    "page": 1,
    "x": 150,
    "y": 560,
    "width": 300,
    "height": 20
  },
  {
    "name": "Agree",
    "alternativeText": "I agree",
    "type": "CheckBox",
    "page": 1,
    "x": 150,
    "y": 530,
    "width": 12,
    "height": 12
  }
]
```

```bash
# Provide the JSON on stdin and specify an output file
cat form-defs.json | aux4 pdf form sample.pdf --out updated.pdf
```

The command prints a confirmation message like:

```text
Form fields added and saved to updated.pdf
```

### Example: Add a dropdown with options

```json
[
  {
    "name": "ColorChoice",
    "type": "ComboBox",
    "page": 1,
    "x": 72,
    "y": 520,
    "width": 120,
    "height": 20,
    "options": ["Red","Green","Blue"]
  }
]
```

```bash
cat dropdown.json | aux4 pdf form sample.pdf --out with-dropdown.pdf
```

Notes:
- Page numbers are 1-based. Coordinates are in PDF points and correspond to values returned by aux4 pdf parse's ref object.
- Radio group options are distributed evenly across the provided width; supply the options array in the order you want them laid out.
- If you need to set values after adding fields, use [aux4 pdf fill](./fill) with the appropriate JSON mapping of field names to values.
