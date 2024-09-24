import { getGridStartRowColumn, getGridEndRowColumn } from "./utils.js";
export class SudokuIterator {
  constructor(row, column) {
    this.row = row;
    this.column = column;
  }

  *[Symbol.iterator]() {
    for (let i = 0; i < 9; i++) {
      yield { row: this.row, column: i };
    }
    for (let i = 0; i < 9; i++) {
      yield { row: i, column: this.column };
    }

    const { startRow, startColumn } = getGridStartRowColumn(
      this.row,
      this.column
    );
    for (let i = startRow; i < startRow + 3; i++) {
      for (let j = startColumn; j < startColumn + 3; j++) {
        yield { row: i, column: j };
      }
    }
  }
}

export class RowColumnIterator {
  constructor(lNumber, cNumber) {
    this.lNumber = lNumber;
    this.cNumber = cNumber;
  }

  *[Symbol.iterator]() {
    for (let row = 0; row < this.lNumber; row++) {
      for (let column = 0; column < this.cNumber; column++) {
        yield { row, column };
      }
    }
  }
}

export class IndexGridIterator {
  constructor(index) {
    this.startRow = Math.floor(index / 3) * 3;
    this.startColumn = (index % 3) * 3;
    this.endRow = this.startRow + 3;
    this.endColumn = this.startColumn + 3;
  }

  *[Symbol.iterator]() {
    for (let row = this.startRow; row < this.endRow; row++) {
      for (let column = this.startColumn; column < this.endColumn; column++) {
        yield { row, column };
      }
    }
  }
}

export class CurrentGridIterator {
  constructor(curRow, curColumn, afterCurrent = false) {
    const { startRow, startColumn } = getGridStartRowColumn(curRow, curColumn);
    const { endRow, endColumn } = getGridEndRowColumn(curRow, curColumn);
    this.startRow = !afterCurrent ? startRow : curRow;
    this.startColumn = startColumn;
    this.nextColumn = !afterCurrent ? startColumn : curColumn + 1;
    this.endRow = endRow;
    this.endColumn = endColumn;
    this.afterCurrent = afterCurrent;
  }

  *[Symbol.iterator]() {
    for (let row = this.startRow; row <= this.endRow; row++) {
      for (let column = this.nextColumn; column <= this.endColumn; column++) {
        yield { row, column };
      }
      if (this.afterCurrent) {
        this.nextColumn = this.startColumn;
      }
    }
  }
}
