<template>
  <div class="policy-constraints">
    <div class="text-text self-description-section-label mt-6 mb-2 text-xl font-semibold">
      Policies
    </div>
    <SStatusMessage id="policy-constraints" variant="general" title="" v-if="constraints.length > 0">
      <ul class="list-inside list-disc ml-4">
        <PolicyConstraint
          v-for="constraint in constraints"
          :key="constraint.condition"
          :constraint="constraint"
        />
      </ul>
    </SStatusMessage>
  </div>
</template>

<script setup lang="ts">
import { SStatusMessage } from '@simpl/vue-components';
import PolicyConstraint from './PolicyConstraint.vue';
import type { ContractAccessPolicyConstraint } from 'types/contracts';
import type { PropType } from 'vue';

defineProps({
  constraints: {
    type: Array as PropType<ContractAccessPolicyConstraint[]>,
    required: true,
  },
});
</script>
