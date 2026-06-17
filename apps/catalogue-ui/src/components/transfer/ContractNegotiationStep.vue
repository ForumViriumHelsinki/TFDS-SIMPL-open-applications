<template>
  <ProgressScreen
    title="Contract Negotiation"
    process-name="contract-negotiation"
    :status="mappedStatus"
    :process-error="negotiationStatusError"
    :started-at="negotiationStatus?.createdAt"
    :process-details="humanizedStatusDetails"
  >
    <template #inProgressDescription>
      The contract for "{{ resourceDescriptionSummary?.title }}" is being negotiated. The process
      might take a few minutes
    </template>
    <template #successDescription>
      The contract negotiation has been completed, you can proceed to the next step.
    </template>
    <template #failedDescription>
      The negotiation has failed. Please retry or exit the process. If the problem persists contact
      the admin.</template
    >
  </ProgressScreen>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import ProgressScreen from './ProgressScreen.vue';
import { humanizeContractNegotiationStatus } from '../../util/contractNegotiation';
import { useContractNegotiationStore, useResourceDescriptionStore } from '@/stores';
import { storeToRefs } from 'pinia';
import { mapContractStatusToProgress } from '../../util/progressStatus';

const mappedStatus = computed(() => mapContractStatusToProgress(negotiationStatus.value?.state));

const humanizedStatusDetails = computed(() => {
  if (!negotiationStatus.value) {
    return {};
  }
  return {
    '': humanizeContractNegotiationStatus(negotiationStatus.value),
  };
});

const resourceDescriptionStore = useResourceDescriptionStore();
const { resourceDescriptionSummary } = storeToRefs(resourceDescriptionStore);

const contractNegotiationStore = useContractNegotiationStore();
const { negotiationStatus, negotiationStatusError } = storeToRefs(contractNegotiationStore);
</script>
