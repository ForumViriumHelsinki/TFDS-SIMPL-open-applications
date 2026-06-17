<template>
  <Card
    ref="searchResultElement"
    class="search-result bg-surface-1 flex flex-col"
    :data-sd-id="selfDescriptionID"
  >
    <template #content>
      <ResourceDescriptionSummary show-more-details :search-result="item" />
    </template>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Card } from 'primevue';
import type { SearchAPIResult } from 'types/searchApi';
import ResourceDescriptionSummary from '@/components/resourceDescription/ResourceDescriptionSummary.vue';

const props = defineProps<{
  item: SearchAPIResult;
  showJson: boolean;
}>();

const selfDescriptionID = computed(() => props.item.claimsGraphUri?.[0] ?? '');
</script>
