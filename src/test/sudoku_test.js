import Sudoku from "../lib/sudoku.js";

const numbers = [
  [3, 0, 0, 0, 0, 0, 9, 0, 0],
  [0, 0, 0, 0, 8, 0, 0, 0, 0],
  [0, 0, 0, 0, 1, 0, 0, 0, 0],
  [0, 8, 5, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 3, 0, 4, 7, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 7, 0, 0, 0, 1, 0],
  [0, 2, 0, 0, 5, 0, 0, 8, 0],
  [4, 0, 0, 0, 0, 0, 3, 0, 0],
];

const list = new Sudoku(numbers);

list.compute();
if (list.isSuccess()) {
  console.log("Correct");
  console.log(list.getNumbers());
} else {
  console.log("Wrong");
  console.log(list.getNumbers());
}