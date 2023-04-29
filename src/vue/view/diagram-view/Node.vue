<script setup lang="ts">
import { Node, Status } from '@/util/SeqLogic';
defineProps<{
  id: string;
  node: Node;
  status: Status;
  selected: boolean;
}>();
const radius = 10;
const padding = 5;
</script>
<template>
  <g>
    <circle :cx="node.x" :cy="node.y" :r="radius" :fill="'var(--color-text)'" />
    <circle
      v-if="status.powered"
      :cx="node.x"
      :cy="node.y"
      :r="8"
      :fill="'var(--el-color-danger)'"
    />
    <circle
      v-else-if="status.active"
      :cx="node.x"
      :cy="node.y"
      :r="10"
      :fill="'var(--el-color-primary)'"
    />
    <rect
      v-if="selected"
      :x="node.x - radius - padding"
      :y="node.y - radius - padding"
      :width="2 * (radius + padding)"
      :height="2 * (radius + padding)"
      :stroke="'var(--el-color-primary)'"
      :stroke-width="1"
      :stroke-dasharray="'3 2'"
      :stroke-linejoin="'round'"
      :fill="'none'"
    ></rect>
  </g>
</template>
