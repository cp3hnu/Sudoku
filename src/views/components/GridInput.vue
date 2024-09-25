<template>
  <div
    :class="{
      grid: true,
      'grid--bottom': isBottom,
      'grid--right': isRight,
    }"
  >
    <input :value="value" @input="onInput" />
  </div>
</template>

<script setup>
/* eslint-disable */
import { computed } from "vue";
const props = defineProps({
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
  let num = Number(value);
  if (Number.isNaN(num)) {
    num = 0;
  } else if (num > 9) {
    num = 9;
  } else if (num < 0) {
    num = 0;
  }
  e.target.value = num;
  emit("change", e.target.value, props.line, props.column)
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
