<template>
  <SOverlay
    id="resource-description-details-overlay"
    ref="overlayRef"
    v-model="isOpen"
    :title="overlayTitle"
    class="create-resource-overlay h-full"
    @hide="closeOverlay"
  >
    <div class="flex flex-col gap-6" v-if="!isLoading">
      <SStatusMessage
        id="resource-description-schema-error-message"
        v-if="resourceDescriptionSchemaError"
        :title="resourceDescriptionSchemaError.title"
        variant="error"
      >
        {{ resourceDescriptionSchemaError.description }}
      </SStatusMessage>
      <ResourceDescriptionDetails
        :detailed-input="detailedInput"
        :resource-description-error="resourceDescriptionError"
      />
    </div>
    <div v-else class="flex flex-col items-center">
      <SLoadingSpinner id="resource-description-loading-spinner" />
    </div>
    <template #footer>
      <div v-if="!hideActions" class="flex justify-end gap-3">
        <SButton id="revoke-resource-description-button" severity="secondary" label="Revoke" @click="handleRevokeVersion"/>
        <SButton
          id="create-new-version-button"
          severity="primary"
          label="Create New Version"
          :disabled="!schemaId"
          @click="handleCreateNewVersion"
        />
      </div>
    </template>
  </SOverlay>

  <SModal id="revoke-resource-description-modal" v-model:modelValue="showRevokeModal" title="Revoke confirmation">
    <template #header>
      <div>Revoke confirmation</div>
    </template>
    <SStatusMessage
      id="revoke-resource-description-error-message"
      v-if="revokeError"
      :title="revokeError.title"
      variant="error"
    >
      {{ revokeError.description }}
    </SStatusMessage>
    <div v-else> 
      <p>Are you sure you want to revoke this item?</p>
      <br />
      <p>Note: After revoking a credential it become invalid and cannot be used anymore. 
        To obtain a valid credential, you will have to request a new one.</p>
    </div>
    <template #footer>
      <div class="flex justify-end gap-3">
        <SButton id="revoke-modal-cancel" label="Cancel" severity="secondary" @click="showRevokeModal = false" />
        <SButton id="revoke-modal-confirm" label="Revoke" severity="primary" :disabled="!!revokeError" @click="confirmRevoke" />
      </div>
    </template>
  </SModal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import ResourceDescriptionDetails from './ResourceDescriptionDetails.vue';
import {
  SOverlay,
  SButton,
  SModal,
  SStatusMessage,
  SLoadingSpinner,
  getResourceDescriptionSchemaName,
  getResourceDescriptionSchemaVersion,
  getResourceDescriptionSummaryFromDocument,
  getResourceDescriptionSharingMethod,
  type PossibleUIError,
  type SearchAPISelfDescriptionDocument,
  buildDetailedLabeledResourceDescriptionFromSchemaAndData,
} from '@simpl/vue-components';
import { useResourceDescriptions } from '@/services/composables/useResourceDescriptions';
import { useSchemasStore } from '@/store/schemas';
import { useConvertedSchemas, useVersionedConvertedSchemas } from '@/services/composables/useConvertedSchemas';
import { type ConvertedSchema } from '@/types/shapes';
import { fetchLocalEndpoint } from '@/util/services';
import { useTemporarySuccessMessageStore } from '@/store/temporarySuccessMessage';

const { getResourceDescriptionById, revokeResourceDescriptionById } = useResourceDescriptions();
const schemasStore = useSchemasStore();
const { setSuccessDetails } = useTemporarySuccessMessageStore();

const isOpen = ref(true);

const props = defineProps<{
  resourceDescriptionId?: string;
  hideActions?: boolean;
  returnUrl?: string;
}>();

const resourceDescriptionData = ref<SearchAPISelfDescriptionDocument | null>(null);
const resourceDescriptionError = ref<PossibleUIError>(null);
const resourceDescriptionSchema = ref<ConvertedSchema | null>(null);
const resourceDescriptionSchemaError = ref<PossibleUIError>(null);
const isLoading = ref(false);
const schemaId = ref<string | null>(null);
const resourceAddressValue = ref<string | null>(null);

