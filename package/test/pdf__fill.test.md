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

## Given a sample-choice-form.pdf

```afterAll
rm -f choice-filled.pdf
```

### It should fill a dropdown (choice) field and a text field

```execute
echo '[{"name": "plan", "value": "Pro", "type": "Dropdown"}, {"name": "name", "value": "Sally", "type": "TextField"}]' | aux4 pdf fill sample-choice-form.pdf --out choice-filled.pdf
```

```expect
PDF filled and saved to choice-filled.pdf
```

### It should reflect the dropdown selection when the filled PDF is parsed

```execute
aux4 pdf parse choice-filled.pdf | tr -d ' \n' | grep -o '"value":\["Pro"\],"type":"Dropdown"'
```

```expect
"value":["Pro"],"type":"Dropdown"
```

### It should reflect the text field value when the filled PDF is parsed

```execute
aux4 pdf parse choice-filled.pdf | tr -d ' \n' | grep -o '"name":"name","alternativeText":"","value":"Sally"'
```

```expect
"name":"name","alternativeText":"","value":"Sally"
```
