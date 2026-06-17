<template>
  <div class="flex flex-col">
    <div class="text-secondary mb-4 flex flex-row gap-2">
      <SIcon :name="iconName" class="text-secondary h-5 w-auto flex-grow-0" />
      <div class="result-resource-type font-semibold">{{ _.capitalize(resourceType) }}&#8203;</div>
      <div
        v-if="item?.format"
        class="bg-secondary h-1 w-1 flex-shrink-0 self-center rounded-full"
      ></div>
      <div v-if="item?.format" class="resource-format uppercase">{{ item.format }}</div>
    </div>
    <p
      class="result-title font-semibold"
      :class="{ 'text-secondary text-2xl': isLarge, 'text-xl': !isLarge }"
    >
      {{ item?.title }}
    </p>
    <p v-if="item?.providedBy" class="text-base" :class="{ 'mt-4': isLarge }">
      {{ item.providedBy }}
    </p>
    <p v-if="item?.description" class="result-description mt-4">
      {{ item.description }}
    </p>
  </div>
</template>

<script setup lang="ts">
import _ from 'lodash';
import { computed } from 'vue';
import {
  SIcon,
  getResourceDescriptionSummaryFromDocument,
  getResourceDescriptionSummaryFromResult,
  getResourceTypeIcon,
} from '@simpl/vue-components';
import type { SearchAPIResult, SearchAPISelfDescriptionDocument } from 'types/searchApi';

const props = withDefaults(
  defineProps<{
    isLarge?: boolean;
    searchResult?: SearchAPIResult;
    resourceDescriptionDocument?: SearchAPISelfDescriptionDocument | null;
  }>(),
  {
    isLarge: false,
    showMoreDetails: false,
  }
);

const item = computed(() => {
  if (props.searchResult) {
    return getResourceDescriptionSummaryFromResult(props.searchResult);
  }

  if (props.resourceDescriptionDocument) {
    return getResourceDescriptionSummaryFromDocument(props.resourceDescriptionDocument);
  }
});

const resourceType = computed(() =>
  item.value && 'offeringType' in item.value && typeof item.value.offeringType === 'string'
    ? item.value.offeringType
    : ''
);
const iconName = computed(() => getResourceTypeIcon(resourceType.value));
</script>
