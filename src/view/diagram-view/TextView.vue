<script setup lang="ts">
import { Text as SeqText } from '@/util/SeqLogic';
defineProps<{
  text: SeqText;
  selected: boolean;
}>();
</script>
<template>
  <g>
    <text
      ref="textRef"
      :x="text.x"
      :y="text.y"
      :font-size="text.scale * 16"
      :text-anchor="'middle'"
      :dominant-baseline="'middle'"
      :fill="selected ? 'var(--color-heading)' : 'var(--color-text)'"
      :stroke="selected ? 'var(--el-color-primary)' : 'none'"
    >
      {{ '# ' + text.text }}
    </text>
  </g>
</template>
<style scoped>
text {
  user-select: none;
}
</style>
