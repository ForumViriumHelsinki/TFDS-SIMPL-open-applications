<template>
  <li class="policy-constraint list-item gap-4">
    <span v-if="constraint.condition === 'deletion' && constraint.conditionValue === 'after_use'">
      The data will have to be deleted after usage
    </span>
    <span v-else-if="constraint.condition === 'count'">
      The data can be used a maximum of {{ constraint.conditionValue }} times
    </span>
    <span v-else-if="constraint.condition === 'dateTime'">
      The data can be used {{ getConstraintOperatorPhrase(constraint.conditionOperator) }}
      {{ new Date(constraint.conditionValue).toLocaleString() }}
    </span>
  </li>
</template>

<script setup lang="ts">
import type { ContractAccessPolicyConstraint } from 'types/contracts';
import type { PropType } from 'vue';

const getConstraintOperatorPhrase = (constraintOperator: string): string => {
  if (constraintOperator === 'greater than or equal to') {
    return 'from';
  } else if (constraintOperator === 'less than or equal to') {
    return 'until';
  } else if (constraintOperator === 'equal to') {
    return 'at';
  }
  return '';
};

defineProps({
  constraint: {
    type: Object as PropType<ContractAccessPolicyConstraint>,
    required: true,
  },
});
</script>
