import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { useIntervalFn } from '@vueuse/core';
import type { PossibleUIError } from '@simpl/vue-components';
import { useContractNegotiationStore } from './contractNegotiation';
import { useTransferProcess } from '@/services/composables/useTransferProcess';
import type { EdcTransferProcessStatusResponse, EdcTransferRequestData } from 'types/contracts';
import { useResourceSharingMethodStore } from './resourceSharingMethod';

export const useTransferProcessStore = defineStore('transferProcess', () => {
  const transferRequestData = computed<EdcTransferRequestData | null>(() => {
    const contractNegotiationStore = useContractNegotiationStore();
    const resourceSharingMethodStore = useResourceSharingMethodStore();

    if (
      !contractNegotiationStore.negotiationStatus?.contractAgreementId ||
      !contractNegotiationStore.negotiationStatus?.counterPartyAddress ||
      !resourceSharingMethodStore.resourceAddress ||
      !resourceSharingMethodStore.selectedTemplate
    ) {
      return null;
    }
    return {
      contractId: contractNegotiationStore.negotiationStatus.contractAgreementId,
      providerEndpoint: contractNegotiationStore.negotiationStatus.counterPartyAddress,
      templateId: resourceSharingMethodStore.selectedTemplate,
      dataDestination: resourceSharingMethodStore.resourceAddress,
    };
  });

  const { startTransferProcess, fetchTransferProcessStatus } = useTransferProcess();

  const transferProcessId = ref<string | null>(null);
  const setTransferProcessId = (id: string) => {
    transferProcessId.value = id;
  };

  const transferProcessStatus = ref<EdcTransferProcessStatusResponse | null>(null);
  const transferProcessError = ref<PossibleUIError>(null);
  const transferProcessStartedAt = ref<Date | null>(null);

  const isTransferProcessFinalized = computed(() => {
    return (
      !!transferProcessStatus.value &&
      ['DEPROVISIONED', 'COMPLETED'].includes(transferProcessStatus.value?.state)
    );
  });

  const isTransferProcessTerminated = computed(() => {
    return transferProcessStatus.value?.state === 'TERMINATED';
  });

  const isTransferProcessEnded = computed(() => {
    return (
      isTransferProcessFinalized.value ||
      isTransferProcessTerminated.value ||
      !!transferProcessError.value
    );
  });

  const isNextTransferProcessStatusLoading = ref(false);

  const fetchNewTransferProcessStatus = async () => {
    if (!transferProcessId.value) {
      return;
    }
    isNextTransferProcessStatusLoading.value = true;
    const { data, error } = await fetchTransferProcessStatus(transferProcessId.value);
    if (data.value) {
      transferProcessStatus.value = data.value;
      if (data.value.state === 'TERMINATED') {
        transferProcessError.value = {
          title: 'Transfer process has been terminated',
          description:
            data.value.errorDetail ??
            'Please retry or exit the process. If the problem persists, contact the admin.',
        };
      }
    }
    if (error.value) {
      transferProcessError.value = error.value;
      console.error(error.value);
    }
    isNextTransferProcessStatusLoading.value = false;
  };

  const transferProcessRefreshInterval = useIntervalFn(
    async () => {
      if (isTransferProcessEnded.value) {
        transferProcessRefreshInterval.pause();
      } else if (!isNextTransferProcessStatusLoading.value) {
        await fetchNewTransferProcessStatus();
      }
    },
    3000,
    { immediate: false }
  );

  const initiateTransferProcess = async () => {
    if (!transferRequestData.value) {
      return;
    }
    transferProcessStartedAt.value = new Date();
    const { data, error } = await startTransferProcess(transferRequestData.value);
    if (data.value) {
      transferProcessId.value = data.value.transferProcessId;
      transferProcessRefreshInterval.resume();
    }
    if (error.value) {
      transferProcessError.value = error.value;
      console.error(error.value);
    }
  };

  const resetTransferState = () => {
    transferProcessId.value = null;
    transferProcessStatus.value = null;
    transferProcessError.value = null;
    transferProcessStartedAt.value = null;
    transferProcessRefreshInterval.pause();
  };

  return {
    transferRequestData,
    transferProcessId,
    setTransferProcessId,
    transferProcessStatus,
    transferProcessError,
    transferProcessStartedAt,
    isTransferProcessFinalized,
    isTransferProcessTerminated,
    isTransferProcessEnded,
    initiateTransferProcess,
    fetchNewTransferProcessStatus,
    resetTransferState,
    isNextTransferProcessStatusLoading,
  };
});
