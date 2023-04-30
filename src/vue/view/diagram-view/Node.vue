<script setup lang="ts">
import { Node, Status, getPowered } from '@/util/SeqLogic';
import { computed } from 'vue';
const props = defineProps<{
  node: Node;
  status: Status;
  selected: boolean;
}>();
const radius = 10;
const probeRadius = 8;
const padding = 5;
const powered = computed(() => getPowered(props.node.powered));
</script>
<template>
  <g>
    <circle
      :cx="node.x"
      :cy="node.y"
      :r="radius"
      :fill="'var(--color-heading)'"
    />
    <circle
      v-if="powered"
      :cx="node.x"
      :cy="node.y"
      :r="probeRadius"
      :fill="'var(--el-color-danger)'"
    />
    <circle
      v-else-if="status.active"
      :cx="node.x"
      :cy="node.y"
      :r="probeRadius"
      :fill="'var(--el-color-primary)'"
    />
    <circle
      v-else
      :cx="node.x"
      :cy="node.y"
      :r="probeRadius"
      :fill="'var(--el-color-info)'"
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
