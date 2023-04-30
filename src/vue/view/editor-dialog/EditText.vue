<script setup lang="ts">
import { Diagram } from '@/util/SeqLogic';
import {
  ElButton,
  ElCol,
  ElInput,
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
const text = ref(props.diagram.texts.get(props.id));
if (text.value === undefined) {
  throw new Error(`Text ${props.id} not found`);
}
const commit = () => {
  if (text.value === undefined) {
    throw new Error(`Text not found`);
  }
  text.value.text = text.value.text.trim();
  props.diagram.texts.set(props.id, text.value);
  props.diagram.commit();
};
</script>
<template>
  <div v-if="text">
    <ElInput v-model="text.text" @change="commit()"> </ElInput>
    <ElRow :justify="'space-between'" :align="'middle'" style="margin:10px">
      <div class="header-text">Scale (x16pt)</div>
      <ElInputNumber v-model="text.scale" :min="0.5" :max="2" :step="0.1">
      </ElInputNumber>
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
