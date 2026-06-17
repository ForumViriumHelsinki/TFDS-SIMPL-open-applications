<template>
  <SStatusMessage
    id="resource-description-error-message"
    v-if="resourceDescriptionError"
    :title="resourceDescriptionError.title"
    variant="danger"
  >
    {{ resourceDescriptionError.description }}
  </SStatusMessage>
  <ResourceDescriptionRendererHost
    v-if="detailedInput"
    :detailed-input="detailedInput"
    show-navigation
  />
</template>

<script setup lang="ts">
import {
  SStatusMessage,
  ResourceDescriptionRendererHost,
  type PossibleUIError,
  type DisplayedResourceDescriptionField,
} from '@simpl/vue-components';

const props = defineProps<{
  detailedInput: Partial<DisplayedResourceDescriptionField>;
  resourceDescriptionError: PossibleUIError;
}>();
</script>
