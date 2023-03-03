<script setup lang="ts">
import AsyncApp from './AsyncApp.vue';
import { useDark } from '@vueuse/core';
useDark();
</script>
<template>
  <Suspense>
    <AsyncApp></AsyncApp>
  </Suspense>
</template>
