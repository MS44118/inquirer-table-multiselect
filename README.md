# inquirer-table-multiselect [![npm version](https://badge.fury.io/js/inquirer-table-multiselect.svg)](https://badge.fury.io/js/inquirer-table-multiselect)

> A multiselect table-like prompt for [Inquirer.js](https://github.com/SBoudrias/Inquirer.js)
>
> Forked from [inquirer-table-prompt](https://github.com/eduardoboucas/inquirer-table-prompt) by Eduardo Bouças, and inspired from [inquirer-tree-prompt](https://github.com/insightfuls/inquirer-tree-prompt) by Ben Schmidt.

[![asciicast](https://asciinema.org/a/CmqHsisxc0OcJddBfIXSWGMvz.svg)](https://asciinema.org/a/CmqHsisxc0OcJddBfIXSWGMvz)

## Installation

```
npm install --save inquirer-table-multiselect
```

## Options

- `columns`: Array of options to display as columns. Follows the same format as Inquirer's `choices`
- `rows`: Array of options to display as rows. Follows the same format as Inquirer's `choices`
- `default`: (Array of Arrays) Array of default values should fit the same length as rows. Default: empty Array. If multiple is false, takes the first item.
- `multiple`: (Boolean) if true, will enable to select multiple items. Default: false.
- `pageSize`: (Number) Number of rows to display per page

## Usage

After registering the prompt, set your question with `type: "table-multiselect"`.

The result will be an array of arrays with the selected values for each row.

```js
import inquirer from "inquirer";
import InquirerTableMultiselect from "inquirer-table-multiselect";

inquirer.registerPrompt("table-multiselect", InquirerTableMultiselect);

const rows = [
    'Friday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
];

inquirer
    .prompt([
        {
            type: 'table-multiselect',
            name: 'mealPlan',
            message: 'What do you want to eat next week ? ',
            columns: [
                {name: 'fries', value: 'fries'},
                {name: 'potatoes', value: 'potatoes'},
                {name: 'tomatoes', value: 'tomatoes'},
                {name: 'burger', value: 'burger'},
                {name: 'wrap', value: 'wrap'},
                {name: 'wings', value: 'wings'},
                {name: 'ketchup', value: 'ketchup'},
                {name: 'mustard', value: 'mustard'},
            ],
            rows: rows,
            default: rows.map(() => ['fries', 'burger', 'ketchup']),
            multiple: true,
            pageSize: 20,
        }
    ])
  .then(answers => {
    console.log(answers);
/*
      {
          mealPlan: [
              ['fries', 'burger', 'mustard'],
              ['potatos', 'burger', 'ketchup'],
              ['tomatoes', 'wrap'],
              [],
              ['fries', 'burger', 'ketchup'],
              [],
              ['fries', 'wings'],
          ]
      }
*/
  });
```

