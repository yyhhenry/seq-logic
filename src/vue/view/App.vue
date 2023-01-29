<script setup lang="ts">
import { ElButton, ElCard, ElContainer, ElHeader, ElMain } from 'element-plus';
import TitleView from './TitleView.vue';
import { remote } from '@/remote';
import { ref } from 'vue';
const content = ref<string>();
remote.templateName.templateName().then(value => (content.value = value));
const filePaths = ref<string[]>([]);
const openFileClick = async () => {
  const desktopPath = await remote.dialog.getPath('desktop');
  console.log(desktopPath);
  const newFilePaths = await remote.dialog.openFile({
    title: '随便打开吧',
    filters: [
      { extensions: ['txt'], name: '文本文件' },
      { extensions: ['jpg', 'png'], name: '图片文件' },
      { extensions: ['*'], name: '所有文件' },
    ],
    defaultPath: desktopPath,
    properties: ['openFile', 'multiSelections'],
  });
  filePaths.value = newFilePaths;
};
</script>
<template>
  <TitleView :title="'Electron Builder Pnpm Template'" />
  <ElContainer>
    <ElHeader class="header">
      <h1>Title</h1>
    </ElHeader>
    <ElMain>
      <ElCard style="margin: 10px"> {{ content ?? '等待响应' }} </ElCard>
      <ElCard style="margin: 10px">
        <p>{{ JSON.stringify(filePaths) }}</p>
        <ElButton @click="openFileClick">dialog</ElButton>
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
