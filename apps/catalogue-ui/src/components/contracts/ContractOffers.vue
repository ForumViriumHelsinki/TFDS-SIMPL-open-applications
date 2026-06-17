<template>
  <div class="contract-offers">
    <ContractOfferComponent v-for="offer in offers" :key="offer.offerId" :offer="offer" />
  </div>
</template>

<script setup lang="ts">
import ContractOfferComponent from './ContractOffer.vue';
import type { ContractOffer } from 'types/contracts';
import type { PropType } from 'vue';

const props = defineProps({
  offers: {
    type: Array as PropType<ContractOffer[]>,
    required: true,
  },
});
</script>
