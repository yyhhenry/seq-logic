<script setup lang="ts">
import {
  ElMain,
  ElContainer,
  ElHeader,
  ElButton,
  ElMessageBox,
} from 'element-plus';
import { Close } from '@element-plus/icons-vue';
import LRMenu from './components/LRMenu.vue';
import { deleteFile } from '@/util/database';
import { Diagram, isDiagramStorage } from '@/util/SeqLogic';
import { promiseRef } from '@/util/promiseRef';
import { readableFilename } from '@/util/readable';
const props = defineProps<{
  /**
   * The pathname of the file being edited.
   * You should also put this in the key attribute of the component.
   */
  pathname: string;
}>();
const emits = defineEmits<{
  (e: 'close'): void;
}>();
const getDiagram = async () => {
  try {
    return Diagram.loadFile(props.pathname);
  } catch (e) {
    ElMessageBox.alert('Failed to open file: ' + props.pathname);
    deleteFile(props.pathname);
    emits('close');
  }
};
const onClose = async () => {
  ElMessageBox.confirm('Close now?')
    .then(() => {
      emits('close');
    })
    .catch(() => {});
};
const diagram = promiseRef(getDiagram());
</script>
<template>
  <ElContainer class="root">
    <ElHeader class="root-header">
      <LRMenu>
        <ElButton
          :type="'info'"
          class="header-text"
          @click="onClose()"
          :icon="Close"
          :circle="true"
        >
        </ElButton>
        <div class="header-text" style="margin: 10px">
          {{ readableFilename(pathname) }}
        </div>
        <template #end> </template>
      </LRMenu>
    </ElHeader>
    <ElMain class="no-padding no-scroll">
      <svg class="full-height full-width"></svg>
    </ElMain>
  </ElContainer>
</template>
<style lang="scss" scoped>
.root {
  height: 100vh;
}
.root-header {
  background-color: var(--color-background-mute);
  user-select: none;
}
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
.header-text {
  user-select: none;
  font-size: larger;
  font-family: 'Lucida Sans', 'Lucida Sans Regular', 'Lucida Grande',
    'Lucida Sans Unicode', Geneva, Verdana, sans-serif;
}
</style>
