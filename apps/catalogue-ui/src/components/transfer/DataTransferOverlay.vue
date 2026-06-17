<template>
  <SOverlay
    id="data-transfer-overlay"
    v-model="isOverlayVisible"
    :title="resourceDescriptionSummary?.title"
    class="data-transfer-overlay h-full"
  >
    <DataTransferWizard />
    <template #footer>
      <div class="ml-auto flex justify-end gap-4">
        <SButton
          id="transfer-wizard-cancel-button"
          label="Cancel"
          severity="secondary"
          icon="return-down-back"
          icon-pos="left"
          @click="closeOverlay"
        />
        <SButton
          id="transfer-wizard-next-button"
          :disabled="!steps[step].isNextStepAvailable"
          :label="steps[step].nextStepLabel ?? 'Next step'"
          severity="primary"
          :icon="steps[step].nextStepIcon ?? 'return-down-forward'"
          @click="goNextStep()"
        />
      </div>
    </template>
  </SOverlay>
</template>

<script setup lang="ts">
import { SButton, SOverlay } from '@simpl/vue-components';
import type { SearchAPISelfDescriptionDocument } from 'types/searchApi';
import DataTransferWizard from './DataTransferWizard.vue';
import { useDataTransferWizardStore, useResourceDescriptionStore } from '@/stores';
import { storeToRefs } from 'pinia';

const { setResourceDescriptionDocument } = useResourceDescriptionStore();
const resourceDescriptionStore = useResourceDescriptionStore();
const { resourceDescriptionSummary } = storeToRefs(resourceDescriptionStore);

const dataTransferStore = useDataTransferWizardStore();
const { goNextStep, closeOverlay } = dataTransferStore;
const { steps, step, isOverlayVisible } = storeToRefs(dataTransferStore);

const props = defineProps<{
  document: SearchAPISelfDescriptionDocument;
}>();

setResourceDescriptionDocument(props.document);
</script>
