<template>
  <div class="contract-offer flex flex-col gap-2">
    <PolicyConstraints :constraints="offer.policy.policyConstraints" />
  </div>
</template>

<script setup lang="ts">
import type { ContractOffer } from 'types/contracts';
import type { PropType } from 'vue';
import PolicyConstraints from './PolicyConstraints.vue';

defineProps({
  offer: {
    type: Object as PropType<ContractOffer>,
    required: true,
  },
});
</script>
