# pdf fill

## Given a sample-fillable-form.pdf

### It should fill the form fields and save to output file

```execute
echo '[{"name": "Name", "value": "John Doe", "type": "TextField"}, {"name": "Dropdown2", "value": "Choice 2", "type": "Dropdown"}, {"name": "Option 1", "value": true, "type": "CheckBox"}]' | aux4 pdf fill sample-fillable-form.pdf --out filled-output.pdf
```

```expect
PDF filled and saved to filled-output.pdf
```

### It should verify the filled PDF was created

```execute
test -f filled-output.pdf && echo "file exists"
```

```expect
file exists
```

### Cleanup filled PDF

```execute
rm -f filled-output.pdf && echo "cleaned"
```

```expect
cleaned
```
