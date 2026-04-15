# pdf fill (XFA)

## Filling an XFA PDF form

### should update field values in XFA datasets

```execute
echo '{"FullName":"Jane Smith","Email":"jane@test.com"}' | aux4 pdf fill --file sample-xfa-form.pdf --out xfa-filled-output.pdf
```

```expect
PDF filled and saved to xfa-filled-output.pdf
```

### should verify filled values in output PDF

```execute
aux4 pdf parse xfa-filled-output.pdf | grep -o '"value": "[^"]*"'
```

```expect
"value": "Jane Smith"
"value": "jane@test.com"
"value": "1"
"value": "Canada"
```

### should preserve unfilled fields

```execute
aux4 pdf parse xfa-filled-output.pdf | grep -o '"name": "Subscribe"'
```

```expect
"name": "Subscribe"
```

```afterAll
rm -f xfa-filled-output.pdf
```
