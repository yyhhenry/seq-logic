<script setup lang="ts">
import { Status, Wire, Node } from '@/util/SeqLogic';
import { write } from 'fs';
import { computed } from 'vue';
const props = defineProps<{
  wire: Wire;
  start: Node;
  end: Node;
  startStatus: Status;
  selected: boolean;
}>();
const startPart = props.startStatus.active;
const endPart = props.wire.not ? !startPart : startPart;
const mid = computed(() => ({
  x: (props.start.x + props.end.x) / 2,
  y: (props.start.y + props.end.y) / 2,
}));
const width = 4;
const angle = computed(() => {
  const dx = props.end.x - props.start.x;
  const dy = props.end.y - props.start.y;
  return Math.atan2(dy, dx);
});
// draw not gate
const gateRadius = 8;
const angleOffset = [0, (-2 / 3) * Math.PI, (2 / 3) * Math.PI];
const positions = computed(() =>
  angleOffset.map(offset => ({
    x: mid.value.x + gateRadius * Math.cos(angle.value + offset),
    y: mid.value.y + gateRadius * Math.sin(angle.value + offset),
  }))
);
const gate = computed(() => {
  const toStr = (i: number) =>
    `${positions.value[i].x} ${positions.value[i].y}`;
  return `M ${toStr(0)} L ${toStr(1)} L ${toStr(2)} Z`;
});
</script>
<template>
  <g>
    <line
      :x1="start.x"
      :y1="start.y"
      :x2="mid.x"
      :y2="mid.y"
      :stroke="startPart ? 'var(--el-color-primary)' : 'var(--color-heading)'"
      :stroke-width="width"
    ></line>
    <line
      :x1="mid.x"
      :y1="mid.y"
      :x2="end.x"
      :y2="end.y"
      :stroke="endPart ? 'var(--el-color-primary)' : 'var(--color-heading)'"
      :stroke-width="width"
    ></line>
    <path
      v-if="wire.not"
      :d="gate"
      :stroke="startPart ? 'var(--el-color-primary)' : 'var(--color-heading)'"
      :stroke-width="width / 2"
      :fill="'var(--color-background)'"
    ></path>
    <circle
      v-if="wire.not"
      :cx="positions[0].x"
      :cy="positions[0].y"
      :r="width /2"
      :stroke="endPart ? 'var(--el-color-primary)' : 'var(--color-heading)'"
      :stroke-width="width / 2"
      :fill="'var(--color-background)'"
    ></circle>
    <line
      v-if="selected"
      :x1="start.x"
      :y1="start.y"
      :x2="end.x"
      :y2="end.y"
      :stroke="'var(--el-color-primary)'"
      :stroke-width="width * 3"
      :opacity="0.7"
    >
    </line>
  </g>
</template>
