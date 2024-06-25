<template>
  <div
    :class="{
      grid: true,
      'grid--bottom': isBottom,
      'grid--right': isRight,
      'grid--setted': isSetted,
    }"
  >
    {{ value }}
  </div>
</template>

<script setup>
/* eslint-disable */
import { defineProps, computed } from "vue";
const props = defineProps({
  item: {
    type: Object,
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

const value = computed(() => {
  return props.item.value !== 0 ? props.item.value : props.item.notes.join();
});
const isBottom = computed(() => {
  return props.line === 2 || props.line === 5;
});
const isRight = computed(() => {
  return props.column === 2 || props.column === 5;
});
const isSetted = computed(() => {
  return props.item.isSettled;
});
</script>

<style lang="scss" scoped>
.grid {
  width: 50px;
  height: 50px;
  border: 0.5px solid #ccc;
  background-color: white;
  color: black;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  word-break: break-all;
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
