import GridView from "./gridView.js";
import {
  SudokuIterator,
  RowColumnIterator,
  CurrentGridIterator,
} from "./iterator.js";
import { difference } from "./set.js";
import { sleep, arrayEquals, LocationType } from "./utils.js";

class Sudoku {
  constructor(numbers, callback = null, delay = 0) {
    if (typeof numbers[0] === "string") {
      const array = numbers.map((str) =>
        str.split("").map((ch) => parseInt(ch))
      );
      this.numbers = array;
    } else {
      this.numbers = numbers;
    }
    this.callback = callback;
    this.delay = delay;
    this.listStack = [];
    this.itemStack = [];
    this.gridView = new GridView(this.numbers);
  }

  setNumbers(numbers) {
    if (typeof numbers[0] === "string") {
      const array = numbers.map((str) =>
        str.split("").map((ch) => parseInt(ch))
      );
      this.numbers = array;
    } else {
      this.numbers = numbers;
    }
    this.gridView = new GridView(this.numbers);
  }

  reset() {
    this.gridView = new GridView(this.numbers);
  }

  isCompleted() {
    return this.gridView.isCompleted();
  }

  isValidated() {
    return this.gridView.isValidated();
  }

  isSuccess() {
    return this.gridView.isSuccess();
  }

  gridFor(row, colum) {
    return this.gridView.get(row, colum);
  }

  async compute() {
    if (this.isCompleted()) {
      return;
    }
    await this.lastPossibleNumber();
    let preCount = 0;
    let nextCount = this.gridView.unsettledItemCount();
    while (!this.isCompleted() && preCount !== nextCount) {
      preCount = nextCount;
      await this.hiddenSingles();
      nextCount = this.gridView.unsettledItemCount();
    }

    preCount = 0;
    nextCount = this.gridView.notesTotal();
    while (!this.isCompleted() && preCount !== nextCount) {
      preCount = nextCount;
      await this.obviousPairs();
      nextCount = this.gridView.notesTotal();
    }

    await this.assumption();
  }

  // 唯一候选数
  async lastPossibleNumber() {
    const iterator = new RowColumnIterator(9, 9);
    for (const { row, column } of iterator) {
      const grid = this.gridFor(row, column);
      if (!grid.isSettled) {
        await this.setGridNotes(row, column);
      }
    }
  }

  // 通过关联位置的值，设置某个位置的候选值，如果候选值只有一个，则该位置的值是确定的
  async setGridNotes(row, column) {
    const arr = [...Array(9)].fill(0);
    const iterator = new SudokuIterator(row, column);
    for (const { row: r, column: c } of iterator) {
      const grid = this.gridFor(r, c);
      const number = grid.value;
      if (number !== 0) {
        arr[number - 1] = 1;
      }
    }

    const notes = [];
    arr.forEach((value, index) => {
      if (value === 0) {
        notes.push(index + 1);
      }
    });
    const grid = this.gridFor(row, column);
    if (notes.length === 1) {
      const settedValue = notes[0];
      await this.itemHaveSettled(row, column, settedValue);
    } else {
      await sleep(10);
      grid.notes = notes;
    }
  }

  // 当一个位置确定了值，修改行、列、宫格其它位置的候选值
  async itemHaveSettled(row, column, number) {
    this.callback?.(row, column, LocationType.Settle);
    await sleep(this.delay);
    const grid = this.gridFor(row, column);
    grid.value = number;
    grid.notes = [];
    const iterator = new SudokuIterator(row, column);
    for (const { row: r, column: c } of iterator) {
      await this.removeItemNotesValue(r, c, number);
    }
  }

  // 当一个位置的值确定下来后，移除关联位置的候选值
  async removeItemNotesValue(row, column, number) {
    const grid = this.gridFor(row, column);
    if (!grid.isSettled && grid.hasNotesValue(number)) {
      this.callback?.(row, column, LocationType.Remove);
      await sleep(this.delay);
      grid.removeValueFromNotes(number);
      if (grid.notes.length === 1) {
        const settedValue = grid.notes[0];
        await this.itemHaveSettled(row, column, settedValue);
      }
    }
  }

  // ------------------------------------------------- 分割线 -------------------------------------------------

  // 隐性单一数
  // 通过判断各个位置的候选数，找到候选数是唯一的位置
  async hiddenSingles() {
    const iterator = new RowColumnIterator(9, 9);
    for (const { row, column } of iterator) {
      const grid = this.gridFor(row, column);
      if (!grid.isSettled) {
        await this.fixItemByDifference(row, column);
      }
    }
  }

  // 如果一个位置的某个候选值，不存在于所有其它关联位置候选值中，则这个位置可以确定是这个值
  async fixItemByDifference(row, column) {
    const set = new Set();
    // 行
    for (let r = 0; r < 9; r++) {
      const grid = this.gridFor(r, column);
      if (r !== row && !grid.isSettled) {
        grid.notes.forEach(set.add, set);
      }
    }
    let result = await this.differenceItemNotes(row, column, set);
    if (result) {
      return;
    }

    // 列
    set.clear();
    for (let c = 0; c < 9; c++) {
      const grid = this.gridFor(row, c);
      if (c !== column && !grid.isSettled) {
        grid.notes.forEach(set.add, set);
      }
    }
    result = await this.differenceItemNotes(row, column, set);
    if (result) {
      return;
    }

    // 宫格
    set.clear();
    const iterator = new CurrentGridIterator(row, column);
    for (const { row: r, column: c } of iterator) {
      const grid = this.gridFor(r, c);
      if ((r !== row || c !== column) && !grid.isSettled) {
        grid.notes.forEach(set.add, set);
      }
    }

    await this.differenceItemNotes(row, column, set);
  }