const fetchResourceAddress = async (assetId: string) => {
  const { data } = await fetchLocalEndpoint<{ templateId: string; value: string }>(
    `/api/resourceAddresses/assets/${encodeURIComponent(assetId)}`,
    {
      method: 'GET',
      errorIdentifier: 'RESOURCE_ADDRESS_FETCH_ERROR',
      apiName: 'SD Tooling',
    }
  );
  if (data.value) {
    resourceAddressValue.value = data.value.value;
  }
};
const showRevokeModal = ref(false);
const revokeError = ref<PossibleUIError>(null);

const fetchResourceDescription = async () => {
  isLoading.value = true;
  const { data, error } = await getResourceDescriptionById(props.resourceDescriptionId!);
  if (data.value) {
    resourceDescriptionData.value = data.value;
    const resolvedSchemaId = getResourceDescriptionSchemaName(resourceDescriptionData.value);
    const resolvedSchemaVersion = getResourceDescriptionSchemaVersion(resourceDescriptionData.value);
    if (resolvedSchemaId) {
      schemaId.value = resolvedSchemaId;
      const fetchSchema = resolvedSchemaVersion
        ? useVersionedConvertedSchemas(resolvedSchemaId, resolvedSchemaVersion)
        : useConvertedSchemas(resolvedSchemaId);
      const { data: schemaData, error: schemaError } = await fetchSchema;
      if (schemaData.value) {
        resourceDescriptionSchema.value = schemaData.value;
      } else if (schemaError.value) {
        resourceDescriptionSchemaError.value = schemaError.value;
      }
    }

    const edcRegistration = resourceDescriptionData.value.credentialSubject?.[
      'simpl:edcRegistration'
    ] as Record<string, any> | undefined;
    const assetId = edcRegistration?.['simpl:assetId'];
    if (assetId) {
      await fetchResourceAddress(assetId);
    }
  } else if (error.value) {
    resourceDescriptionError.value = error.value;
  }
  isLoading.value = false;
};

if (!props.resourceDescriptionId) {
  resourceDescriptionError.value = {
    title: 'Resource description not found',
    description: 'No resource description ID was provided.',
  };
} else {
  fetchResourceDescription();
}

const overlayTitle = computed(() => {
  if (resourceDescriptionData.value) {
    const summary = getResourceDescriptionSummaryFromDocument(resourceDescriptionData.value);
    return summary?.title ?? 'Resource description details';
  }
  return 'Resource description details';
});

const detailedInput = computed(() => {
  if (!resourceDescriptionSchema.value || !resourceDescriptionData.value) {
    return null;
  }
  let credentialSubject = resourceDescriptionData.value.credentialSubject;
  if (resourceAddressValue.value) {
    credentialSubject = { ...credentialSubject };
    credentialSubject['simpl:assetProperties'] = {
      ...((credentialSubject['simpl:assetProperties'] as Record<string, any>) || {}),
      'simpl:providerDataAddress': resourceAddressValue.value,
    };
  }
  return buildDetailedLabeledResourceDescriptionFromSchemaAndData(
    Object.entries(resourceDescriptionSchema.value.root)[0][1],
    credentialSubject
  );
});

const closeOverlay = () => {
  window.location.assign(props.returnUrl ?? '/');
};

const handleCreateNewVersion = () => {
  if (schemaId.value && resourceDescriptionData.value) {
    sessionStorage.setItem(
      'newVersionCredentialSubject',
      JSON.stringify(resourceDescriptionData.value.credentialSubject)
    );

    const sharingMethodId = getResourceDescriptionSharingMethod(resourceDescriptionData.value);
    if (sharingMethodId) {
      sessionStorage.setItem('newVersionSharingMethodId', sharingMethodId);
    }

    const edcRegistration = resourceDescriptionData.value.credentialSubject?.[
      'simpl:edcRegistration'
    ] as Record<string, any> | undefined;
    const assetId = edcRegistration?.['simpl:assetId'];
    if (assetId) {
      sessionStorage.setItem('newVersionAssetId', assetId);
    }

    window.location.assign(`/resourceDescriptions/${schemaId.value}/new`);
  }
};

const handleRevokeVersion = () => {
  revokeError.value = null;
  showRevokeModal.value = true;
};

const confirmRevoke = async () => {
  if (!props.resourceDescriptionId) return;
  const { error } = await revokeResourceDescriptionById(props.resourceDescriptionId);
  if (error.value) {
    revokeError.value = error.value;
  } else {
    showRevokeModal.value = false;
    setSuccessDetails(props.resourceDescriptionId, overlayTitle.value, 'revoked');
    window.location.assign('/');
  }
};
</script>
