<script setup lang="ts">
import { Diagram } from '@/util/SeqLogic';
import {
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
const tab = computed({
  get: () => (typeof node.value?.powered !== 'boolean' ? 'clock' : 'general'),
  set: tab => {
    if (isValidTabName(tab)) {
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
    }
  },
});
</script>
<template>
  <div v-if="node">
    <ElTabs v-model="tab">
      <ElTabPane label="General" :name="'general'">
        <ElRow :justify="'center'" :align="'middle'">
          <ElSwitch
            v-if="typeof node.powered === 'boolean'"
            v-model="node.powered"
            :active-text="'Powered'"
            :inactive-text="'Off'"
            @change="commit()"
          ></ElSwitch>
        </ElRow>
      </ElTabPane>
      <ElTabPane label="Clock" :name="'clock'">
        <div v-if="typeof node.powered === 'object'">
          <ElRow :justify="'space-between'" :align="'middle'">
            <span class="header-text margin-right">Duration (ms)</span>
            <ElInputNumber
              v-model="node.powered.duration"
              :controls-position="'right'"
              :min="200"
              :max="10000"
              :step="100"
              @change="commit()"
            >
            </ElInputNumber>
          </ElRow>
          <ElRow :justify="'space-between'" :align="'middle'">
            <span class="header-text margin-right">Offset (ms)</span>
            <ElInputNumber
              v-model="node.powered.offset"
              :controls-position="'right'"
              :min="0"
              :max="2 * node.powered.duration"
              :step="100"
              @change="commit()"
            >
            </ElInputNumber>
          </ElRow>
        </div>
      </ElTabPane>
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
.margin-right {
  margin-right: 10px;
}
</style>
