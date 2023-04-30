<script setup lang="ts">
import { Diagram } from '@/util/SeqLogic';
import { ElTabPane, ElTabs } from 'element-plus';
import { ref } from 'vue';
const props = defineProps<{
  diagram: Diagram;
  id: string;
}>();
const node = ref(props.diagram.nodes.get(props.id));
if (node.value === undefined) {
  throw new Error(`Node ${props.id} not found`);
}
const commit = () => {
  if (node.value === undefined) {
    throw new Error(`Node not found`);
  }
  props.diagram.nodes.set(props.id, node.value);
  props.diagram.commit();
};
const validTabNames = ['general', 'clock'] as const;
const isValidTabName = (tab: string | number): tab is ValidTabName =>
  typeof tab == 'string' && (validTabNames as readonly unknown[]).includes(tab);
type ValidTabName = (typeof validTabNames)[number];
const onTabChange = (tab: ValidTabName) => {
  if (!node.value) return;
  if (tab === 'general') {
    node.value.powered = false;
    commit();
  } else if (tab === 'clock') {
    node.value.powered = {
      duration: 1000,
      offset: 0,
    };
    commit();
  }
};
const tab = ref<ValidTabName>(
  typeof node.value.powered !== 'boolean' ? 'clock' : 'general'
);
</script>
<template>
  <div v-if="node">
    <ElTabs
      v-model="tab"
      @tab-change="tab => isValidTabName(tab) && onTabChange(tab)"
    >
      <ElTabPane label="General" :name="'general'">
        
       </ElTabPane>
      <ElTabPane label="Clock" :name="'clock'"> </ElTabPane>
    </ElTabs>
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
