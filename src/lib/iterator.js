import { getStartRowAndColumn } from "./utils";
class SudokuIterator {
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

    const { startRow, startColumn } = getStartRowAndColumn(
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

export default SudokuIterator;
