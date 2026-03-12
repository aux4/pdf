# pdf protect

## Given a sample-fillable-form.pdf

```afterAll
rm -f protected-test.pdf unprotected-test.pdf
```

### should protect the PDF with a password

```execute
aux4 pdf protect sample-fillable-form.pdf --password test123 --out protected-test.pdf
```

```expect
PDF protected and saved to protected-test.pdf
```

### should fail to count pages on the protected PDF

```execute
aux4 pdf count protected-test.pdf
```

```error
The PDF file is password-protected. Use 'aux4 pdf unprotect' to remove protection first.
```

### should unprotect the PDF with the correct password

```execute
aux4 pdf unprotect protected-test.pdf --password test123 --out unprotected-test.pdf
```

```expect
PDF unprotected and saved to unprotected-test.pdf
```

#### should count pages on the unprotected PDF

```execute
aux4 pdf count unprotected-test.pdf
```

```expect
1
```
