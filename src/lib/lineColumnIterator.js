class LineColumnIterator {
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

export default LineColumnIterator;