  // 计算集合的差集
  async differenceItemNotes(row, column, set) {
    const grid = this.gridFor(row, column);
    const notes = new Set([...grid.notes]);
    const differenceSet = difference(notes, set);
    if (differenceSet.size === 1) {
      const settedValue = [...differenceSet][0];
      await this.itemHaveSettled(row, column, settedValue);
      return true;
    }
    return false;
  }

  // ------------------------------------------------- 分割线 -------------------------------------------------

  // 显性数对
  // 当一行、一列、一个宫格存在两格有相同的两个候选数时，可以清除其他位置的这两个候选数
  // 可以扩展成判断3个格子3个数相等
  async obviousPairs() {
    const iterator = new RowColumnIterator(9, 9);
    for (const { row, column } of iterator) {
      const grid = this.gridFor(row, column);
      if (!grid.isSettled && grid.notes.length === 2) {
        await this.findSameNotes(row, column, grid.notes);
      }
    }
  }

  async findSameNotes(row, column, notes) {
    // 行
    let count = 1;
    let totalCnt = notes.length;
    const columns = [column];
    for (let c = column + 1; c < 9; c++) {
      const grid = this.gridFor(row, c);
      if (arrayEquals(grid.notes, notes)) {
        columns.push(c);
        count += 1;
        if (count === totalCnt) {
          await this.removeSameLineNotes(row, columns, notes);
          break;
        }
      }
    }

    // 列
    count = 1;
    const rows = [row];
    for (let r = row + 1; r < 9; r++) {
      const grid = this.gridFor(r, column);
      if (arrayEquals(grid.notes, notes)) {
        rows.push(r);
        count += 1;
        if (count === totalCnt) {
          await this.removeSameColumnNotes(column, rows, notes);
          break;
        }
      }
    }

    // 宫格
    count = 1;
    const locations = [{ row, column }];
    const iterator = new CurrentGridIterator(row, column, true);
    for (const { row: r, column: c } of iterator) {
      const grid = this.gridFor(r, c);
      if (arrayEquals(grid.notes, notes)) {
        locations.push({ row: r, column: c });
        count += 1;
        if (count === totalCnt) {
          await this.removeSameGridNotes(row, column, locations, notes);
          break;
        }
      }
    }
  }

  async removeSameLineNotes(row, columns, notes) {
    for (let c = 0; c < 9; c++) {
      if (columns.indexOf(c) === -1) {
        await this.removeItemNotesValues(row, c, notes);
      }
    }
  }

  async removeSameColumnNotes(column, rows, notes) {
    for (let r = 0; r < 9; r++) {
      if (rows.indexOf(r) === -1) {
        await this.removeItemNotesValues(r, column, notes);
      }
    }
  }

  async removeSameGridNotes(row, column, locations, notes) {
    const iterator = new CurrentGridIterator(row, column);
    for (const { row: r, column: c } of iterator) {
      const index = locations.findIndex((v) => v.row === r && v.column === c);
      if (index === -1) {
        await this.removeItemNotesValues(r, c, notes);
      }
    }
  }

  async removeItemNotesValues(row, column, numbers) {
    for (const number of numbers) {
      await this.removeItemNotesValue(row, column, number);
    }
  }

  // ------------------------------------------------- 分割线 -------------------------------------------------

  // 假定法，暴力破解
  async assumption() {
    await this.assumptionPush();
  }

  async assumptionPush() {
    const nextGrid = this.findNextGrid();
    const { row, column, notes } = nextGrid;
    const value = notes[0];
    const numbers = this.gridView.getNumbers();
    this.listStack.push(numbers);
    this.itemStack.push({
      ...nextGrid,
      index: 0,
    });
    console.log("pick", row, column, value);
    await this.itemHaveSettled(row, column, value);
    await this.assumptionPushOrPop();
  }

  async assumptionPop() {
    const grid = this.itemStack.pop();
    const numbers = this.listStack.pop();
    if (!grid || !numbers) {
      return;
    }

    const { row, column, notes } = grid;
    const index = grid.index + 1;
    const value = notes[index];

    if (index < notes.length - 1) {
      this.listStack.push(numbers);
      this.itemStack.push({
        ...grid,
        index,
      });
    }

    this.gridView = new GridView(numbers);
    console.log("back-pick", row, column, value);
    await this.itemHaveSettled(row, column, value);
    await this.assumptionPushOrPop();
  }

  async assumptionPushOrPop() {
    if (!this.isValidated()) {
      await this.assumptionPop();
    } else if (!this.isCompleted()) {
      await this.assumptionPush();
    }
  }

  findNextGrid() {
    const iterator = new RowColumnIterator(9, 9);
    let min = 9,
      minRow = 0,
      minCol = 0,
      notes = [];
    for (const { row, column } of iterator) {
      const grid = this.gridFor(row, column);
      if (!grid.isSettled && grid.notes.length < min) {
        minRow = row;
        minCol = column;
        notes = [...grid.notes];
        min = grid.notes.length;
      }
    }
    return {
      row: minRow,
      column: minCol,
      notes: notes,
    };
  }
}

export default Sudoku;
