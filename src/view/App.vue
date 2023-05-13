<script setup lang="ts">
import {
  ElButton,
  ElCard,
  ElCol,
  ElContainer,
  ElHeader,
  ElIcon,
  ElMain,
  ElMessage,
  ElMessageBox,
  ElRow,
  ElScrollbar,
  ElSwitch,
} from 'element-plus';
import { useDark, useEventListener, useTitle } from '@vueuse/core';
import { promiseRef } from '@/util/promiseRef';
import LRMenu from './components/LRMenu.vue';
import Editor from './Editor.vue';
import { computed, ref } from 'vue';
import { getFiles, deleteFile } from '@/util/database';
import { getReadableDate, getReadableFilename } from '@/util/readable';
import {
  DocumentAdd,
  Download,
  Sunny,
  Moon,
  Close,
} from '@element-plus/icons-vue';
import { getBlankDiagramStorage } from '@/util/SeqLogic';
import { dialog, path, fs, clipboard } from '@tauri-apps/api';
import { websiteName } from '@/util/websiteName';
import { updateFile } from '@/util/database';
const title = websiteName;
useTitle(title);
const dark = useDark();
const pathname = ref<string>();
const files = promiseRef(getFiles(), []);
const fetchFiles = async (pathname?: string) => {
  if (pathname !== undefined) {
    updateFile(pathname);
  }
  files.value = await getFiles();
};
const onClose = async () => {
  await fetchFiles();
  pathname.value = undefined;
};
const onOpen = async (file: string) => {
  await fetchFiles(file);
  pathname.value = file;
};
const onImport = async () => {
  const filePath = await dialog.open({
    title: 'Import Seq Logic Project',
    defaultPath: await path.resolveResource('samples'),
    filters: [
      { name: 'Seq Logic', extensions: ['seq.json'] },
      { name: 'JSON', extensions: ['json'] },
    ],
  });
  if (typeof filePath === 'string') {
    await onOpen(filePath);
  } else {
    ElMessage.error('Failed to open file');
  }
};
const onNewFile = async () => {
  const filePath = await dialog.save({
    title: 'New Seq Logic Project',
    defaultPath: await path.documentDir(),
    filters: [{ name: 'Seq Logic', extensions: ['seq.json'] }],
  });
  if (filePath == undefined) {
    return;
  }
  await fs.writeFile(filePath, JSON.stringify(getBlankDiagramStorage()));
  await onOpen(filePath);
};
const onDelete = async (pathname: string) => {
  ElMessageBox.confirm(
    'Are you sure to remove this project from the list?',
    'Warning',
    {
      confirmButtonText: 'OK',
      cancelButtonText: 'Cancel',
      type: 'warning',
    }
  )
    .then(async () => {
      await deleteFile(pathname);
      await fetchFiles();
    })
    .catch(() => {});
};
const copyPathname = (pathname: string) => {
  clipboard.writeText(pathname);
  ElMessage.success('Path copied to clipboard');
};
useEventListener(window, 'contextmenu', e => {
  e.preventDefault();
});
const readableFilenameRefs = computed(() =>
  files.value.map(file => promiseRef(getReadableFilename(file.pathname)))
);
const readableFilenames = computed(() =>
  readableFilenameRefs.value.map(ref => ref.value)
);
</script>
<template>
  <ElContainer class="root" v-if="pathname === undefined">
    <ElHeader class="root-header">
      <LRMenu>
        <span class="header-text">Project List</span>
        <template #end>
          <div v-if="!dark" style="font-size: smaller">
            (We prefer Dark Mode)
          </div>
          <ElSwitch
            v-model="dark"
            inline-prompt
            :size="'large'"
            :active-icon="Moon"
            :inactive-icon="Sunny"
            :style="{
              '--el-switch-on-color': 'var(--color-background)',
              '--el-switch-off-color': 'var(--el-color-info)',
            }"
          >
          </ElSwitch>
        </template>
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
          <ElCol :span="24" :md="16" v-for="[id, file] of files.entries()">
            <ElCard class="button-card" @dblclick="onOpen(file.pathname)">
              <ElRow
                :justify="'space-between'"
                :align="'middle'"
                @contextmenu="copyPathname(file.pathname)"
              >
                <div>
                  <h2 class="header-text">
                    {{ readableFilenames[id] }}
                  </h2>
                  <p class="long-text" :title="file.pathname">
                    {{ file.pathname }}
                  </p>
                </div>
                <ElRow :align="'middle'">
                  <span class="header-text">{{
                    getReadableDate(file.updatedTime)
                  }}</span>
                  <ElButton
                    :text="true"
                    :icon="Close"
                    @click="onDelete(file.pathname)"
                  >
                  </ElButton>
                </ElRow>
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
.long-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 400px;
}
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
  color: var(--color-heading);
  user-select: none;
  font-size: larger;
  font-family: 'Lucida Sans', 'Lucida Sans Regular', 'Lucida Grande',
    'Lucida Sans Unicode', Geneva, Verdana, sans-serif;
}
</style>
