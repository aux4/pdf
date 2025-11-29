# pdf form

## Given a sample-non-fillable-form.pdf

### It should add form fields and save to output file

```execute
echo '[{"name": "NewTextField", "type": "TextField", "page": 1, "x": 200, "y": 500, "width": 150, "height": 20}]' | aux4 pdf form sample-non-fillable-form.pdf --out form-output.pdf
```

```expect
Form fields added and saved to form-output.pdf
```

### It should verify the new form field was added

```execute
aux4 pdf parse form-output.pdf | jq -r '.[] | .fields[] | select(.name == "NewTextField") | .name'
```

```expect
NewTextField
```

### Cleanup form PDF

```execute
rm -f form-output.pdf && echo "cleaned"
```

```expect
cleaned
```
