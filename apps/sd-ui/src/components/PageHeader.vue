<template>
  <h1 class="text-3xl">{{ title }}</h1>
</template>

<script setup lang="ts">
defineProps({
  title: {
    type: String,
    required: true,
  },
});
</script>
