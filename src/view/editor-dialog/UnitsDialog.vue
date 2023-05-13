<script setup lang="ts">
import { getUnits } from '@/util/SeqLogic/units';
import { promiseRef } from '@/util/promiseRef';
import {
  ElTabs,
  ElTabPane,
  ElInput,
  ElCard,
  ElRow,
  ElScrollbar,
} from 'element-plus';
import { computed, ref } from 'vue';
defineEmits<{
  (event: 'add', name: string): void;
}>();
const text = ref('');
const allUnits = promiseRef(getUnits(), []);
const units = computed(() =>
  text.value == ''
    ? allUnits.value
    : allUnits.value.filter(unit =>
        unit.toLowerCase().includes(text.value.toLowerCase())
      )
);
</script>
<template>
  <ElInput v-model="text"></ElInput>
  <ElCard v-for="name of units" @click="$emit('add', name)" class="unit-card">
    <ElRow :justify="'center'" :align="'middle'">
      {{ name }}
    </ElRow>
  </ElCard>
</template>

<style lang="scss" scoped>
.unit-card {
  margin: 5px;
  :hover {
    cursor: pointer;
    background-color: var(--color-background-mute);
  }
}
</style>
