<template>
  <div class="container">
    <div class="button-container">
      <template v-if="!isEdit">
        <div>
          <label>延时(ms):</label>
          <input :value="delay" @input="onDelayInput" />
        </div>
        <div
          class="compute-button"
          :class="{ 'compute-button--disabled': isComputing }"
          @click="compute"
        >
          计算
        </div>
        <div class="compute-button" @click="reset">重置</div>
      </template>
      <div
        class="compute-button"
        :class="{
          'compute-button--disabled': isComputing,
        }"
        @click="onEdit"
      >
        {{ isEdit ? "确定" : "输入" }}
      </div>
      <div v-if="isEdit" class="compute-button" @click="onEditCancel">取消</div>
    </div>
    <div class="content">
      <template v-if="!isEdit">
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
          v-for="(arr, line) in sudokuRef.gridView.grids"
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
      </template>
      <template v-else>
        <div
          v-for="(arr, line) in numbers"
          :key="`line-${line}`"
          class="content-line"
        >
          <GridInput
            v-for="(item, colomn) in arr"
            :key="`grid-${line}-${colomn}`"
            :value="item"
            :line="line"
            :column="colomn"
            @change="onChange"
          />
        </div>
      </template>
    </div>
    <div
      class="message"
      :style="{
        color: messageColor,
      }"
    >
      {{ message }}
    </div>
  </div>
</template>

<script setup>
import GridItem from "./components/GridItem.vue";
import GridInput from "./components/GridInput.vue";
import Sudoku from "@/lib/sudoku";
import { reactive, ref } from "vue";
import { OperationType } from "@/lib/utils";
import { validateGrid } from "@/utils/index.js";

const numbers = ref([
  [3, 0, 0, 0, 0, 0, 9, 0, 0],
  [0, 0, 0, 0, 8, 0, 0, 0, 0],
  [0, 0, 0, 0, 1, 0, 0, 0, 0],
  [0, 8, 5, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 3, 0, 4, 7, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 7, 0, 0, 0, 1, 0],
  [0, 2, 0, 0, 5, 0, 0, 8, 0],
  [4, 0, 0, 0, 0, 0, 3, 0, 0],
]);

const moveFrame = (line, column, opType, number) => {
  location.line = line;
  location.column = column;
  switch (opType) {
    case OperationType.Remove:
      borderColor.value = "red";
      break;
    case OperationType.Assumption:
    case OperationType.BackTrack:
      borderColor.value = "orange";
      break;
    default:
      borderColor.value = "green";
      break;
  }

  switch (opType) {
    case OperationType.LastPossible:
      message.value = "唯一候选数：" + number;
      break;
    case OperationType.HiddenSingles:
      message.value = "隐形单一数：" + number;
      break;
    case OperationType.Assumption:
      message.value = "假定：" + number;
      break;
    case OperationType.BackTrack:
      message.value = "回退假定：" + number;
      break;
    case OperationType.Remove:
      message.value = "移除候选数：" + number;
      break;
  }
  messageColor.value = "black";
};

const message = ref("");
const messageColor = ref("black");
const isComputing = ref(false);
const borderColor = ref("transparent");
const isEdit = ref(false);
const delay = ref(1000);
const location = reactive({
  line: 0,
  column: 0,
});
let abortCtrl = new AbortController();

const cacheNumbers = localStorage.getItem("sudoku");
if (cacheNumbers) {
  try {
    numbers.value = JSON.parse(cacheNumbers);
  } catch (error) {
    // ignore
  }
}
const sudoku = new Sudoku(
  numbers.value,
  abortCtrl.signal,
  moveFrame,
  delay.value
);
const sudokuRef = ref(sudoku);

const onDelayInput = (event) => {
  // 只保留数字
  event.target.value = event.target.value.replace(/\D/g, "");
  delay.value = event.target.value;
  const num = Number(event.target.value);
  sudokuRef.value.delay = Number.isNaN(num) ? 10 : num;
};

async function compute() {
  if (isComputing.value) {
    return;
  }

  if (!sudokuRef.value.isValidated()) {
    message.value = "输入错误，请重新输入";
    messageColor.value = "red";
    return;
  }

  if (sudokuRef.value.isSuccess()) {
    message.value = "完成";
    messageColor.value = "green";
  }

  borderColor.value = "transparent";
  message.value = "";
  isComputing.value = true;
  try {
    await sudokuRef.value.compute();
    isComputing.value = false;
    if (sudokuRef.value.isSuccess()) {
      message.value = "完成";
      messageColor.value = "green";
    } else {
      message.value = "有错误";
      messageColor.value = "red";
    }
  } catch (error) {
    isComputing.value = false;
    console.log(error);
    message.value = error.message;
    messageColor.value = "red";
  }
}

const reset = () => {
  abortCtrl.abort(new Error("已取消"));
  abortCtrl = new AbortController();
  sudokuRef.value = new Sudoku(
    numbers.value,
    abortCtrl.signal,
    moveFrame,
    delay.value
  );
  isComputing.value = false;
  message.value = "";
  messageColor.value = "black";
};

const onEdit = () => {
  if (isComputing.value) {
    return;
  }

  isEdit.value = !isEdit.value;
  if (isEdit.value) {
    numbers.value = [
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
    ];
  } else {
    const msg = validateGrid(numbers.value);
    if (msg) {
      message.value = msg;
      messageColor.value = "red";
      isEdit.value = true;
    } else {
      message.value = "";
      sudokuRef.value.setNumbers(numbers.value);
      localStorage.setItem("sudoku", JSON.stringify(numbers.value));
    }
  }
};

const onEditCancel = () => {
  message.value = "";
  isEdit.value = false;
};

function onChange(value, row, col) {
  let num = Number(value);
  if (Number.isNaN(num)) {
    num = 0;
  }
  numbers.value[row][col] = num;
}
</script>

<style lang="scss" scoped>
.container {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  overflow-y: auto;
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
  gap: 20px;
  margin-bottom: 30px;

  input {
    width: 60px;
    height: 26px;
    margin-left: 4px;
  }
}

.compute-button {
  padding: 8px 0;
  font-size: 16px;
  background-color: #1377eb;
  color: white;
  border-radius: 8px;
  width: 100px;
  cursor: pointer;

  &--disabled {
    background-color: lightgray;
    cursor: not-allowed;
  }
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
  width: 60px;
  height: 60px;
  border: 3px solid transparent;
  box-sizing: border-box;
}
</style>
