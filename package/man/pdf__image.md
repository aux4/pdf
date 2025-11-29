Converts a single page from a PDF into an image file. The command runs the package's image extraction pipeline and prints the path of the generated image to stdout. Use the --page parameter to select which page to convert and --image to set the output path; when the output path is omitted the image will be saved next to the source PDF using the package's default naming scheme.

This command is useful when you need rasterized previews or thumbnails of PDF pages for display, automated testing, or content extraction. It works on any PDF the package can read; for multi-page PDFs provide the page number you want to convert. For scripting, the command prints the output filename which makes it easy to chain further operations.

Related commands: see [aux4 pdf count](../count) to determine the number of pages in a PDF and [aux4 pdf parse](../parse) to inspect PDF structure before extracting images.

### Example: Convert page 1 to a PNG

Converts the first page of a PDF and writes the image to a specific file.

```bash
aux4 pdf image sample-fillable-form.pdf --page 1 --image page1-output.png
```

Typical output (the command prints the generated image path):

```text
page1-output.png
```
