<template>
  <div class="container">
    <div class="center">
      <div class="button-container">
        <template v-if="!isEdit">
          <div
            class="button button--primary"
            :class="{ 'button--disabled': isComputing }"
            @click="compute"
          >
            计算
          </div>
          <div class="button button--stop" @click="reset">重置</div>
          <div
            class="button button--input"
            :class="{
              'button--disabled': isComputing,
            }"
            @click="onInput"
          >
            输入
          </div>
          <div
            class="button button--edit"
            :class="{
              'button--disabled': isComputing,
            }"
            @click="onEdit"
          >
            修改
          </div>
        </template>
        <template v-else>
          <div class="button button--primary" @click="onEditConfirm">确定</div>
          <div class="button" @click="onEditCancel">取消</div>
        </template>
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
            v-for="(arr, line) in inputNumbers"
            :key="`line-${line}`"
            class="content-line"
          >
            <GridInput
              v-for="(item, colomn) in arr"
              :key="`grid-${line}-${colomn}`"
              :id="`grid-${line}-${colomn}`"
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
    <div class="setting" v-if="!isEdit">
      <div class="title">程序配置:</div>
      <div>
        <label for="delay">单步延时(ms):</label>
        <input :value="delay" id="delay" @input="onDelayInput" />
      </div>
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

let numbers = [
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
const message = ref("");
const messageColor = ref("black");
const isComputing = ref(false);
const borderColor = ref("transparent");
const isEdit = ref(false);
const delay = ref(1);
const inputNumbers = ref([]);
const location = reactive({
  line: 0,
  column: 0,
});
let abortCtrl = new AbortController();

const cacheNumbers = localStorage.getItem("sudoku");
if (cacheNumbers) {
  try {
    numbers = JSON.parse(cacheNumbers);
  } catch (error) {
    // ignore
  }
}
const sudoku = new Sudoku(numbers, abortCtrl.signal, moveFrame, delay.value);
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
    if (error.message.includes("已取消")) {
      message.value = "已取消";
    } else {
      message.value = error.message;
    }
    messageColor.value = "red";
  }
}

const reset = () => {
  abortCtrl.abort(new Error("已取消"));
  abortCtrl = new AbortController();
  sudokuRef.value = new Sudoku(
    numbers,
    abortCtrl.signal,
    moveFrame,
    delay.value
  );
  isComputing.value = false;
  message.value = "";
  messageColor.value = "black";
};

const onInput = () => {
  if (isComputing.value) {
    return;
  }

  isEdit.value = true;
  inputNumbers.value = [...Array(9)].map(() => [...Array(9)].fill(0));
};

const onEdit = () => {
  if (isComputing.value) {
    return;
  }

  isEdit.value = true;
  inputNumbers.value = numbers.map((arr) => [...arr]);
};

const onEditConfirm = () => {
  isEdit.value = false;
  const msg = validateGrid(inputNumbers.value);
  if (msg) {
    message.value = msg;
    messageColor.value = "red";
    isEdit.value = true;
  } else {
    numbers = inputNumbers.value.map((arr) => [...arr]);
    sudokuRef.value.setNumbers(numbers);
    localStorage.setItem("sudoku", JSON.stringify(numbers));
    message.value = "";
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
  inputNumbers.value[row][col] = num;
}
</script>

<style lang="scss" scoped>
.container {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  position: relative;
}
.center {
  display: flex;
  flex-direction: column;
  max-height: 100%;
}
.setting {
  position: absolute;
  right: 20px;
  text-align: left;
  width: 200px;

  .title {
    font-size: 18px;
    font-weight: bold;
  }

  > div {
    margin-bottom: 10px;
  }

  .input-checkbox {
    display: flex;
    align-items: center;
  }

  #delay {
    width: 50px;
    height: 26px;
    margin-left: 10px;
  }
  #last-input {
    width: 20px;
    height: 20px;
  }
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
  justify-content: center;
  gap: 20px;
  margin-bottom: 30px;
  margin-top: 20px;
}

.button {
  padding: 8px 0;
  font-size: 16px;
  color: black;
  border: 1px solid #8e8e8e;
  border-radius: 8px;
  width: 100px;
  cursor: pointer;

  &:hover {
    border: 1px solid #1377eb;
    color: #1377eb;
  }

  &--primary {
    background-color: #1377eb;
    color: white;
    border: none;

    &:hover {
      background-color: #1377ebcc;
      color: white;
      border: none;
    }
  }

  &--stop {
    background-color: #eb1e13;
    color: white;
    border: none;

    &:hover {
      background-color: #eb1e13cc;
      color: white;
      border: none;
    }
  }

  &--input {
    background-color: rgb(255, 120, 0);
    color: white;
    border: none;

    &:hover {
      background-color: rgba(255, 120, 0, 0.8);
      color: white;
      border: none;
    }
  }

  &--edit {
    background-color: #dd13eb;
    color: white;
    border: none;

    &:hover {
      background-color: #dd13ebcc;
      color: white;
      border: none;
    }
  }
}

.button.button--disabled {
  background-color: lightgray;
  color: #999999;
  cursor: not-allowed;
  border: none;
}

.message {
  font-size: 20px;
  margin-top: 20px;
  height: 24px;
  flex: none;
}

.location {
  position: absolute;
  width: 60px;
  height: 60px;
  border: 3px solid transparent;
  box-sizing: border-box;
}
</style>
