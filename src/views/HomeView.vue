<template>
  <div class="container">
    <div class="button-container">
      <div class="compute-button" @click="compute">计算</div>
      <div class="compute-button" @click="reset">重置</div>
    </div>
    <div class="content">
      <div
        class="location"
        :style="{
          top: location.line * 60 + 'px',
          left: location.column * 60 + 'px',
          borderColor: borderColor,
          visibility: isComputing ? 'visible' : 'hidden',
        }"
      ></div>
      <div
        v-for="(arr, line) in listRef.gridView.grids"
        :key="`line-${line}`"
        class="content-line"
      >
        <GridItem
          v-for="(item, colomn) in arr"
          :key="`grid-${line}-${colomn}`"
          :item="item"
          :line="line"
          :column="colomn"
        />
      </div>
    </div>
    <div
      class="message"
      :class="isSuccess ? 'message--success' : 'message--error'"
    >
      {{ message }}
    </div>
  </div>
</template>

<script setup>
/* eslint-disable */
import GridItem from "./components/GridItem.vue";
import Sudoku from "@/lib/sudoku";
import { reactive, ref } from "vue";
import { LocationType } from "@/lib/utils"

// const numbers = [
//   [0, 9, 0, 3, 8, 5, 0, 6, 0],
//   [6, 0, 5, 0, 0, 0, 3, 0, 1],
//   [0, 4, 0, 0, 6, 1, 0, 2, 0],
//   [9, 0, 6, 7, 0, 8, 0, 0, 2],
//   [8, 0, 3, 0, 0, 0, 9, 0, 6],
//   [2, 0, 0, 1, 0, 6, 7, 0, 3],
//   [0, 3, 0, 6, 1, 0, 0, 7, 0],
//   [4, 0, 9, 0, 0, 0, 1, 0, 8],
//   [0, 2, 0, 8, 5, 9, 0, 3, 0],
// ];

// const numbers = [
//   [8, 1, 0, 5, 6, 0, 2, 0, 0],
//   [0, 0, 0, 0, 7, 0, 0, 0, 3],
//   [0, 0, 6, 0, 0, 0, 0, 0, 0],
//   [9, 6, 0, 0, 5, 0, 0, 7, 0],
//   [0, 0, 4, 0, 0, 0, 9, 0, 0],
//   [0, 0, 2, 6, 0, 0, 0, 0, 0],
//   [5, 9, 0, 1, 0, 0, 8, 0, 0],
//   [0, 0, 0, 0, 0, 8, 0, 2, 0],
//   [4, 0, 0, 0, 0, 0, 0, 0, 0],
// ];

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


// const numbers = [
//   "630100000",
//   "200036080",
//   "000400006",
//   "090062007",
//   "007000010",
//   "000004000",
//   "800000500",
//   "000300000",
//   "020097001",
// ];

const location = reactive({
  line: 0,
  column: 0
});

const borderColor = ref("transparent");

const callback = (line, column, type) => {
  location.line = line;
  location.column = column;
  borderColor.value = type === LocationType.Settle ? "green" : "red"
}

const itemList = new Sudoku(numbers, callback, 10);
const listRef = reactive(itemList);
const message = ref("");
const isSuccess = ref(true)
const isComputing = ref(false)

async function compute() {
  isComputing.value = true;
  await listRef.compute();
  isComputing.value = false;
  if (listRef.isSuccess()) {
    message.value = "完成"
    isSuccess.value = true
  } else {
    message.value = "有错误"
    isSuccess.value = false
  }
}

const reset = () => {
  listRef.reset();
  message.value = ""
}
</script>

<style lang="scss" scoped>
.container {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.content {
  width: 540px;
  height: 540px;
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  border: 2px solid black;
  position: relative;
}
.content-line {
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
}
.button-container {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 30px;
}
.compute-button {
  padding: 8px 0;
  font-size: 16px;
  background-color: #1377eb;
  color: white;
  border-radius: 8px;
  width: 100px;
  cursor: pointer;
}
.message {
  font-size: 20px;
  margin-top: 20px;
  height: 24px;
}
.message--success {
  color: #40bd48;
}
.message--error {
  color: #ff3e00;
}
.location {
  position: absolute;
  width: 50px;
  height: 50px;
  border: 3px solid transparent;
  box-sizing: border-box;
}
</style>
