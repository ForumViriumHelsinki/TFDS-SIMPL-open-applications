<template>
  <SChip
    id="progress-status-chip"
    :label="chipConfig.label"
    :icon="chipConfig.iconName"
    color-type="default"
    variant="outlined"
    rounded
    :class="chipConfig.chipClasses"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { SChip } from '@simpl/vue-components';
import { getProgressChipConfig, type DisplayedStatusLabel } from '../../util/progressStatus';

const props = defineProps<{
  status: DisplayedStatusLabel;
  progress?: number;
}>();

const chipConfig = computed(() => getProgressChipConfig(props.status));
</script>
