<script setup lang="ts">
import {
  ElMain,
  ElContainer,
  ElHeader,
  ElButton,
  ElMessageBox,
  ElFooter,
  ElRow,
  ElMessage,
} from 'element-plus';
import { Close } from '@element-plus/icons-vue';
import LRMenu from './components/LRMenu.vue';
import { deleteFile } from '@/util/database';
import { Diagram, getBlankDiagramStorage } from '@/util/SeqLogic';
import { promiseRef } from '@/util/promiseRef';
import { readableFilename } from '@/util/readable';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useMousePressed } from '@vueuse/core';
import { useMouseInElement } from '@vueuse/core';
import Node from './diagram-view/Node.vue';
import { DiagramStorage } from '@/util/SeqLogic';
import { isDiagramStorage } from '@/util/SeqLogic';
import Wire from './diagram-view/Wire.vue';
import TextView from './diagram-view/TextView.vue';
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
// - wheel to zoom
// - ctrl drag to move
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
//

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
type ItemsType = `${ItemType}s`;
type SelectedItems = Record<ItemsType, Set<string>>;
const selectedItems = ref<SelectedItems>({
  nodes: new Set(),
  wires: new Set(),
  texts: new Set(),
});
const clearSelectedItems = () => {
  selectedItems.value = {
    nodes: new Set(),
    wires: new Set(),
    texts: new Set(),
  };
};
const svgRef = ref<SVGSVGElement>();
const mouse = useMouseInElement(svgRef);
const mouseInView = computed(() => {
  const [x, y] = [mouse.elementX.value, mouse.elementY.value];
  const scale = diagram.value?.viewport.scale ?? 1;
  return {
    x: x / scale - (diagram.value?.viewport.x ?? 0),
    y: y / scale - (diagram.value?.viewport.y ?? 0),
  };
});
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
const onCopy = () => {
  if (diagram.value) {
    const storage = diagram.value.extract(
      selectedItems.value.nodes,
      selectedItems.value.texts
    );
    navigator.clipboard.writeText(JSON.stringify(storage));
  }
};
const onPaste = () => {
  if (diagram.value) {
    navigator.clipboard.readText().then(text => {
      try {
        const storage = JSON.parse(text);
        if (isDiagramStorage(storage)) {
          selectedItems.value =
            diagram.value?.merge(storage) ?? selectedItems.value;
        }
      } catch (e) {
        console.error(e);
        ElMessageBox.alert('Failed to paste');
      }
    });
  }
};
const onSave = () => {
  if (diagram.value) {
    diagram.value.saveFile(props.pathname);
  }
};
const onEscape = () => {
  if (editorStatus.value !== 'idle') {
    diagram.value?.undo();
    editorStatus.value = 'idle';
  }
};
const addNodeProc = () => {
  if (!diagram.value) {
    throw new Error('diagram is undefined');
  }
  return diagram.value?.addNode({
    x: mouseInView.value.x,
    y: mouseInView.value.y,
    powered: false,
  });
};
const getNodeAtMouse = () => {
  if (!diagram.value) {
    throw new Error('diagram is undefined');
  }
  let result = undefined as string | undefined;
  for (const [id, node] of diagram.value.nodes.entries()) {
    const [dx, dy] = [
      node.x - mouseInView.value.x,
      node.y - mouseInView.value.y,
    ];
    if (dx * dx + dy * dy < 100) {
      result = id;
    }
  }
  return result;
};
const addWireProc = () => {
  if (!diagram.value) {
    throw new Error('diagram is undefined');
  }
  const end = getNodeAtMouse() ?? addNodeProc();
  for (const id of selectedItems.value.nodes) {
    diagram.value.addWire({
      start: id,
      end,
      not: false,
    });
  }
};
const addTextProc = () => {
  if (!diagram.value) {
    throw new Error('diagram is undefined');
  }
  return diagram.value?.addText({
    x: mouseInView.value.x,
    y: mouseInView.value.y,
    text: 'New Text',
    scale: 1,
  });
};
const onAddNode = () => {
  onEscape();
  editorStatus.value = 'add-node';
  clearSelectedItems();
  addNodeProc();
  diagram.value?.saveHistory();
};
const onAddWire = () => {
  onEscape();
  if (selectedItems.value.nodes.size === 0) {
    ElMessage.error('No node selected');
    return;
  }
  editorStatus.value = 'add-wire';
  selectedItems.value.wires = new Set();
  selectedItems.value.texts = new Set();
  addWireProc();
  diagram.value?.saveHistory();
};
const onAddText = () => {
  onEscape();
  editorStatus.value = 'add-text';
  clearSelectedItems();
  addTextProc();
  diagram.value?.saveHistory();
};
const onKeyUp = (e: KeyboardEvent) => {
  if (mousePath.value !== undefined) {
    return;
  }
  if (e.ctrlKey) {
    if (editorStatus.value !== 'idle') {
      return;
    }
    if (e.key === 'c') {
      onCopy();
    } else if (e.key === 'v') {
      onPaste();
    } else if (e.key === 'z') {
      onUndo();
    } else if (e.key === 'y') {
      onRedo();
    } else if (e.key === 's') {
      onSave();
    }
  } else if (!e.shiftKey) {
    if (e.key === 'a') {
      onAddNode();
    } else if (e.key === 'w') {
      onAddWire();
    } else if (e.key === 't') {
      onAddText();
    } else if (e.key === 'Escape') {
      onEscape();
    } else if (e.key === 'Delete') {
      if (editorStatus.value !== 'idle') {
        return;
      }
      selectedItems.value.nodes.forEach(id => {
        diagram.value?.removeNode(id);
      });
      selectedItems.value.wires.forEach(id => {
        diagram.value?.removeWire(id);
      });
      selectedItems.value.texts.forEach(id => {
        diagram.value?.removeText(id);
      });
      diagram.value?.saveHistory();
      clearSelectedItems();
      editorStatus.value = 'idle';
    }
  }
};
window.addEventListener('keyup', onKeyUp);
const nextTickTimer = setInterval(() => {
  if (diagram.value) {
    diagram.value.nextTick();
  }
}, 1000 / 60);
onUnmounted(() => {
  window.removeEventListener('keyup', onKeyUp);
  clearInterval(nextTickTimer);
});
const onWheel = (e: WheelEvent) => {
  if (diagram.value) {
    const [x, y] = [mouse.elementX.value, mouse.elementY.value];
    diagram.value.viewport.x -= x / diagram.value.viewport.scale;
    diagram.value.viewport.y -= y / diagram.value.viewport.scale;
    diagram.value.viewport.scale *= 1 - e.deltaY / 1000;
    diagram.value.viewport.x += x / diagram.value.viewport.scale;
    diagram.value.viewport.y += y / diagram.value.viewport.scale;
    e.stopPropagation();
  }
};
/**
 * x, y in view
 */
