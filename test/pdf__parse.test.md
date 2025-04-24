### Parsing a fillable PDF form

```execute
aux4 pdf parse sample-fillable-form.pdf
```

```expect
[
  {
    "page": 1,
    "text": "Sample Fillable PDF   This is an example of a fillable PDF. A client can save it and email it back to you, or print it and  bring it along with them to a meeting with you. Please enter your name:  [Field:Name] Please select an item from the combo/dropdown list: First Choice  [Field:Dropdown2] Check all that apply:  [Field:Option 1] Option 1  [Field:Option 2] Option 2 [Field:Option 3] Option 3 You can add fields within tables as well:  Name of Dependent  [Field:Name of Dependent] Age of Dependent  [Field:Age\t of Dependent]",
    "fields": [
      {
        "name": "Name",
        "alternativeText": "",
        "value": "",
        "type": "TextField",
        "ref": {
          "x": 202.468,
          "y": 587.91,
          "width": 209.821,
          "height": 22
        }
      },
      {
        "name": "Dropdown2",
        "alternativeText": "",
        "value": [
          "Choice 1"
        ],
        "type": "Dropdown",
        "options": [
          "Choice 1",
          "Choice 2",
          "Choice 3",
          "Choice 4"
        ],
        "ref": {
          "x": 71.6528,
          "y": 524.831,
          "width": 72.00019999999999,
          "height": 20
        }
      },
      {
        "name": "Option 1",
        "alternativeText": "Option 1",
        "value": "Off",
        "type": "CheckBox",
        "ref": {
          "x": 73.2,
          "y": 479.28,
          "width": 12.959999999999994,
          "height": 12.960000000000036
        }
      },
      {
        "name": "Option 2",
        "alternativeText": "Option 2",
        "value": "Off",
        "type": "CheckBox",
        "ref": {
          "x": 73.2,
          "y": 464.64,
          "width": 12.959999999999994,
          "height": 12.960000000000036
        }
      },
      {
        "name": "Option 3",
        "alternativeText": "Option 3",
        "value": "Off",
        "type": "CheckBox",
        "ref": {
          "x": 73.2,
          "y": 450,
          "width": 12.959999999999994,
          "height": 12.95999999999998
        }
      },
      {
        "name": "Name of Dependent",
        "alternativeText": "Name of Dependent",
        "value": "",
        "type": "TextField",
        "ref": {
          "x": 183.6,
          "y": 401.28,
          "width": 232.44000000000003,
          "height": 14.04000000000002
        }
      },
      {
        "name": "Age\t of Dependent",
        "alternativeText": "Age\t of Dependent",
        "value": "",
        "type": "TextField",
        "ref": {
          "x": 183.6,
          "y": 386.16,
          "width": 232.44000000000003,
          "height": 14.039999999999964
        }
      }
    ]
  }
]
```

### Parsing a non-fillable PDF form

```execute
aux4 pdf parse sample-non-fillable-form.pdf
```

```expect
[
  {
    "page": 1,
    "text": "Sample Fillable PDF   This is an example of a fillable PDF. A client can save it and email it back to you, or print it and  bring it along with them to a meeting with you. Please enter your name:  Please select an item from the combo/dropdown list: First Choice  Choice  1   Check all that apply:  Option 1  Option 2 Option 3 You can add fields within tables as well:  Name of Dependent  Age of Dependent ",
    "fields": []
  }
]
```
