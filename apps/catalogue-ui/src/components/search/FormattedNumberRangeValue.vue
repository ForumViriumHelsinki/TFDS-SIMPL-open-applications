<template>
  <span>
    <template v-if="isMin(numberRange.op1)">
      {{ numberRange.value1 }}
      {{ invertOperator(numberRange.op1) }}
    </template>
    <template v-else-if="numberRange.op2 && isMin(numberRange.op2)">
      {{ numberRange.value2 }}
      {{ invertOperator(numberRange.op2) }}
    </template>
    {{ label }}
    <template v-if="numberRange.op2 && !isMin(numberRange.op2)">
      {{ numberRange.op2 }}
      {{ numberRange.value2 }}
    </template>
    <template v-else-if="!isMin(numberRange.op1)">
      {{ numberRange.op1 }}
      {{ numberRange.value1 }}
    </template>
  </span>
</template>

<script setup lang="ts">
import { invertOperator, type AdvancedSearchNumberRangeValue } from '@simpl/vue-components';

const isMin = (op: string) => op.includes('>');

defineProps<{
  label: string;
  numberRange: AdvancedSearchNumberRangeValue;
}>();
</script>
