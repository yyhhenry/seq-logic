<script setup lang="ts">
import { ElTabs, ElTabPane, ElRow } from 'element-plus';
import { ref } from 'vue';
const validTabNames = ['file', 'user-interface', 'add', 'edit'] as const;
type ValidTabName = typeof validTabNames[number];
const tab = ref<ValidTabName>('file');
</script>
<template>
  <ElTabs v-model="tab">
    <ElTabPane label="File" :name="'file'"> 
      <div>
        
      </div>
    </ElTabPane>
    <ElTabPane label="User Interface" :name="'user-interface'"> </ElTabPane>
    <ElTabPane label="Add" :name="'add'"> </ElTabPane>
    <ElTabPane label="Edit" :name="'edit'"> </ElTabPane>
  </ElTabs>
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
