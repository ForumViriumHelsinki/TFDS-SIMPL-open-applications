<template>
  <div
    v-if="input && typeof input !== 'string' && Object.keys(input).length > 0"
    :style="{ marginLeft: `${level}rem` }"
    class="search-parameter leading-6"
  >
    <div v-for="(value, key) in filterOutAtTypes(input)">
      <span class="search-parameter-label font-semibold">{{ humanizeLabel(key) }}: </span>
      <FormattedNumberRangeValue
        v-if="isAdvancedSearchNumberRangeValue(value)"
        :label="humanizeLabel(key)"
        :number-range="value"
        class="search-parameter-value"
      />
      <SearchedProperties v-else :input="value as SearchedPropertiesInput" :level="level + 1" />
    </div>
  </div>
  <span v-else-if="typeof input === 'string'" class="search-parameter-value">{{ input }}</span>
</template>

<script setup lang="ts">
import {
  isAdvancedSearchNumberRangeValue,
  humanizeLabel,
  filterOutAtTypes,
  type SearchedPropertiesInput,
} from '@simpl/vue-components';
import FormattedNumberRangeValue from './FormattedNumberRangeValue.vue';

withDefaults(
  defineProps<{
    input: SearchedPropertiesInput;
    level: number;
  }>(),
  {
    level: 0,
  }
);
</script>
