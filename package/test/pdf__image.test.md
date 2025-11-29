# pdf image

## Given a sample-fillable-form.pdf

### It should convert a specific page to an image

```execute
aux4 pdf image sample-fillable-form.pdf --page 1 --image page1-output.png
```

```expect
page1-output.png
```

### It should verify the image file was created

```execute
test -f page1-output.png && echo "file exists"
```

```expect
file exists
```

### Cleanup image file

```execute
rm -f page1-output.png && echo "cleaned"
```

```expect
cleaned
```
