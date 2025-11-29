Fills form fields in a PDF using JSON provided on stdin. The command reads the specified PDF, applies field values from the JSON object, and writes a new PDF file to the location provided by --out (or overwrites/creates a file alongside the original when --out is omitted). Field names and expected value shapes should be discovered with aux4 pdf parse so you can target the correct form field names and types.

The JSON sent to stdin should map form field names to their desired values. Text fields accept string values; dropdowns and choice fields use arrays or strings as appropriate; checkboxes typically accept "On" to mark them checked (fields with value "Off" are unchecked). If the target PDF has no form fields, use aux4 pdf form to add fields first, or create a mapped PDF that contains the fields you need.

This command is intended to be used in a pipeline where you construct or generate a JSON object and pipe it into the aux4 pdf fill command. Use aux4 pdf parse to inspect available fields and their exact names before filling; when you need to add or alter fields programmatically, use aux4 pdf form.

### Example: Fill a sample form

This example fills fields in a sample fillable PDF and writes the result to filled.pdf. The JSON is an array of objects, each with `name`, `value`, and `type` properties (as returned by aux4 pdf parse).

```json
[
  {"name": "Name", "value": "Alice Example", "type": "TextField"},
  {"name": "Dropdown2", "value": "Choice 2", "type": "Dropdown"},
  {"name": "Option 1", "value": true, "type": "CheckBox"},
  {"name": "Name of Dependent", "value": "Jamie", "type": "TextField"}
]
```

```bash
# Provide the JSON on stdin and specify an output file
echo '[{"name": "Name", "value": "Alice Example", "type": "TextField"}, {"name": "Option 1", "value": true, "type": "CheckBox"}]' \
  | aux4 pdf fill sample-fillable-form.pdf --out filled.pdf
```

The command writes filled.pdf with the form fields set as specified. If you omit --out, the filled PDF will be saved next to the original file with a default name.

See also: [aux4 pdf parse](./parse) to discover field names and types, and [aux4 pdf form](./form) to add or modify form fields programmatically.