import ItemList from "./itemList.js";

const numbers = [
  [0, 9, 0, 3, 8, 5, 0, 6, 0],
  [6, 0, 5, 0, 0, 0, 3, 0, 1],
  [0, 4, 0, 0, 6, 1, 0, 2, 0],
  [9, 0, 6, 7, 0, 8, 0, 0, 2],
  [8, 0, 3, 0, 0, 0, 9, 0, 6],
  [2, 0, 0, 1, 0, 6, 7, 0, 3],
  [0, 3, 0, 6, 1, 0, 0, 7, 0],
  [4, 0, 9, 0, 0, 0, 1, 0, 8],
  [0, 2, 0, 8, 5, 9, 0, 3, 0],
];

const list = new ItemList(numbers);

list.compute();
if (list.validate()) {
  console.log(list.getNumbers());
}
