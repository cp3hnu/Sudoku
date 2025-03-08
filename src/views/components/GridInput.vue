<template>
  <div
    :class="{
      grid: true,
      'grid--bottom': isBottom,
      'grid--right': isRight,
    }"
  >
    <input :id="id" :value="value" @keydown="handleKeyDown" />
  </div>
</template>

<script setup>
/* eslint-disable */
import { computed } from "vue";
const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  value: {
    type: [Number, String],
    required: true,
  },
  line: {
    type: Number,
    required: true,
  }, 
  column: {
    type: Number,
    required: true,
  }, 
});
const emit = defineEmits(['change'])
const isBottom = computed(() => {
  return props.line === 2 || props.line === 5;
});
const isRight = computed(() => {
  return props.column === 2 || props.column === 5;
});
const onInput = (e) => {
  const value = e.target.value.replace(/\D/g, "") || "0";
  // let num = Number(value);
  // console.log("num", num);
  
  // if (Number.isNaN(num)) {
  //   num = 0;
  // } else if (num > 9) {
  //   num = 9;
  // } else if (num < 0) {
  //   num = 0;
  // }
  e.target.value = value;
  emit("change", e.target.value, props.line, props.column)
}
// 处理上下左右箭头
const handleKeyDown = (e) => {
  const id = props.id;
  const row = id.split("-")[1];
  const col = id.split("-")[2];
  let nextId;
  if (e.key === "ArrowUp") {
    nextId = `grid-${Number(row) - 1}-${col}`;
  } else if (e.key === "ArrowDown") {
    nextId = `grid-${Number(row) + 1}-${col}`;
  } else if (e.key === "ArrowLeft") {
    nextId = `grid-${row}-${Number(col) - 1}`;
  } else if (e.key === "ArrowRight") {
    nextId = `grid-${row}-${Number(col) + 1}`;
  }

  if (nextId && document.getElementById(nextId)) {
    document.getElementById(nextId).focus();
    e.preventDefault();
    return
  }

  // 只允许数字输入
  if (/^\d$/.test(e.key)) {
    emit("change", e.key, props.line, props.column)
  }

  e.preventDefault(); // 阻止默认输入行为 
}
</script>

<style lang="scss" scoped>
.grid {
  width: 60px;
  height: 60px;
  border: 0.5px solid #ccc;
  background-color: white;
  color: black;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  word-break: break-all;

  input {
    width: 50px;
    height: 50px;
    border: none;
    font-size: 16px;
    text-align: center;
  }
}
.grid--bottom {
  border-bottom: 2px solid black;
}
.grid--right {
  border-right: 2px solid black;
}
.grid--setted {
  background-color: #e8e8e8;
}
</style>
