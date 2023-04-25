<script setup lang="ts">
import {
  ElMain,
  ElContainer,
  ElHeader,
  ElButton,
  ElMessageBox,
  ElFooter,
  ElRow,
} from 'element-plus';
import { Close } from '@element-plus/icons-vue';
import LRMenu from './components/LRMenu.vue';
import { deleteFile } from '@/util/database';
import { Diagram } from '@/util/SeqLogic';
import { promiseRef } from '@/util/promiseRef';
import { readableFilename } from '@/util/readable';
import { ref } from 'vue';
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
    return await Diagram.loadFile(props.pathname);
  } catch (e) {
    console.error(e);
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
const diagram = promiseRef(
  getDiagram().then(diagram => {
    // Test log
    console.log(diagram);
    return diagram;
  })
);

// Default action:
// wheel to zoom
// ctrl drag to move
// Show a error message if the operation is invalid
// press A or click "Add node(A)" to clear focus and to status: add-node
// press W or click "Add wire(W)" when focus contains any node to clear non-node focus and to status: add-wire
// press T or click "Add text(T)" to clear focus to status: add-text
// press Delete or click "Delete(Del)" when focus contains any node, wire or text to delete them

// status: idle
// drag to select with a box
// click to select one node, wire or text
// shift click to select multiple (XOR)

// status: add-node
// preview a node at the mouse position
// click to add node
// click existing node to cancel and to status: idle
// press A to cancel and to status: idle

// status: add-wire
// click node to add wire from all selected nodes to the clicked node
// click blank to add noe and add wire from all selected nodes to the clicked position

// status: add-text
// preview a text like "New Text" at the mouse position
// click blank to add text to the clicked node
type EditorStatus = 'idle' | 'add-node' | 'add-wire' | 'add-text';
const editorStatus = ref<EditorStatus>('idle');
type EditorFocus = Record<'node' | 'wire' | 'text', Set<string>>;
const editorFocus = ref<EditorFocus>({
  node: new Set(),
  wire: new Set(),
  text: new Set(),
});
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
      <ElContainer class="full-height full-width">
        <ElMain class="no-padding no-scroll">
          <svg class="full-height full-width"></svg>
        </ElMain>
        <ElFooter class="editor-footer" height="2rem">
          <ElRow :align="'middle'">
            <div>{{ editorStatus }}</div>
          </ElRow>
        </ElFooter>
      </ElContainer>
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
.editor-footer {
  background-color: var(--color-background-soft);
  user-select: none;
}
</style>
