<template>
  <div class="mb-4">
    <h1 class="page-title text-3xl">{{ title }}</h1>
    <p class="page-subtitle break-all text-xl" v-if="subtitle?.length">{{ subtitle }}</p>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string;
    subtitle?: string;
  }>(),
  {
    subtitle: '',
  }
);
</script>
