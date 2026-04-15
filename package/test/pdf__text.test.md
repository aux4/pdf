# pdf text

## Extracting text from a PDF

### should extract all text from a fillable PDF

```execute
aux4 pdf text sample-fillable-form.pdf | head -3
```

```expect:partial
Sample Fillable*
**fillable PDF*
```

### should extract text from a specific page

```execute
aux4 pdf text sample-fillable-form.pdf --page 1 | head -1
```

```expect:partial
Sample Fillable*
```

### should extract text from an XFA PDF

```execute
aux4 pdf text sample-xfa-form.pdf | head -1
```

```expect:partial
XFA Form*
```