interface MousePath {
  x: number;
  y: number;
  mode: 'move-viewport' | 'drag-selected' | 'box-select' | 'box-toggle-select';
  activated: boolean;
}
const mousePath = ref<MousePath>();
const onMouseDown = (
  e: MouseEvent,
  itemType: ItemType | 'blank',
  id: string
) => {
  e.stopPropagation();
  if (editorStatus.value === 'idle') {
    mousePath.value = {
      x: mouseInView.value.x,
      y: mouseInView.value.y,
      mode: e.ctrlKey
        ? 'move-viewport'
        : e.shiftKey
        ? 'box-toggle-select'
        : itemType == 'blank'
        ? 'box-select'
        : 'drag-selected',
      activated: false,
    };
    if (e.shiftKey) {
      if (itemType === 'blank') {
      } else {
        const itemsType = itemType + 's' as ItemsType;
        if (selectedItems.value[itemsType].has(id)) {
          selectedItems.value[itemsType].delete(id);
        } else {
          selectedItems.value[itemsType].add(id);
        }
      }
    } else if (!e.ctrlKey) {
      if (itemType === 'blank') {
        clearSelectedItems();
      } else {
        const itemsType = itemType + 's' as ItemsType;
        if (!selectedItems.value[itemsType].has(id)) {
          clearSelectedItems();
          selectedItems.value[itemsType].add(id);
        }
      }
    }
  }
};
const onMouseUp = () => {
  if (mousePath.value !== undefined) {
    if (!diagram.value) return;
    if (
      mousePath.value.mode === 'box-select' ||
      mousePath.value.mode === 'box-toggle-select'
    ) {
      const [left, top] = [
        Math.min(mousePath.value.x, mouseInView.value.x),
        Math.min(mousePath.value.y, mouseInView.value.y),
      ];
      const [width, height] = [
        Math.abs(mousePath.value.x - mouseInView.value.x),
        Math.abs(mousePath.value.y - mouseInView.value.y),
      ];
      const inRange = (x: number, y: number) =>
        x >= left && x < left + width && y >= top && y < top + height;
      if (mousePath.value.mode === 'box-select') {
        clearSelectedItems();
      }
      for (const [id, node] of diagram.value.nodes.entries()) {
        if (inRange(node.x, node.y)) {
          if (
            mousePath.value.mode === 'box-toggle-select' &&
            selectedItems.value.nodes.has(id)
          ) {
            selectedItems.value.nodes.delete(id);
          } else {
            selectedItems.value.nodes.add(id);
          }
        }
      }
      for (const [id, text] of diagram.value.texts.entries()) {
        if (inRange(text.x, text.y)) {
          if (
            mousePath.value.mode === 'box-toggle-select' &&
            selectedItems.value.texts.has(id)
          ) {
            selectedItems.value.texts.delete(id);
          } else {
            selectedItems.value.texts.add(id);
          }
        }
      }
    }
    mousePath.value = undefined;
  } else if (editorStatus.value === 'add-node') {
    if (!diagram.value) return;
    diagram.value.saveHistory();
  } else if (editorStatus.value === 'add-text') {
    if (!diagram.value) return;
    diagram.value.saveHistory();
  } else if (editorStatus.value === 'add-wire') {
    if (!diagram.value) return;
    diagram.value.saveHistory();
  }
};
const onMove = (e: MouseEvent) => {
  if (mousePath.value !== undefined) {
    if (!diagram.value) return;
    if (mousePath.value.mode == 'move-viewport') {
      diagram.value.viewport.x += e.movementX / diagram.value.viewport.scale;
      diagram.value.viewport.y += e.movementY / diagram.value.viewport.scale;
    } else if (mousePath.value.mode == 'drag-selected') {
      const [dx, dy] = [
        mouseInView.value.x - mousePath.value.x,
        mouseInView.value.y - mousePath.value.y,
      ];
      if (!mousePath.value.activated && Math.sqrt(dx * dx + dy * dy) > 5) {
        mousePath.value.activated = true;
        diagram.value.saveHistory();
      }
      if (mousePath.value.activated) {
        diagram.value.undo();
        for (const id of selectedItems.value.wires) {
          const wire = diagram.value?.wires.get(id);
          if (wire) {
            selectedItems.value.nodes.add(wire.start);
            selectedItems.value.nodes.add(wire.end);
          }
        }
        for (const id of selectedItems.value.nodes) {
          const node = diagram.value?.nodes.get(id);
          if (node) {
            node.x += mouseInView.value.x - mousePath.value.x;
            node.y += mouseInView.value.y - mousePath.value.y;
            diagram.value.nodes.set(id, node);
          }
        }
        for (const id of selectedItems.value.texts) {
          const text = diagram.value?.texts.get(id);
          if (text) {
            text.x += mouseInView.value.x - mousePath.value.x;
            text.y += mouseInView.value.y - mousePath.value.y;
            diagram.value.texts.set(id, text);
          }
        }
        diagram.value.saveHistory();
      }
    }
  } else if (editorStatus.value === 'add-node') {
    if (!diagram.value) return;
    diagram.value.undo();
    addNodeProc();
    diagram.value.saveHistory();
  } else if (editorStatus.value === 'add-text') {
    if (!diagram.value) return;
    diagram.value.undo();
    addTextProc();
    diagram.value.saveHistory();
  } else if (editorStatus.value === 'add-wire') {
    if (!diagram.value) return;
    diagram.value.undo();
    addWireProc();
    diagram.value.saveHistory();
  }
};
</script>
<template>
  <ElContainer class="root">
    <ElHeader class="root-header">
      <LRMenu>
        <ElButton :type="'danger'" @click="onClose()" :icon="Close"> </ElButton>
        <div style="margin-left: 10px">
          {{ diagram?.modified ? '(Unsaved)' : '' }}
        </div>
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
            @mousedown="e => onMouseDown(e, 'blank', '')"
            @mouseup="onMouseUp()"
          >
            <g
              :transform="`scale(${diagram?.viewport.scale}), translate(${diagram?.viewport.x}, ${diagram?.viewport.y})`"
            >
              <g>
                <path
                  :stroke="'var(--color-text)'"
                  :stroke-width="2"
                  :fill="'none'"
                  d="M -40 0 L 1920 0 M 0 -40 L 0 1080"
                ></path>
              </g>
              <g
                v-for="[id, wire] of diagram.wires.entries()"
                @mousedown="e => onMouseDown(e, 'wire', id)"
              >
                <Wire
                  :wire="wire"
                  :selected="selectedItems.wires.has(id)"
                  :start="
                    diagram.nodes.get(wire.start) ?? {
                      x: 0,
                      y: 0,
                      powered: false,
                    }
                  "
                  :end="
                    diagram.nodes.get(wire.end) ?? {
                      x: 0,
                      y: 0,
                      powered: false,
                    }
                  "
                  :start-status="diagram.getNodeStatus(wire.start)"
                ></Wire>
              </g>
              <g
                v-for="[id, node] of diagram.nodes.entries()"
                @mousedown="e => onMouseDown(e, 'node', id)"
              >
                <Node
                  :node="node"
                  :selected="selectedItems.nodes.has(id)"
                  :status="diagram.getNodeStatus(id)"
                />
              </g>
              <g
                v-for="[id, text] of diagram.texts.entries()"
                @mousedown="e => onMouseDown(e, 'text', id)"
              >
                <TextView :text="text" :selected="selectedItems.texts.has(id)" />
              </g>
              <g
                v-if="
                  mousePath?.mode == 'box-select' ||
                  mousePath?.mode == 'box-toggle-select'
                "
              >
                <rect
                  :x="Math.min(mousePath.x, mouseInView.x)"
                  :y="Math.min(mousePath.y, mouseInView.y)"
                  :width="Math.abs(mousePath.x - mouseInView.x)"
                  :height="Math.abs(mousePath.y - mouseInView.y)"
                  :stroke="'var(--el-color-primary)'"
                  :stroke-width="1"
                  :stroke-dasharray="'3 2'"
                  :fill="'none'"
                />
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
