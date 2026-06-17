<template>
  <div>
    <SStatusMessage
      id="catalog-offers-error"
      v-if="!catalogOffersLoading && catalogOffersError"
      class="mb-4 hidden"
      :title="catalogOffersError.title"
      variant="error"
    >
      {{ catalogOffersError.description }}
    </SStatusMessage>
    <div class="mb-16 flex flex-row items-center gap-4">
      <SButton
        id="get-data-button"
        class="!px-20"
        label="Get Data"
        severity="primary"
        @click="openOverlay"
        :disabled="isDisabled"
      />
      <SLoadingSpinner id="catalog-offers-loading" v-if="catalogOffersLoading" />
    </div>
    <ResourceDescriptionRendererHost :input="offerDetailsDocument" />
    <div v-if="!catalogOffersLoading && catalogOffersData">
      <ContractOffers :offers="catalogOffersData.offers" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, toRaw } from 'vue';
import { storeToRefs } from 'pinia';
import {
  SButton,
  SLoadingSpinner,
  SStatusMessage,
  ResourceDescriptionRendererHost,
  consoleLogError,
  filterToReadableSdDocument,
  type PossibleUIError,
} from '@simpl/vue-components';
import { useContractNegotiationStore, useDataTransferWizardStore } from '@/stores';
import { useContractConsumption } from '@/services/composables/useContractConsumption';
import ContractOffers from '../contracts/ContractOffers.vue';
import type { ContractOffersResponse } from 'types/contracts';
import type { SearchAPISelfDescriptionDocument } from 'types/searchApi';

const props = defineProps<{
  document: SearchAPISelfDescriptionDocument;
}>();

const { openOverlay } = useDataTransferWizardStore();
const contractNegotiationStore = useContractNegotiationStore();
const { isEligible, negotiationData } = storeToRefs(contractNegotiationStore);
const { getCatalogOffers } = useContractConsumption();

const catalogOffersError = ref<PossibleUIError>(null);
const catalogOffersData = ref<ContractOffersResponse | null>(null);
const catalogOffersLoading = ref(false);

const isDisabled = computed(
  () =>
    !props.document ||
    !isEligible.value ||
    !!catalogOffersLoading.value ||
    !!catalogOffersError.value ||
    !catalogOffersData.value
);

const fetchCatalogOffers = async () => {
  catalogOffersLoading.value = true;
  const { data, error } = await getCatalogOffers(negotiationData.value!);
  if (data.value) {
    catalogOffersData.value = data.value;
  }
  if (error.value) {
    catalogOffersError.value = error.value;
    consoleLogError('Data transfer unavailable due to the following error', toRaw(error.value));
  }

  catalogOffersLoading.value = false;
};

const offerDetailsDocument = computed(() => {
  if (!props.document) {
    return null;
  }
  return filterToReadableSdDocument({
    offerDetails: {
      price:
        props.document.credentialSubject['simpl:offeringPrice']['simpl:price']['@value'] +
        ' ' +
        props.document.credentialSubject['simpl:offeringPrice']['simpl:currency'],
      priceType: props.document.credentialSubject['simpl:offeringPrice']['simpl:priceType'],
    },
  });
});

fetchCatalogOffers();
</script>
