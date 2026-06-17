<template>
  <div class="search-tabs">
    <STabs id="search-tabs" :tabs="tabs">
      <template #quick-search>
        <QuickSearch :search="search" />
      </template>
      <template #advanced-search>
        <AdvancedSearch />
      </template>
    </STabs>
  </div>
</template>

<script setup lang="ts">
import { STabs } from '@simpl/vue-components';
import AdvancedSearch from './AdvancedSearch.vue';
import QuickSearch from './QuickSearch.vue';

defineProps<{
  search: string;
}>();

const tabs = [
  { tabName: 'quick-search', tabTitle: 'Quick search' },
  { tabName: 'advanced-search', tabTitle: 'Advanced search' },
];
</script>
