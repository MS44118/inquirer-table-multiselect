const chalk = require("chalk");
const cliCursor = require("cli-cursor");
const figures = require("figures");
const Base = require("inquirer/lib/prompts/base");
const Choices = require("inquirer/lib/objects/choices");
const observe = require("inquirer/lib/utils/events");
const Paginator = require("inquirer/lib/utils/paginator");
const Table = require("cli-table");
const { map, takeUntil } = require("rxjs/operators");

class TablePrompt extends Base {
  /**
   * Initialise the prompt
   *
   * @param  {Object} questions
   * @param  {Object} rl
   * @param  {Object} answers
   */
  constructor(questions, rl, answers) {
    super(questions, rl, answers);

    if (!this.opt.columns) {
      this.throwParamError('columns');
    }

    if (!this.opt.rows) {
      this.throwParamError('rows');
    }

    this.pointer = 0;
    this.horizontalPointer = 0;

    this.columns = new Choices(this.opt.columns, []);
    this.rows = new Choices(this.opt.rows, []);
    this.multiple = this.opt.multiple || false;
    this.pageSize = this.opt.pageSize || 5;

    if (Array.isArray(this.opt.default)) {
      this.values = this.multiple
        ? this.rows.pluck('value').map((row, index) => this.opt.default[index] ? this.opt.default[index] : [])
        : this.rows.pluck('value').map((row, index) => this.opt.default[index][0] ? [this.opt.default[index][0]] : [] );
    } else {
      this.values = this.rows.pluck('value').map(() => []) ;
    }

    // Make sure no default is set (so it won't be printed)
    this.opt.default = null;
  }

  /**
   * Start the inquirer session
   *
   * @param  {Function} callback
   * @return {TablePrompt}
   */
  _run(callback) {
    this.done = callback;

    const events = observe(this.rl);
    const validation = this.handleSubmitEvents(
      events.line.pipe(map(this.getCurrentValue.bind(this)))
    );
    validation.success.forEach(this.onEnd.bind(this));
    validation.error.forEach(this.onError.bind(this));

    events.keypress.forEach(({ key }) => {
      switch (key.name) {
        case "left":
          return this.onLeftKey();

        case "right":
          return this.onRightKey();
      }
    });

    events.normalizedUpKey
      .pipe(takeUntil(validation.success))
      .forEach(this.onUpKey.bind(this));
    events.normalizedDownKey
      .pipe(takeUntil(validation.success))
      .forEach(this.onDownKey.bind(this));
    events.spaceKey
      .pipe(takeUntil(validation.success))
      .forEach(this.onSpaceKey.bind(this));

    if (this.rl.line) {
      this.onKeypress();
    }

    cliCursor.hide();
    this.render();

    return this;
  }

  getCurrentValue() {
    const currentValue = [];

    this.rows.forEach((row, rowIndex) => {
      currentValue.push(this.values[rowIndex]);
    });

    return currentValue;
  }

  onDownKey() {
    const length = this.rows.realLength;

    this.pointer = this.pointer < length - 1 ? this.pointer + 1 : this.pointer;
    this.render();
  }

  onEnd(state) {
    this.status = "answered";
    this.spaceKeyPressed = true;

    this.render();

    this.screen.done();
    cliCursor.show();
    this.done(state.value);
  }

  onError(state) {
    this.render(state.isValid);
  }

  onLeftKey() {
    const length = this.columns.realLength;

    this.horizontalPointer =
      this.horizontalPointer > 0
          ? this.horizontalPointer - 1
          : length - 1;
    this.render();
  }

  onRightKey() {
    const length = this.columns.realLength;

    this.horizontalPointer =
      this.horizontalPointer < length - 1 ? this.horizontalPointer + 1 : 0;
    this.render();
  }

  onSpaceKey() {
    const value = this.columns.get(this.horizontalPointer).value;

    const indexOfValue = this.values[this.pointer].indexOf(value);
    const hasValue = indexOfValue > -1;
    if (this.multiple) {
      if (hasValue) {
        this.values[this.pointer].splice(indexOfValue, 1);
      } else {
        this.values[this.pointer].push(value);
      }

    } else {
      this.values[this.pointer] = hasValue ? []: [value];
    }

    this.spaceKeyPressed = true;
    this.render();
  }

  onUpKey() {
    this.pointer = this.pointer > 0 ? this.pointer - 1 : this.pointer;
    this.render();
  }

  paginate() {
    const middleOfPage = Math.floor(this.pageSize / 2);
    const firstIndex = Math.max(0, this.pointer - middleOfPage);
    const lastIndex = Math.min(
      firstIndex + this.pageSize - 1,
      this.rows.realLength - 1
    );
    const lastPageOffset = this.pageSize - 1 - lastIndex + firstIndex;

    return [Math.max(0, firstIndex - lastPageOffset), lastIndex];
  }

  render(error) {
    let bottomContent = "";
    let message = this.getQuestion() +
      "(Press " +
      chalk.cyan.bold("<Space>") +
      " to select, " +
      chalk.cyan.bold("<Up and Down>") +
      " to move rows, " +
      chalk.cyan.bold("<Left and Right>") +
      " to move columns, " +
      chalk.cyan.bold("<Enter>") +
      " to confirm)";

    const [firstIndex, lastIndex] = this.paginate();
    const firstCellContent = chalk.reset.dim(`${firstIndex + 1}-${lastIndex + 1} of ${this.rows.realLength}`);
    const columnsHeaders = this.columns.pluck("name").map(name => chalk.reset.bold(name));
    const table = new Table({
      head: [firstCellContent].concat(columnsHeaders)
    });

    this.rows.forEach((row, rowIndex) => {
      if (rowIndex < firstIndex || rowIndex > lastIndex) return;

      const columnValues = [];

      this.columns.forEach((column, columnIndex) => {
        const isSelected =
          this.status !== "answered" &&
          this.pointer === rowIndex &&
          this.horizontalPointer === columnIndex;
        const value =
          this.values[rowIndex].includes(column.value)
            ? figures.radioOn
            : figures.radioOff;

        columnValues.push(
            isSelected
                ? `[ ${value} ]`
                : `  ${value}  `
        );
      });

      const chalkModifier =
        this.status !== "answered" && this.pointer === rowIndex
          ? chalk.reset.bold.cyan
          : chalk.reset;

      table.push({
        [chalkModifier(row.name)]: columnValues
      });
    });

    message += "\n\n" + table.toString();

    if (error) {
      bottomContent = chalk.red(">> ") + error;
    }

    this.screen.render(message, bottomContent);
  }
}

module.exports = TablePrompt;
