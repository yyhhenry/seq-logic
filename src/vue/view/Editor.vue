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
import { onMounted, onUnmounted, ref } from 'vue';
import { useDark, useMousePressed } from '@vueuse/core';
import { useMouseInElement } from '@vueuse/core';
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
const diagram = promiseRef(getDiagram());

// Default action:
// wheel to zoom
// ctrl drag to move
// Show a error message if the operation is invalid
// press A or click "Add node(A)" to clear selected items and to status: add-node
// press W or click "Add wire(W)" when selected items contains any node to clear non-node selected items and to status: add-wire
// press T or click "Add text(T)" to clear selected items to status: add-text
// press Delete or click "Delete(Del)" when selected items contains any node, wire or text to delete them and to status: idle
// press Esc or click "Cancel" to status: idle
// double click a node to status: edit-node
// double click a text to status: edit-text

// status: idle
// drag to select with a box
// shift click to select multiple (XOR)
// click to select one node, wire or text
// click blank to clear selected items
// drag on selected to move selected nodes, wires and texts

// status: add-node
// preview a node at the mouse position
// click to add node
// click existing node to cancel and to status: idle

// status: add-wire
// click node to add wire from all selected nodes to the clicked node
// click blank to add one node and add wire from all selected nodes to the added node

// status: add-text
// preview a text like "New Text" at the mouse position
// click to add text to the clicked position

// status: edit-node
// show dialog to edit node and set the power

// status: edit-wire
// show dialog to edit wire and set the not gate

// status: edit-text
// show dialog to edit text and set the scale
type EditorStatus =
  | 'idle'
  | 'add-node'
  | 'add-wire'
  | 'add-text'
  | 'edit-node'
  | 'edit-wire'
  | 'edit-text';
const editorStatus = ref<EditorStatus>('idle');
type ItemType = 'node' | 'wire' | 'text';
type SelectedItems = Record<ItemType, Set<string>>;
const selectedItems = ref<SelectedItems>({
  node: new Set(),
  wire: new Set(),
  text: new Set(),
});
const svgRef = ref<SVGSVGElement>();
const mouse = useMouseInElement(svgRef);
const mousePressed = useMousePressed();
const onUndo = () => {
  if (diagram.value) {
    diagram.value.undo();
  }
};
const onRedo = () => {
  if (diagram.value) {
    diagram.value.redo();
  }
};
const onKeyPress = (e: KeyboardEvent) => {
  if (e.key === 'z') {
    if (e.ctrlKey) {
      onUndo();
    }
  }
  if (e.key === 'y') {
    if (e.ctrlKey) {
      onRedo();
    }
  }
  if (e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) {
  } else {
    if (e.key === 'a') {
      editorStatus.value = 'add-node';
    } else if (e.key === 'w') {
      editorStatus.value = 'add-wire';
    } else if (e.key === 't') {
      editorStatus.value = 'add-text';
    } else if (e.key === 'Escape') {
      editorStatus.value = 'idle';
    } else if (e.key === 'Delete') {
      selectedItems.value.node.forEach(id => {
        diagram.value?.removeNode(id);
      });
      selectedItems.value.wire.forEach(id => {
        diagram.value?.removeWire(id);
      });
      selectedItems.value.text.forEach(id => {
        diagram.value?.removeText(id);
      });
      selectedItems.value = {
        node: new Set(),
        wire: new Set(),
        text: new Set(),
      };
      editorStatus.value = 'idle';
    }
  }
};
onMounted(() => {
  window.addEventListener('keypress', onKeyPress);
});
onUnmounted(() => {
  window.removeEventListener('keypress', onKeyPress);
});
const onWheel = (e: WheelEvent) => {
  if (diagram.value) {
    const [x, y] = [mouse.elementX.value, mouse.elementY.value];
    diagram.value.viewport.x -= x / diagram.value.viewport.scale;
    diagram.value.viewport.y -= y / diagram.value.viewport.scale;
    diagram.value.viewport.scale *= 1 + e.deltaY / 1000;
    diagram.value.viewport.x += x / diagram.value.viewport.scale;
    diagram.value.viewport.y += y / diagram.value.viewport.scale;
    e.stopPropagation();
  }
};
const onMove = (e: MouseEvent) => {
  if (e.ctrlKey) {
    if (mousePressed.pressed.value) {
      if (!diagram.value) return;
      diagram.value.viewport.x += e.movementX / diagram.value.viewport.scale;
      diagram.value.viewport.y += e.movementY / diagram.value.viewport.scale;
      e.stopPropagation();
    }
  } else {
    if (mousePressed.pressed.value) {
    }
  }
  // TODO: implement
};
const onClick = (e: MouseEvent, itemType: ItemType | 'blank', id: string) => {
  if (editorStatus.value === 'idle') {
    if (e.shiftKey) {
      if (itemType === 'blank') {
      } else {
        if (selectedItems.value[itemType].has(id)) {
          selectedItems.value[itemType].delete(id);
        } else {
          selectedItems.value[itemType].add(id);
        }
      }
      e.stopPropagation();
    } else {
      if (itemType === 'blank') {
        selectedItems.value = {
          node: new Set(),
          wire: new Set(),
          text: new Set(),
        };
      } else {
        if (!selectedItems.value[itemType].has(id)) {
          selectedItems.value = {
            node: new Set(),
            wire: new Set(),
            text: new Set(),
          };
          selectedItems.value[itemType].add(id);
        }
      }
      e.stopPropagation();
    }
    // TODO: implement
  }
  // TODO: implement
};
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
          <svg
            class="full-height full-width"
            ref="svgRef"
            v-if="diagram !== undefined"
            @mousemove="e => onMove(e)"
            @wheel="e => onWheel(e)"
          >
            <g
              :transform="`scale(${diagram?.viewport.scale}), translate(${diagram?.viewport.x}, ${diagram?.viewport.y})`"
            >
              <g>
                <g v-for="[id, wire] of diagram.wires.entries()">
                  <path
                    :stroke="'var(--color-text)'"
                    :stroke-width="2"
                    :fill="'none'"
                  />
                </g>
              </g>
              <g>
                <g
                  v-for="[id, node] of diagram.nodes.entries()"
                  @click="e => onClick(e, 'node', id)"
                >
                  <circle
                    :cx="node.x"
                    :cy="node.y"
                    :r="10"
                    :fill="'var(--color-text)'"
                  />
                </g>
              </g>
            </g>
          </svg>
        </ElMain>
        <ElFooter class="editor-footer" height="2rem">
          <ElRow class="full-height" :align="'middle'">
            <div class="margin-in-line">{{ editorStatus }}</div>
            <div class="margin-in-line" v-if="diagram !== undefined">
              {{
                `${diagram.viewport.x.toFixed(2)}:${diagram.viewport.y.toFixed(
                  2
                )} # ${diagram.viewport.scale.toFixed(2)}x`
              }}
            </div>
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
.margin-in-line {
  margin: 0 10px;
}
</style>
