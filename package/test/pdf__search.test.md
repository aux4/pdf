### Searching for a term that exists

```execute
aux4 pdf search sample-fillable-form.pdf --term "fillable"
```

```expect:partial:json
[
  {
    "page": 1,
    "text": "Sample Fillable",
    "x": *,
    "y": *
  },
  {
    "page": 1,
    "text": "*fillable PDF*",
    "x": *,
    "y": *
  }
]
```

### Searching is case-insensitive

```execute
aux4 pdf search sample-fillable-form.pdf --term "FILLABLE"
```

```expect:partial:json
[
  {
    "page": 1,
    "text": "Sample Fillable",
    "x": *,
    "y": *
  },
  {
    "page": 1,
    "text": "*fillable PDF*",
    "x": *,
    "y": *
  }
]
```

### Searching for a term that does not exist

```execute
aux4 pdf search sample-fillable-form.pdf --term "nonexistent-xyz"
```

```expect:json
[]
```

### Searching for a field-related term

```execute
aux4 pdf search sample-fillable-form.pdf --term "dependent"
```

```expect:partial:json
[
  {
    "page": 1,
    "text": "Name of Dependent",
    "x": *,
    "y": *
  },
  {
    "page": 1,
    "text": "Age of Dependent",
    "x": *,
    "y": *
  }
]
```
