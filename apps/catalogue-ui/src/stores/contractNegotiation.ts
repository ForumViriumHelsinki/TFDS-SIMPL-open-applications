import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { useIntervalFn } from '@vueuse/core';
import {
  getContractNegotiationData,
  isEligibleForContractNegotiation,
} from '@/util/contractNegotiation';
import type { ContractNegotiationStatusResponse } from 'types/contracts';
import type { PossibleUIError } from '@simpl/vue-components';
import { useContractConsumption } from '@/services/composables/useContractConsumption';
import { useResourceDescriptionStore } from './resourceDescription';

export const useContractNegotiationStore = defineStore('contractNegotiation', () => {
  const { fetchContractNegotiationStatus, startContractNegotiation } = useContractConsumption();

  const isEligible = computed(() => {
    const resourceDescriptionStore = useResourceDescriptionStore();

    return resourceDescriptionStore.resourceDescriptionDocument
      ? isEligibleForContractNegotiation(resourceDescriptionStore.resourceDescriptionDocument)
      : false;
  });

  const negotiationData = computed(() => {
    const resourceDescriptionStore = useResourceDescriptionStore();

    return getContractNegotiationData(resourceDescriptionStore.resourceDescriptionDocument);
  });

  const negotiationId = ref<string | null>(null);

  const setNegotiationId = (id: string) => {
    negotiationId.value = id;
  };

  const negotiationStatus = ref<ContractNegotiationStatusResponse | null>(null);
  const negotiationStatusError = ref<PossibleUIError>(null);

  const setNegotiationStatus = (status: ContractNegotiationStatusResponse) => {
    negotiationStatus.value = status;
  };

  const isNegotiationFinalized = computed(() => {
    return negotiationStatus.value ? negotiationStatus.value?.state === 'FINALIZED' : false;
  });

  const isNegotiationTerminated = computed(() => {
    return negotiationStatus.value ? negotiationStatus.value?.state === 'TERMINATED' : false;
  });

  const isNegotiationEnded = computed(() => {
    return (
      isNegotiationFinalized.value ||
      isNegotiationTerminated.value ||
      !!negotiationStatusError.value
    );
  });

  const isNextNegotiationStatusLoading = ref(false);

  const fetchNewNegotiationStatus = async () => {
    if (!negotiationId.value) {
      return;
    }
    isNextNegotiationStatusLoading.value = true;
    const { data, error } = await fetchContractNegotiationStatus(negotiationId.value);
    if (data.value) {
      negotiationStatus.value = data.value;
    }
    if (error.value) {
      negotiationStatusError.value = error.value;
      console.error(error.value);
    }
    isNextNegotiationStatusLoading.value = false;
  };

  const negotiationReloadInterval = useIntervalFn(
    async () => {
      if (negotiationId.value && !isNextNegotiationStatusLoading.value) {
        await fetchNewNegotiationStatus();
      }
      if (isNegotiationEnded.value) {
        negotiationReloadInterval.pause();
      }
    },
    3000,
    { immediate: false }
  );

  const initiateNegotiation = async () => {
    if (!negotiationData.value) {
      return;
    }
    const { data, error } = await startContractNegotiation(negotiationData.value);
    if (data.value) {
      negotiationId.value = data.value.contractNegotiationId;
      negotiationReloadInterval.resume();
    }
    if (error.value) {
      negotiationStatusError.value = error.value;
      console.error(error.value);
    }
    negotiationReloadInterval.resume();
  };

  const resetNegotiationState = () => {
    negotiationId.value = null;
    negotiationStatus.value = null;
    negotiationStatusError.value = null;
    negotiationReloadInterval.pause();
  };

  return {
    isEligible,
    negotiationData,
    negotiationId,
    setNegotiationId,
    negotiationStatus,
    setNegotiationStatus,
    negotiationStatusError,
    isNegotiationFinalized,
    isNegotiationTerminated,
    isNegotiationEnded,
    fetchNewNegotiationStatus,
    initiateNegotiation,
    resetNegotiationState,
    negotiationReloadInterval,
    isNextNegotiationStatusLoading,
  };
});
