<script setup lang="ts">
import { ElMain, ElContainer, ElHeader } from 'element-plus';
import LRMenu from './components/LRMenu.vue';
</script>
<template>
  <ElContainer class="root">
    <ElHeader class="root-header">
      <LRMenu>
        <h1>Title</h1>
        <template #end>
          <h1>Account</h1>
        </template>
      </LRMenu>
    </ElHeader>
    <ElMain class="no-padding no-scroll">
      <svg class="full-height full-width"></svg>
    </ElMain>
  </ElContainer>
</template>
<style scoped>
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
</style>
