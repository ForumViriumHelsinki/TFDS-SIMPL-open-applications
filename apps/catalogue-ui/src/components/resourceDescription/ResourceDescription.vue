<template>
  <DataTransferOverlay
    v-if="isConsumerEnvironment() && actualDocument"
    :document="actualDocument"
  />
  <SLoadingSpinner id="resource-description-loading" v-if="isLoading" />
  <SStatusMessage
    id="self-description-error"
    v-else-if="selfDescriptionError"
    :title="selfDescriptionError.title"
    variant="error"
  >
    {{ selfDescriptionError.description }}
  </SStatusMessage>
  <div v-else-if="actualDocument" class="self-description flex flex-col gap-10">
    <ResourceDescriptionSummary is-large :resource-description-document="actualDocument" />
    <ResourceDescriptionDetails :document="actualDocument" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { SLoadingSpinner, SStatusMessage, type PossibleUIError } from '@simpl/vue-components';
import { useCatalogueSelfDescriptions } from '@/services/composables/useCatalogueSelfDescriptions';
import type { SearchAPISelfDescriptionDocument } from 'types/searchApi';
import ResourceDescriptionSummary from './ResourceDescriptionSummary.vue';
import ResourceDescriptionDetails from './ResourceDescriptionDetails.vue';
import DataTransferOverlay from '../transfer/DataTransferOverlay.vue';
import { isConsumerEnvironment } from '@/util/getEnv';

const props = defineProps<{
  id: string;
}>();

const actualDocument = ref<SearchAPISelfDescriptionDocument | null>(null);
const selfDescriptionError = ref<PossibleUIError>(null);
const isLoading = ref(false);

onMounted(async () => {
  isLoading.value = true;
  const { data, error } = await useCatalogueSelfDescriptions(props.id);
  if (error.value) {
    selfDescriptionError.value = error.value;
  } else if (data.value) {
    actualDocument.value = data.value;
  }
  isLoading.value = false;
});
</script>
