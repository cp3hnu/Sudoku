class Item {
  constructor(number) {
    this.value = number;
    this.notes = [];
  }

  get isSettled() {
    return this.value !== 0;
  }

  removeValueFromNotes(value) {
    const index = this.notes.indexOf(value);
    if (index !== -1) {
      this.notes.splice(index, 1);
      return true;
    }
    return false;
  }

  hasNotesValue(value) {
    const index = this.notes.indexOf(value);
    return index !== -1;
  }
}

export default Item;
