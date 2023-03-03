<script setup lang="ts">
import AsyncApp from './AsyncApp.vue';
import { useDark } from '@vueuse/core';
const isSystemDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
const isDark = useDark();
isDark.value = isSystemDarkMode;
</script>
<template>
  <Suspense>
    <AsyncApp></AsyncApp>
  </Suspense>
</template>
