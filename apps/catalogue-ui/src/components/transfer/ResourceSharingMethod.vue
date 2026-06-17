<template>
  <div class="flex flex-col gap-4">
    <SStatusMessage
      id="resource-address-templates-error"
      v-if="resourceAddressTemplatesError"
      :title="resourceAddressTemplatesError.title"
      variant="error"
    >
      {{ resourceAddressTemplatesError.description }}
    </SStatusMessage>
    <div class="flex flex-col gap-4" v-if="sharingMethodId">
      <SSelect
        id="method-select"
        label="Sharing method"
        :model-value="sharingMethodId"
        :options="[{ label: sharingMethodId, value: sharingMethodId }]"
        placeholder="Select a sharing method"
        disabled
      />
      <SLoadingSpinner id="resource-templates-loading" class="templates-loading" v-if="isTemplatesLoading" />
      <SSelect
        v-else
        id="template-select"
        label="Templates"
        :model-value="selectedTemplate"
        @update:model-value="setSelectedTemplate"
        :options="resourceAddressTemplates"
        placeholder="Select a template"
      />
    </div>
    <div>
      <SLoadingSpinner id="resource-schemas-loading" class="schemas-loading" v-if="schemasLoading" />
      <SJsonFormsWrapper
        v-else-if="selectedTemplateSchema && selectedTemplateUiSchema"
        v-model:data="resourceAddressForm.data"
        :schema="selectedTemplateSchema"
        :uischema="selectedTemplateUiSchema"
        :ajv-options="{ useDefaults: true }"
        form-schema-variant="default"
        @change="updateFormErrors($event.errors)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { SJsonFormsWrapper, SLoadingSpinner, SSelect, SStatusMessage } from '@simpl/vue-components';
import { storeToRefs } from 'pinia';
import { useResourceSharingMethodStore } from '@/stores';

const resourceSharingMethodStore = useResourceSharingMethodStore();

const {
  resourceAddressTemplates,
  resourceAddressTemplatesError,
  selectedTemplate,
  selectedTemplateSchema,
  selectedTemplateUiSchema,
  schemasLoading,
  resourceAddressForm,
  isTemplatesLoading,
  sharingMethodId,
} = storeToRefs(resourceSharingMethodStore);

const { initializeResourceSharingMethods, setSelectedTemplate, updateFormErrors } =
  resourceSharingMethodStore;

onMounted(async () => {
  initializeResourceSharingMethods();
});
</script>
