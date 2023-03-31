<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';

const props = defineProps<{
  title: string;
}>();
const titleStored = ref(document.title);
const updateTitle = () => {
  document.title = props.title;
};
onMounted(updateTitle);
watch(() => props.title, updateTitle);
onUnmounted(() => {
  document.title = titleStored.value;
});
</script>
<template>
</template>
