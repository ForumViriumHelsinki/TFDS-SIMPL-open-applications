<template>
  <div class="properties-table flex flex-col gap-2">
    <div
      v-for="(value, key) in jsonObject"
      :key="key"
      class="properties-table-row flex flex-row justify-between py-2 first:border-t"
    >
      <div class="property-label font-bold">{{ camelCaseToSpacedAndCapitalized(key) }}</div>
      <div class="property-value">{{ value ?? '' }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
const camelCaseToSpacedAndCapitalized = (camelCase: string | number) =>
  String(camelCase)
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .replace('Id', 'ID')
    .trim();

defineProps<{
  jsonObject: any;
}>();
</script>
