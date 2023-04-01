<script setup lang="ts">
import { ElContainer, ElHeader, ElMain, ElScrollbar } from 'element-plus';
import { remote } from '@/remote';
import { useDark, useTitle } from '@vueuse/core';
import { promiseRef } from '@/util/promiseRef';
import LRMenu from './components/LRMenu.vue';
import Editor from './Editor.vue';
import { ref } from 'vue';
const title = promiseRef(remote.content.title());
useTitle(title);
useDark();
const homepage = ref(true);
</script>
<template>
  <ElContainer class="root" v-if="homepage">
    <ElHeader class="root-header">
      <LRMenu>
        <h1>Title</h1>
        <template #end>
          <h1>Account</h1>
        </template>
      </LRMenu>
    </ElHeader>
    <ElMain class="no-padding">
      <ElScrollbar>
        <!-- File list -->
      </ElScrollbar>
    </ElMain>
  </ElContainer>
  <Editor v-else />
</template>
<style scoped>
.root {
  height: 100vh;
}
.root-header {
  background-color: var(--color-background-mute);
}
.user-select-none {
  user-select: none;
}
.no-padding {
  padding: 0;
}
.full-width {
  width: 100%;
}
.full-height {
  height: 100%;
}
</style>
