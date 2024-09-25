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
        <div
          class="compute-button"
          :class="{ 'compute-button--disabled': isComputing || isEdit }"
          @click="reset"
        >
          重置
        </div>
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
      :class="!hasError ? 'message--success' : 'message--error'"
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
import { LocationType } from "@/lib/utils";
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

const moveFrame = (line, column, type) => {
  location.line = line;
  location.column = column;
  borderColor.value = type === LocationType.Settle ? "green" : "red";
};

const message = ref("");
const hasError = ref(false);
const isComputing = ref(false);
const borderColor = ref("transparent");
const isEdit = ref(false);
const delay = ref(10);
const location = reactive({
  line: 0,
  column: 0,
});
const sudoku = new Sudoku(numbers.value, moveFrame, delay.value);
const sudokuRef = reactive(sudoku);

const onDelayInput = (event) => {
  // 只保留数字
  event.target.value = event.target.value.replace(/\D/g, "");
  delay.value = event.target.value;
  const num = Number(event.target.value);
  sudokuRef.delay = Number.isNaN(num) ? 10 : num;
};

async function compute() {
  if (isComputing.value) {
    return;
  }

  if (!sudokuRef.isValidated()) {
    message.value = "输入错误，请重新输入";
    hasError.value = true;
    return;
  }

  if (sudokuRef.isSuccess()) {
    message.value = "成功";
    hasError.value = false;
  }

  isComputing.value = true;
  await sudokuRef.compute();
  isComputing.value = false;
  if (sudokuRef.isSuccess()) {
    message.value = "成功";
    hasError.value = false;
  } else {
    message.value = "有错误";
    hasError.value = true;
  }
}

const reset = () => {
  if (isComputing.value) {
    return;
  }

  sudokuRef.reset();
  isComputing.value = false;
  hasError.value = false;
  message.value = "";
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
      hasError.value = true;
      isEdit.value = true;
    } else {
      message.value = "";
      hasError.value = false;
      sudokuRef.setNumbers(numbers.value);
    }
  }
};

const onEditCancel = () => {
  message.value = "";
  hasError.value = false;
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
