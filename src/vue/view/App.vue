<script setup lang="ts">
import { ElContainer, ElHeader, ElMain } from 'element-plus';
import TitleView from './components/Title.vue';
import { remote } from '@/remote';
import { useDark } from '@vueuse/core';
import { promiseRef } from '@/util/promiseRef';
import LRMenu from './components/LRMenu.vue';
useDark();
const title = promiseRef(remote.content.title());
</script>
<template>
  <TitleView :title="title" v-if="title !== undefined" />
  <ElContainer class="root">
    <ElHeader class="root-header">
      <LRMenu>
        <h1>Title</h1>
        <template #end>
          <h1>Account</h1>
        </template>
      </LRMenu>
    </ElHeader>
    <ElMain class="no-padding"> </ElMain>
  </ElContainer>
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
</style>
