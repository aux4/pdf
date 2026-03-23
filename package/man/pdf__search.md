#### Description

The `search` command searches for a term in a PDF file and returns a JSON array of matches with the page number and position (x, y coordinates) where each match was found. The search is case-insensitive and looks through the extracted text content of every page. It searches both individual text items and concatenated line text to find matches that may span multiple text fragments.

The command is useful for locating specific content within large PDFs, verifying that expected text exists, or finding the page number where a term appears.

#### Usage

```bash
aux4 pdf search <file> --term <search-term>
```

--term  The term to search for in the PDF (case-insensitive)

#### Example

```bash
aux4 pdf search document.pdf --term "fillable"
```

```json
[
  {
    "page": 1,
    "text": "This is an example of a fillable PDF.",
    "x": 72,
    "y": 650
  }
]
```

If no matches are found, an empty array is returned:

```json
[]
```

Related commands: [aux4 pdf parse](./pdf__parse), [aux4 pdf count](./pdf__count)
