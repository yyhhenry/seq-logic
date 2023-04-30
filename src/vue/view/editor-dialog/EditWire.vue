<script setup lang="ts">
import { Diagram } from '@/util/SeqLogic';
import {
  ElButton,
  ElCol,
  ElInputNumber,
  ElRow,
  ElSwitch,
  ElTabPane,
  ElTabs,
} from 'element-plus';
import { computed, ref } from 'vue';
const props = defineProps<{
  diagram: Diagram;
  id: string;
}>();
const wire = ref(props.diagram.wires.get(props.id));
if (wire.value === undefined) {
  throw new Error(`Wire ${props.id} not found`);
}
const commit = () => {
  if (wire.value === undefined) {
    throw new Error(`Wire not found`);
  }
  props.diagram.wires.set(props.id, wire.value);
  props.diagram.commit();
};
const onReverse = () => {
  if (wire.value === undefined) {
    throw new Error(`Wire not found`);
  }
  [wire.value.start, wire.value.end] = [wire.value.end, wire.value.start];
  commit();
};
</script>
<template>
  <div v-if="wire">
    <ElRow :justify="'space-between'" :align="'middle'">
        <ElSwitch
          v-model="wire.not"
          :active-text="'Not Gate'"
          :inactive-text="'None'"
          @change="commit()"
        ></ElSwitch>
        <ElButton v-if="wire.not" @click="onReverse()" class="header-text"
          >Reverse</ElButton
        >
    </ElRow>
  </div>
</template>

<style lang="scss" scoped>
.header-text {
  user-select: none;
  font-size: larger;
  font-family: 'Lucida Sans', 'Lucida Sans Regular', 'Lucida Grande',
    'Lucida Sans Unicode', Geneva, Verdana, sans-serif;
}
</style>
