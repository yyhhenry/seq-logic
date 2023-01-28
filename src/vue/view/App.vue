<script setup lang="ts">
import { ElCard, ElContainer, ElHeader, ElMain } from 'element-plus';
import TitleView from './TitleView.vue';
import { remote } from '@/remote';
import { ref } from 'vue';
const content = ref<string>();
remote.templateName.templateName().then(value => (content.value = value));
</script>
<template>
  <TitleView :title="'Electron Builder Pnpm Template'" />
  <ElContainer>
    <ElHeader class="header">
      <h1>Title</h1>
    </ElHeader>
    <ElMain>
      <ElCard> {{ content ?? '等待响应' }} </ElCard>
    </ElMain>
  </ElContainer>
</template>
<style scoped>
.header {
  display: flex;
  align-items: center;
  background-color: rgb(68, 132, 229);
  color: white;
}
</style>
