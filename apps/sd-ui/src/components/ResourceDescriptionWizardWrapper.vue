<template>
  <ResourceDescriptionCreationWizard
    v-if="currentFormSchema"
    v-model="isOpen"
    v-model:data="formData"
    :schema="currentFormSchema"
    :config="config"
    :title="overlayTitle"
    :status-details="statusMessage"
    :submit-loading="submitLoading"
    @hide="closeOverlay"
    @cancel="closeOverlay"
    @sign-and-submit="submitForm"
    @change="onFormChange"
    @metadata-change="onMetadataChange"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { ResourceDescriptionCreationWizard } from '@simpl/vue-components';
import { useResourceDescriptionCreationStore } from '@/store/resourceDescriptionCreation';
import { credentialSubjectToFormData } from '@/util/credentialSubjectToFormData';
import { convertServicePolicyOdrlToSimpleFormat } from '@/util/convertOdrlToSimplePolicy';

const props = defineProps<{ schemaId?: string }>();
const isOpen = ref(true);

const resourceDescriptionCreationStore = useResourceDescriptionCreationStore();
const {
  setSelectedShapeName,
  setInitialFormData,
  submitForm,
  closeOverlay,
  onFormChange,
  onMetadataChange,
} = resourceDescriptionCreationStore;
const { currentFormSchema, config, formData, statusMessage, overlayTitle, submitLoading } = storeToRefs(
  resourceDescriptionCreationStore
);

// Check for prefill data from "Create New Version" flow
const storedCredentialSubject = sessionStorage.getItem('newVersionCredentialSubject');
if (storedCredentialSubject) {
  try {
    const credentialSubject = JSON.parse(storedCredentialSubject);

    // Read dcterms:identifier and schema:version from the raw credentialSubject,
    // unwrapping the JSON-LD { @value } form if present.
    const rawGeneralProps = credentialSubject['simpl:generalServiceProperties'] as
      | Record<string, any>
      | undefined;
    const rawIdentifier = rawGeneralProps?.['dcterms:identifier'];
    const parentIdentifier: string | undefined =
      rawIdentifier && typeof rawIdentifier === 'object'
        ? (rawIdentifier as Record<string, any>)['@value']
        : rawIdentifier;
    const rawVersion = rawGeneralProps?.['schema:version'];
    const parentVersion: string | undefined =
      rawVersion && typeof rawVersion === 'object'
        ? (rawVersion as Record<string, any>)['@value']
        : rawVersion;

    const prefillData = credentialSubjectToFormData(credentialSubject);
    const convertedData = convertServicePolicyOdrlToSimpleFormat(prefillData);

    setInitialFormData(convertedData as Record<string, any>);

    // Pass dcterms:identifier and schema:version through unchanged: the BE
    // increments the version itself via a dedicated library, the FE must not
    // perform any operation on these values.
    if (parentIdentifier) {
      resourceDescriptionCreationStore.setParentIdentifier(parentIdentifier);
    }
    if (parentVersion) {
      resourceDescriptionCreationStore.setNewSchemaVersion(parentVersion);
    }
  } catch {
    setInitialFormData(null);
  }
}

const storedSharingMethodId = sessionStorage.getItem('newVersionSharingMethodId');
if (storedSharingMethodId) {
  resourceDescriptionCreationStore.setInitialSharingMethodId(storedSharingMethodId);
}

const storedAssetId = sessionStorage.getItem('newVersionAssetId');
if (storedAssetId) {
  resourceDescriptionCreationStore.setInitialAssetId(storedAssetId);
}

setSelectedShapeName(props.schemaId);
</script>
