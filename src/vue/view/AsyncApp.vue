<script setup lang="ts">
import {
  ElButton,
  ElCard,
  ElContainer,
  ElHeader,
  ElMain,
  ElRow,
  ElCol,
} from 'element-plus';
import TitleView from './TitleView.vue';
import { remote } from '@/remote';
import { ref, watch } from 'vue';
import { readableSize } from '@/util/readableSize';
const templateName = await remote.templateName.templateName();
const documentsPath = await remote.fs.getPath('documents');
const filePaths = ref<string[]>([]);
const fileSizes = ref<string[]>([]);
watch(filePaths, async () => {
  fileSizes.value = (
    await Promise.all(
      filePaths.value.map(pathname => remote.fs.getFileSize(pathname))
    )
  ).map(size => readableSize(size));
});
const openFileClick = async () => {
  const newFilePaths = await remote.fs.openFile({
    title: '随便打开吧',
    filters: [
      { extensions: ['txt'], name: '文本文件' },
      { extensions: ['*'], name: '所有文件' },
    ],
    defaultPath: documentsPath,
    properties: ['openFile', 'multiSelections'],
  });
  if (newFilePaths !== undefined) {
    filePaths.value = newFilePaths;
  }
};
</script>
<template>
  <TitleView :title="templateName" />
  <ElContainer>
    <ElHeader class="header">
      <h1>
        <span> {{ templateName }} </span>
        <span style="margin-left: 10px">
          <span style="font-family: fantasy">
            {{ 'Powered By ' }}
          </span>
          <img style="height: 1em" src="/icon.png" />
        </span>
      </h1>
    </ElHeader>
    <ElMain>
      <ElCard style="margin: 10px">
        <template #header>
          <ElButton @click="openFileClick">Open File</ElButton>
        </template>
        <ElRow>
          <ElCol :span="24" v-if="filePaths.length !== 0"> File Opened: </ElCol>
          <ElCol :span="24" v-else> 暂无已经打开的项 </ElCol>
          <ElCol :span="24" v-for="[index, filePath] of filePaths.entries()">
            <span style="display: inline-block">{{ filePath }}</span>
            <span style="margin-left: 5px" class="user-select-none">
              {{ `(size: ${fileSizes[index]})` }}
            </span>
          </ElCol>
        </ElRow>
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
.user-select-none {
  user-select: none;
}
</style>
