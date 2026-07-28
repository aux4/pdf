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

## In-place protect and unprotect (no --out)

```beforeAll
cp sample-fillable-form.pdf inplace-test.pdf
```

```afterAll
rm -f inplace-test.pdf
```

### should protect the PDF in place when no --out is given

```execute
aux4 pdf protect inplace-test.pdf --password test123
```

```expect
PDF protected and saved to inplace-test.pdf
```

### should fail to count pages on the in-place protected PDF

```execute
aux4 pdf count inplace-test.pdf
```

```error
The PDF file is password-protected. Use 'aux4 pdf unprotect' to remove protection first.
```

### should unprotect the PDF in place when no --out is given

```execute
aux4 pdf unprotect inplace-test.pdf --password test123
```

```expect
PDF unprotected and saved to inplace-test.pdf
```

### should count pages on the in-place unprotected PDF

```execute
aux4 pdf count inplace-test.pdf
```

```expect
1
```

## Wrong password

```beforeAll
aux4 pdf protect sample-fillable-form.pdf --password test123 --out wrongpw-test.pdf
```

```afterAll
rm -f wrongpw-test.pdf wrongpw-out.pdf
```

### should fail with a clean single-line error on the wrong password

```execute
aux4 pdf unprotect wrongpw-test.pdf --password nope --out wrongpw-out.pdf
```

```error
qpdf: wrongpw-test.pdf: invalid password
```
