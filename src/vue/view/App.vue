<script setup lang="ts">
import {
  ElCard,
  ElCol,
  ElContainer,
  ElHeader,
  ElIcon,
  ElMain,
  ElRow,
  ElScrollbar,
} from 'element-plus';
import remote from '@/remote';
import { useDark, useTitle } from '@vueuse/core';
import { promiseRef } from '@/util/promiseRef';
import LRMenu from './components/LRMenu.vue';
import Editor from './Editor.vue';
import { ref } from 'vue';
import { getFiles, FileRecord } from '@/util/database';
import { readableDate } from '@/util/readable';
import { DocumentAdd, Download } from '@element-plus/icons-vue';
import { getBlankDiagramStorage } from '@/util/SeqLogic';
import { websiteName } from '@/util/websiteName';
import { updateFile } from '@/util/database';
const title = websiteName;
useTitle(title);
useDark();
const pathname = ref<string>();
const files = promiseRef(getFiles(), []);
const fetchFiles = async () => {
  files.value = await getFiles();
};
const onClose = async () => {
  await fetchFiles();
  pathname.value = undefined;
};
const onOpen = async (file: FileRecord) => {
  pathname.value = file.pathname;
  updateFile(pathname.value);
};
const onImport = async () => {
  const { filePaths } = await remote.main['dialog.showOpenDialog']({
    title: 'Import Seq Logic Project',
    defaultPath: await remote.getExtraPath(),
    filters: [
      { name: 'Seq Logic', extensions: ['seq.json'] },
      { name: 'JSON', extensions: ['json'] },
    ],
    properties: ['createDirectory', 'openFile'],
  });
  if (filePaths.length != 1) {
    return;
  }
  pathname.value = filePaths[0];
  updateFile(pathname.value);
};
const onNewFile = async () => {
  const { filePath } = await remote.main['dialog.showSaveDialog']({
    title: 'New Seq Logic Project',
    defaultPath: await remote.getExtraPath(),
    filters: [{ name: 'Seq Logic', extensions: ['seq.json'] }],
    properties: ['createDirectory'],
  });
  if (filePath === undefined) {
    return;
  }
  await remote.fs.writeFile(filePath, JSON.stringify(getBlankDiagramStorage()));
  pathname.value = filePath;
  updateFile(pathname.value);
};
const getTitleOf = (pathname: string) => {
  return remote.path.basename(pathname, '.seq.json');
};
</script>
<template>
  <ElContainer class="root" v-if="pathname === undefined">
    <ElHeader class="root-header">
      <LRMenu>
        <span class="header-text">Project List</span>
      </LRMenu>
    </ElHeader>
    <ElMain class="no-padding">
      <ElScrollbar>
        <ElRow :justify="'center'">
          <ElCol :span="24" :md="16">
            <ElRow>
              <ElCol :span="12">
                <ElCard class="button-card" @click="onImport()">
                  <ElRow :justify="'center'" :align="'middle'">
                    <ElIcon style="font-size: 2rem"><Download /></ElIcon>
                    <span class="header-text">Import</span>
                  </ElRow>
                </ElCard>
              </ElCol>
              <ElCol :span="12">
                <ElCard class="button-card" @click="onNewFile()">
                  <ElRow :justify="'center'" :align="'middle'">
                    <ElIcon style="font-size: 2rem"><DocumentAdd /></ElIcon>
                    <span class="header-text">New</span>
                  </ElRow>
                </ElCard>
              </ElCol>
            </ElRow>
          </ElCol>
          <ElCol :span="24" :md="16" v-for="file of files">
            <ElCard class="button-card" @click="onOpen(file)">
              <ElRow :justify="'space-between'" :align="'middle'">
                <h2 class="header-text">
                  {{ getTitleOf(file.pathname) }}
                </h2>
                <span>{{ readableDate(file.updatedTime) }}</span>
              </ElRow>
            </ElCard>
          </ElCol>
        </ElRow>
      </ElScrollbar>
    </ElMain>
  </ElContainer>
  <Editor v-else :key="pathname" :pathname="pathname" @close="onClose()" />
</template>
<style lang="scss" scoped>
.root {
  height: 100vh;
}
.root-header {
  background-color: var(--color-background-mute);
  user-select: none;
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
.button-card {
  margin: 10px;
  color: var(--color-text);
  :hover {
    color: var(--color-heading);
    background-color: var(--color-background-mute);
  }
}
.header-text {
  user-select: none;
  font-size: larger;
  font-family: 'Lucida Sans', 'Lucida Sans Regular', 'Lucida Grande',
    'Lucida Sans Unicode', Geneva, Verdana, sans-serif;
}
</style>
