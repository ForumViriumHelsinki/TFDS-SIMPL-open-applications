<template>
  <div class="border-t">
    <div class="search-results-details mb-10 pt-3">
      <p class="mb-1 text-xl">
        <span class="number-of-results">{{ resultCount }}</span> result{{
          resultCount !== 1 ? 's' : ''
        }}
        {{ resultsNumberSuffix }}
      </p>
      <slot name="details" />
    </div>
    <div class="search-results flex flex-col gap-4 md:grid md:grid-cols-2">
      <ResourceDescriptionCard
        v-for="item in result"
        :key="item.claimsGraphUri?.[0]"
        :search-result="item"
        :show-more-details="true"
        :card-button="{
          href: `/resourceDescriptions/${item.claimsGraphUri?.[0]}`,
        }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { SearchAPIResult } from 'types/searchApi';
import { ResourceDescriptionCard } from '@simpl/vue-components';

const props = withDefaults(
  defineProps<{
    result: SearchAPIResult[] | null;
    showJson?: boolean;
    resultsNumberSuffix?: string;
  }>(),
  {
    showJson: false,
  }
);

const resultCount = computed(() => {
  return props.result?.length ?? 0;
});
</script>
