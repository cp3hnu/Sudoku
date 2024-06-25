import Item from "./item.js";
import SudokuIterator from "./iterator.js";
import LineColumnIterator from "./lineColumnIterator.js";
import { difference } from "./set.js";
import {
  sleep,
  arrayEquals,
  getStartRowAndColumn,
  getEndRowAndColumn,
} from "./utils.js";

class ItemList {
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
    this.list = this.numbers.map((arr) => arr.map((x) => new Item(x)));
    this.listStack = [];
    this.itemStack = [];
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
    this.list = this.numbers.map((arr) => arr.map((x) => new Item(x)));
  }

  reset() {
    this.list = this.numbers.map((arr) => arr.map((x) => new Item(x)));
  }

  // 是否全部确定了值
  isCompleted() {
    const iterator = new LineColumnIterator(9, 9);
    for (const { row, column } of iterator) {
      const item = this.itemFor(row, column);
      if (!item.isSettled) {
        return false;
      }
    }
    return true;
  }

  // 未确定值的元素个数
  unsettledItemCount() {
    return this.list.reduce(
      (res1, arr) =>
        res1 + arr.reduce((res2, item) => res2 + (!item.isSettled ? 1 : 0), 0),
      0
    );
  }

  // 候选数的总数
  notesTotal() {
    return this.list.reduce(
      (res1, arr) =>
        res1 + arr.reduce((res2, item) => res2 + item.notes.length, 0),
      0
    );
  }

  validateLine() {
    for (let row = 0; row < 9; row++) {
      const arr = [...Array(9)].map(() => 0);
      for (let column = 0; column < 9; column++) {
        const item = this.itemFor(row, column);
        const index = item.value - 1;
        arr[index] += 1;
        if (arr[index] > 1) {
          return false;
        }
      }
    }
    return true;
  }

  validateColumn() {
    for (let column = 0; column < 9; column++) {
      const arr = [...Array(9)].map(() => 0);
      for (let row = 0; row < 9; row++) {
        const item = this.itemFor(row, column);
        const index = item.value - 1;
        arr[index] += 1;
        if (arr[index] > 1) {
          return false;
        }
      }
    }
    return true;
  }

  validateGrid() {
    for (let index = 0; index < 9; index++) {
      const startRow = Math.floor(index / 3) * 3;
      const startColumn = (index % 3) * 3;
      const arr = [...Array(9)].map(() => 0);
      for (let row = startRow; row < startRow + 3; row++) {
        for (let column = startColumn; column < startColumn + 3; column++) {
          const item = this.itemFor(row, column);
          const index = item.value - 1;
          arr[index] += 1;
          if (arr[index] > 1) {
            return false;
          }
        }
      }
    }
    return true;
  }

  // 全部确定了数值且验证通过
  validate() {
    return (
      this.isCompleted() &&
      this.validateLine() &&
      this.validateColumn() &&
      this.validateGrid()
    );
  }

  getNumbers() {
    return this.list.map((arr) =>
      arr.map((item) => (item.isSettled ? item.value : [...item.notes]))
    );
  }

  itemFor(row, column) {
    return this.list[row][column];
  }

  async compute() {
    if (this.isCompleted()) {
      return;
    }
    await this.lastPossibleNumber();
    let preCount = 0;
    let nextCount = this.unsettledItemCount();
    while (!this.isCompleted() && preCount !== nextCount) {
      preCount = nextCount;
      await this.hiddenSingles();
      nextCount = this.unsettledItemCount();
    }

    preCount = 0;
    nextCount = this.notesTotal();
    while (!this.isCompleted() && preCount !== nextCount) {
      preCount = nextCount;
      await this.obviousPairs();
      nextCount = this.notesTotal();
    }

    await this.assumption();
  }

  // 唯一候选数
  async lastPossibleNumber() {
    const iterator = new LineColumnIterator(9, 9);
    for (const { row, column } of iterator) {
      const item = this.itemFor(row, column);
      if (!item.isSettled) {
        await this.setItemNotes(row, column);
      }
    }
  }

  // 通过关联位置的值，设置某个位置的候选值，如果候选值只有一个，则该位置的值是确定的
  async setItemNotes(row, column) {
    const arr = [...Array(9)].map(() => 0);
    const iterator = new SudokuIterator(row, column);
    for (const { row: r, column: c } of iterator) {
      const item = this.itemFor(r, c);
      const number = item.value;
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
    const item = this.itemFor(row, column);
    this.callback?.(row, column);
    if (notes.length === 1) {
      const settedValue = notes[0];
      await this.itemHaveSettled(row, column, settedValue);
    } else {
      await sleep(this.delay);
      item.notes = notes;
    }
  }

  // 当一个位置确定了值，修改行、列、宫格其它位置的候选值
  async itemHaveSettled(row, column, number) {
    await sleep(this.delay);
    const item = this.itemFor(row, column);
    item.value = number;
    item.notes = [];
    const iterator = new SudokuIterator(row, column);
    for (const { row: r, column: c } of iterator) {
      await this.removeItemNotesValue(r, c, number);
    }
  }

  // 当一个位置的值确定下来后，移除关联位置的候选值
  async removeItemNotesValue(row, column, number) {
    const item = this.itemFor(row, column);
    if (!item.isSettled && item.hasNotesValue(number)) {
      this.callback?.(row, column);
      await sleep(this.delay);
      item.removeValueFromNotes(number);
      if (item.notes.length === 1) {
        const settedValue = item.notes[0];
        await this.itemHaveSettled(row, column, settedValue);
      }
    }
  }

  // ------------------------------------------------- 分割线 -------------------------------------------------

  // 隐性单一数
  // 通过判断各个位置的候选数，找到候选数是唯一的位置
  async hiddenSingles() {
    const iterator = new LineColumnIterator(9, 9);
    for (const { row, column } of iterator) {
      const item = this.itemFor(row, column);
      if (!item.isSettled) {
        this.fixItemByDifference(row, column);
      }
    }
  }

  // 如果一个位置的某个候选值，不存在于所有其它关联位置候选值中，则这个位置可以确定是这个值
  async fixItemByDifference(row, column) {
    const set = new Set();
    // 行
    for (let r = 0; r < 9; r++) {
      const item = this.itemFor(r, column);
      if (r !== row && !item.isSettled) {
        item.notes.forEach(set.add, set);
      }
    }
    let result = await this.differenceItemNotes(row, column, set);
    if (result) {
      return;
    }

    // 列
    set.clear();
    for (let c = 0; c < 9; c++) {
      const item = this.itemFor(row, c);
      if (c !== column && !item.isSettled) {
        item.notes.forEach(set.add, set);
      }
    }
    result = await this.differenceItemNotes(row, column, set);
    if (result) {
      return;
    }

    // 宫格
    set.clear();
    const { startRow, startColumn } = getStartRowAndColumn(row, column);
    for (let r = startRow; r < startRow + 3; r++) {
      for (let c = startColumn; c < startColumn + 3; c++) {
        const item = this.itemFor(r, c);
        if ((r !== row || c !== column) && !item.isSettled) {
          item.notes.forEach(set.add, set);
        }
      }
    }

    await this.differenceItemNotes(row, column, set);
  }

  // 计算集合的差集
  async differenceItemNotes(row, column, set) {
    const item = this.itemFor(row, column);
    const notes = new Set(item.notes);
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
    const iterator = new LineColumnIterator(9, 9);
    for (const { row, column } of iterator) {
      const item = this.itemFor(row, column);
      if (!item.isSettled && item.notes.length === 2) {
        await this.findSameNotes(row, column, item.notes);
      }
    }
  }

  async findSameNotes(row, column, notes) {
    // 行
    let count = 1;
    let totalCnt = notes.length;
    const columns = [column];
    for (let c = column + 1; c < 9; c++) {
      const item = this.itemFor(row, c);
      if (arrayEquals(item.notes, notes)) {
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
      const item = this.itemFor(r, column);
      if (arrayEquals(item.notes, notes)) {
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
    const { startColumn } = getStartRowAndColumn(row, column);
    const { endRow, endColumn } = getEndRowAndColumn(row, column);
    let nextColumn = column + 1;
    for (let r = row; r <= endRow; r++) {
      for (let c = nextColumn; c <= endColumn; c++) {
        const item = this.itemFor(r, c);
        if (arrayEquals(item.notes, notes)) {
          locations.push({ row: r, column: c });
          count += 1;
          if (count === totalCnt) {
            await this.removeSameGridNotes(row, column, locations, notes);
            break;
          }
        }
      }
      nextColumn = startColumn;
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
    const { startRow, startColumn } = getStartRowAndColumn(row, column);
    for (let r = startRow; r < startRow + 3; r++) {
      for (let c = startColumn; c < startColumn + 3; c++) {
        const index = locations.findIndex((v) => v.row === r && v.column === c);
        if (index === -1) {
          await this.removeItemNotesValues(r, c, notes);
        }
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
    const nextItem = this.findNextItem();
    if (!nextItem) {
      console.log("没有只有两个候选数的格子了, 可以扩展程序，遇到这种情况再说");
      return;
    }
    const { row, column, notes } = nextItem;
    const value = notes[0];
    this.listStack.push(this.getNumbers());
    this.itemStack.push({
      ...nextItem,
      value,
    });
    console.log("pick", row, column, value);
    await this.itemHaveSettled(row, column, value);
    await this.assumptionPushOrPop();
  }

  async assumptionPop() {
    const item = this.itemStack.pop();
    const numbers = this.listStack.pop();
    if (!item || !numbers) {
      return;
    }

    const { row, column, notes } = item;
    const value = notes[1];
    this.list = numbers.map((arr) =>
      arr.map((x) => {
        if (typeof x === "number") {
          return new Item(x);
        } else {
          const item = new Item(0);
          item.notes = x;
          return item;
        }
      })
    );
    console.log("back-pick", row, column, value);
    await this.itemHaveSettled(row, column, value);
    await this.assumptionPushOrPop();
  }

  async assumptionPushOrPop() {
    if (!this.isCompleted()) {
      await this.assumptionPush();
    } else if (this.isCompleted() && !this.validate()) {
      await this.assumptionPop();
    }
  }

  findNextItem() {
    const iterator = new LineColumnIterator(9, 9);
    for (const { row, column } of iterator) {
      const item = this.itemFor(row, column);
      if (!item.isSettled && item.notes.length === 2) {
        return {
          row,
          column,
          notes: [...item.notes],
        };
      }
    }
    return null;
  }
}

export default ItemList;
