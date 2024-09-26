import Grid from "./grid.js";
import { RowColumnIterator, IndexGridIterator } from "./iterator.js";

const add = (a, b) => a + b;

export default class GridView {
  constructor(numbers) {
    this.grids = numbers.map((arr) =>
      arr.map((item) => {
        if (typeof item === "number") {
          return new Grid(item);
        } else if (Array.isArray(item)) {
          const grid = new Grid(0);
          grid.notes = [...item];
          return grid;
        } else {
          throw new Error("二维数组不正确");
        }
      })
    );
  }

  get(row, column) {
    return this.grids[row][column];
  }

  map(callback) {
    return this.grids.map((row, rowIndex) => {
      return row.map((value, columnIndex) => {
        return callback(value, rowIndex, columnIndex);
      });
    });
  }

  reduce(rowCallbackFn, colCallbackFn, rowInitialValue, colInitialValue) {
    return this.grids.reduce(
      (res, arr, ...rest) =>
        rowCallbackFn(res, arr.reduce(colCallbackFn, colInitialValue), ...rest),
      rowInitialValue
    );
  }

  // 未确定值的格子个数
  unsettledItemCount() {
    return this.reduce(
      add,
      (res, item) => res + (!item.isSettled ? 1 : 0),
      0,
      0
    );
  }

  // 所有格子候选值的总数
  notesTotal() {
    return this.reduce(add, (res, item) => res + item.notes.length, 0, 0);
  }

  // 获取格子的确定值或者候选值组成二维数组
  getNumbers() {
    return this.map((item) => (item.isSettled ? item.value : [...item.notes]));
  }

  // 验证行有没有错误
  isRowValidated() {
    for (let row = 0; row < 9; row++) {
      const arr = [...Array(9)].fill(0);
      for (let column = 0; column < 9; column++) {
        const item = this.get(row, column);
        const index = item.value - 1;
        if (index >= 0) {
          arr[index] += 1;
        }
        if (arr[index] > 1) {
          return false;
        }
      }
    }
    return true;
  }

  // 验证列有没有错误
  isColumnValidated() {
    for (let column = 0; column < 9; column++) {
      const arr = [...Array(9)].fill(0);
      for (let row = 0; row < 9; row++) {
        const item = this.get(row, column);
        const index = item.value - 1;
        if (index >= 0) {
          arr[index] += 1;
        }
        if (arr[index] > 1) {
          return false;
        }
      }
    }
    return true;
  }

  // 验证宫格有没有错误
  isGridValidated() {
    for (let grid = 0; grid < 9; grid++) {
      const arr = [...Array(9)].fill(0);
      const iterator = new IndexGridIterator(grid);
      for (const { row, column } of iterator) {
        const item = this.get(row, column);
        const index = item.value - 1;
        if (index >= 0) {
          arr[index] += 1;
        }
        if (arr[index] > 1) {
          return false;
        }
      }
    }
    return true;
  }

  // 是否行、列、宫格全部验证通过
  isValidated() {
    return (
      this.isRowValidated() &&
      this.isColumnValidated() &&
      this.isGridValidated()
    );
  }

  // 是否全部确定了值
  isCompleted() {
    const iterator = new RowColumnIterator(9, 9);
    for (const { row, column } of iterator) {
      const item = this.get(row, column);
      if (!item.isSettled) {
        return false;
      }
    }
    return true;
  }

  // 是否运行成功
  isSuccess() {
    return this.isCompleted() && this.isValidated();
  }
}
