class Grid {
  constructor(number) {
    // 确定的值
    this.value = number;
    // 候选数组
    this.notes = [];
  }

  // 是否已经确定了值
  get isSettled() {
    return this.value !== 0;
  }

  /**
   * 候选数组中是否存在 value 值
   * @param {number} value
   * @returns {boolean} 存在返回 true，不存在返回 false
   */
  hasNotesValue(value) {
    const index = this.notes.indexOf(value);
    return index !== -1;
  }

  /**
   * 从候选数组中删除 value 值
   * @param {number} value
   * @returns {boolean} 候选数组中存在 value 值则返回 true，不存在返回 false
   */
  removeValueFromNotes(value) {
    const index = this.notes.indexOf(value);
    if (index !== -1) {
      this.notes.splice(index, 1);
      return true;
    }
    return false;
  }
}

export default Grid;
