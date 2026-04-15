# pdf parse (XFA)

## Parsing an XFA PDF form

### should detect XFA and return fields with xfa flag

```execute
aux4 pdf parse sample-xfa-form.pdf | grep -o '"xfa": true'
```

```expect
"xfa": true
```

### should extract XFA field names

```execute
aux4 pdf parse sample-xfa-form.pdf | grep -o '"name": "[^"]*"'
```

```expect
"name": "FullName"
"name": "Email"
"name": "Subscribe"
"name": "Country"
```

### should extract XFA field types

```execute
aux4 pdf parse sample-xfa-form.pdf | grep -o '"type": "[^"]*"'
```

```expect
"type": "TextField"
"type": "TextField"
"type": "CheckBox"
"type": "Dropdown"
```

### should extract XFA field values from datasets

```execute
aux4 pdf parse sample-xfa-form.pdf | grep -o '"value": "[^"]*"'
```

```expect
"value": "John Doe"
"value": "john@example.com"
"value": "1"
"value": "Canada"
```

### should extract dropdown options

```execute
aux4 pdf parse sample-xfa-form.pdf | grep '"options"' -A 6 | head -7
```

```expect:partial
"options": [
**"Australia"
```

### should extract field captions

```execute
aux4 pdf parse sample-xfa-form.pdf | grep -o '"caption": "[^"]*"'
```

```expect
"caption": "Full Name"
"caption": "Email"
"caption": "Subscribe to newsletter"
"caption": "Country"
```

### should extract page text

```execute
aux4 pdf parse sample-xfa-form.pdf | grep -o '"text": "[^"]*"'
```

```expect:partial
"text": "XFA Form*
```
