<template>
  <SearchedProperties
    :input="inputProperties"
    :level="0"
    class="latest-search-parameters flex flex-col gap-2"
  />
</template>

<script setup lang="ts">
import SearchedProperties from './SearchedProperties.vue';
import type { SearchAdvancedRequestBody } from 'types/searchApi';

defineProps<{
  inputProperties: SearchAdvancedRequestBody | string;
}>();
</script>
