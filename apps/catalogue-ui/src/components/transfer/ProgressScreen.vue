<template>
  <Panel>
    <template #header>
      <div class="flex flex-row items-center gap-4">
        <div class="text-xl font-semibold">{{ title }}</div>
        <ProgressChip v-if="status" :status="status" />
      </div>
    </template>
    <div class="max-w-screen-md">
      <div v-if="processError || status === 'Failed'">
        <div class="mb-4">
          <slot name="failedDescription" />
        </div>
        <SStatusMessage id="process-error" v-if="processError" variant="error" :title="processError.title">
          {{ processError.description }}
        </SStatusMessage>
      </div>
      <div v-else>
        <div class="mb-4">
          <template v-if="status === 'In Progress'">
            <slot name="inProgressDescription" />
          </template>
          <template v-else-if="status === 'Successful'">
            <slot name="successDescription" />
          </template>
        </div>
        <SProgressBar
          id="transfer-progress-bar"
          :value="progress"
          :mode="progress ? 'determinate' : 'indeterminate'"
          class="my-4"
        >
          <strong v-if="!startedTime">Starting...</strong>
          <strong v-else>Started at {{ startedTime }} - </strong>
          <span v-if="elapsedTime?.length">Elapsed time: {{ elapsedTime }}</span>
        </SProgressBar>
      </div>
      <SFieldset
        :id="`${processName}-details`"
        :label="`${title} details`"
        class="!p-0"
        :class="{
          'pointer-events-none opacity-50': !processDetails,
        }"
        isExpandable
      >
        <ResourceDescriptionRendererHost v-if="processDetails" :input="processDetails" />
      </SFieldset>
    </div>
  </Panel>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import Panel from 'primevue/panel';
import {
  SProgressBar,
  SFieldset,
  SStatusMessage,
  ResourceDescriptionRendererHost,
  type PossibleUIError
} from '@simpl/vue-components';
import { formatElapsedTime, formatTimeConditional } from '@/util/dates';
import ProgressChip from './ProgressChip.vue';
import { useIntervalFn } from '@vueuse/core';
import { isProgressEnded, type DisplayedStatusLabel } from '../../util/progressStatus';

const props = defineProps<{
  processName: string;
  title: string;
  status?: DisplayedStatusLabel;
  startedAt?: number | Date | null;
  processDetails: object;
  processError: PossibleUIError;
}>();

const startedTime = computed(() => {
  if (!props.startedAt) {
    return '';
  }
  return formatTimeConditional(props.startedAt);
});

const elapsedTime = ref<string | null>(null);

const elapsedTimeInterval = useIntervalFn(
  () => {
    if (props.startedAt && !isProgressEnded(props.status)) {
      elapsedTime.value = formatElapsedTime(props.startedAt);
    } else {
      elapsedTimeInterval.pause();
    }
  },
  1000,
  {
    immediate: false,
  }
);

watch(
  () => props.status,
  (status) => {
    if (props.startedAt && !isProgressEnded(status)) {
      elapsedTimeInterval.resume();
    } else {
      elapsedTimeInterval.pause();
    }
  }
);

const progress = computed(() => {
  if (isProgressEnded(props.status)) {
    return 100;
  }
  return undefined;
});
</script>
