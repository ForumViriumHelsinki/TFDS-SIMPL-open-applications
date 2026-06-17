<template>
  <ProgressScreen
    title="Transfer process"
    process-name="transfer-process"
    :status="mappedStatus"
    :process-error="transferProcessError"
    :started-at="transferProcessStartedAt"
    :process-details="humanizedStatusDetails"
  >
    <template #inProgressDescription>
      The selected element is being transfered to the provided address. The process might take a few
      minutes
    </template>
    <template #successDescription> The transfer has been completed. </template>
    <template #failedDescription>
      The transfer process has failed. Please retry or exit the process. If the problem persists
      contact the admin.</template
    >
  </ProgressScreen>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { humanizeTransferProcessStatus } from '../../util/transferProcess';
import { useTransferProcessStore } from '@/stores';
import { storeToRefs } from 'pinia';
import ProgressScreen from './ProgressScreen.vue';
import { mapContractStatusToProgress } from '../../util/progressStatus';

const mappedStatus = computed(() =>
  mapContractStatusToProgress(transferProcessStatus.value?.state)
);

const transferProcessStore = useTransferProcessStore();

const { transferProcessStatus, transferProcessError, transferProcessStartedAt } =
  storeToRefs(transferProcessStore);

const humanizedStatusDetails = computed(() => {
  if (!transferProcessStatus.value) {
    return {};
  }
  return {
    '': humanizeTransferProcessStatus(transferProcessStatus.value, transferProcessStartedAt.value),
  };
});
</script>
