<script setup lang="ts">
import { ElButton, ElCard, ElContainer, ElHeader, ElMain } from 'element-plus';
import TitleView from './TitleView.vue';
import { remote } from '@/remote';
import { ref } from 'vue';
const templateName = await remote.templateName.templateName();
const filePaths = ref<string[]>([]);
const exePath = await remote.dialog.getPath('exe');
const openFileClick = async () => {
  const newFilePaths = await remote.dialog.openFile({
    title: '随便打开吧',
    filters: [
      { extensions: ['txt'], name: '文本文件' },
      { extensions: ['*'], name: '所有文件' },
    ],
    defaultPath: exePath,
    properties: ['openFile', 'multiSelections'],
  });
  filePaths.value = newFilePaths;
};
</script>
<template>
  <TitleView :title="templateName" />
  <ElContainer>
    <ElHeader class="header">
      <h1>{{ templateName }}</h1>
    </ElHeader>
    <ElMain>
      <ElCard style="margin: 10px">
        <p>
          <span>{{ 'File Opened: ' }}</span>
          <span>{{ JSON.stringify(filePaths) }}</span>
        </p>
        <ElButton @click="openFileClick">Open File</ElButton>
      </ElCard>
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
