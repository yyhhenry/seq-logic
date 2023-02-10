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
const title = await remote.content.title();
const uuid = ref(await remote.content.uuid());
const extraPath = await remote.fs.getPath('extra');
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
    defaultPath: extraPath,
    properties: ['openFile', 'multiSelections'],
  });
  if (newFilePaths !== undefined) {
    filePaths.value = newFilePaths;
    uuid.value = await remote.content.uuid();
  }
};
</script>
<template>
  <TitleView :title="title" />
  <ElContainer>
    <ElHeader class="header">
      <h1 class="user-select-none">
        <span> {{ title }} </span>
        <span style="margin-left: 10px">
          <span style="font-style: italic">
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
          <ElCol :span="24" class="user-select-none">{{
            `(uuid: ${uuid})`
          }}</ElCol>
          <ElCol
            :span="24"
            class="user-select-none"
            v-if="filePaths.length !== 0"
          >
            File Opened:
          </ElCol>
          <ElCol :span="24" class="user-select-none" v-else>
            暂无已经打开的项
          </ElCol>
          <ElCol :span="24" v-for="[index, filePath] of filePaths.entries()">
            <span>{{ filePath }}</span>
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
