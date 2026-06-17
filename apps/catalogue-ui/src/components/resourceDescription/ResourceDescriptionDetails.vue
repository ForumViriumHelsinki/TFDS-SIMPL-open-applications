<template>
  <OfferDetails v-if="isConsumerEnvironment()" :document @get-data-click="emit('getDataClick')" />
  <ResourceDescriptionRendererHost :input="resourceDescriptionDocument" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { SearchAPISelfDescriptionDocument } from 'types/searchApi';
import { ResourceDescriptionRendererHost, filterToReadableSdDocument } from '@simpl/vue-components';
import OfferDetails from './OfferDetails.vue';
import { isConsumerEnvironment } from '@/util/getEnv';

const props = defineProps<{
  document: SearchAPISelfDescriptionDocument;
}>();

const emit = defineEmits<{
  (e: 'getDataClick'): void;
}>();

const resourceDescriptionDocument = computed(() => {
  return filterToReadableSdDocument(props.document.credentialSubject);
});
</script>
