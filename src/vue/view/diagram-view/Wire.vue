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
</script>
<template>
  <g>
    <line
      :x1="start.x"
      :y1="start.y"
      :x2="mid.x"
      :y2="mid.y"
      :stroke="startPart ? 'var(--el-color-danger)' : 'var(--color-heading)'"
      :stroke-width="width"
    ></line>
    <line
      :x1="mid.x"
      :y1="mid.y"
      :x2="end.x"
      :y2="end.y"
      :stroke="endPart ? 'var(--el-color-danger)' : 'var(--color-heading)'"
      :stroke-width="width"
      :stroke-dasharray="wire.not ? `${width * 2} ${width}` : 'none'"
    ></line>
    <line
      v-if="wire.not"
      :x1="mid.x"
      :y1="mid.y"
      :x2="end.x"
      :y2="end.y"
      :stroke="'var(--el-color-info)'"
      :stroke-width="width"
      :stroke-dasharray="wire.not ? `${width} ${width * 2}` : 'none'"
      :stroke-dashoffset="width"
    ></line>
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
