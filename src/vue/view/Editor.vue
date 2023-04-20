<script setup lang="ts">
import { ElMain, ElContainer, ElHeader, ElButton } from 'element-plus';
import LRMenu from './components/LRMenu.vue';
const props = defineProps<{
  pathname: string;
}>();
defineEmits<{
  (e: 'close'): void;
}>();
</script>
<template>
  <ElContainer class="root">
    <ElHeader class="root-header">
      <LRMenu>
        <ElButton :plain="true" class="header-text" @click="$emit('close')">
          Back
        </ElButton>
        <div class="header-text">
          {{ pathname }}
        </div>
        <template #end> </template>
      </LRMenu>
    </ElHeader>
    <ElMain class="no-padding no-scroll">
      <svg class="full-height full-width"></svg>
    </ElMain>
  </ElContainer>
</template>
<style lang="scss" scoped>
.root {
  height: 100vh;
}
.root-header {
  background-color: var(--color-background-mute);
  user-select: none;
}
.no-padding {
  padding: 0;
}
.no-scroll {
  overflow: hidden;
}
.full-width {
  width: 100%;
}
.full-height {
  height: 100%;
}
.header-text {
  user-select: none;
  font-size: larger;
  font-family: 'Lucida Sans', 'Lucida Sans Regular', 'Lucida Grande',
    'Lucida Sans Unicode', Geneva, Verdana, sans-serif;
}
</style>
