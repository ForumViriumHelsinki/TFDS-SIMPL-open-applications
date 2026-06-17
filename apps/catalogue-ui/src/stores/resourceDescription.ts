import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import type { SearchAPISelfDescriptionDocument } from 'types/searchApi';
import {
  getResourceDescriptionOfferingType,
  getResourceDescriptionSharingMethod,
  getResourceDescriptionSummaryFromDocument,
} from '@simpl/vue-components';

export const useResourceDescriptionStore = defineStore('resourceDescription', () => {
  const resourceDescriptionDocument = ref<SearchAPISelfDescriptionDocument | null>(null);
  const resourceDescriptionSummary = computed(() => {
    if (!resourceDescriptionDocument.value) {
      return null;
    }
    return getResourceDescriptionSummaryFromDocument(resourceDescriptionDocument.value);
  });
  const resourceDescriptionOfferingType = computed(() => {
    return getResourceDescriptionOfferingType(resourceDescriptionDocument.value);
  });
  const resourceDescriptionSharingMethodId = computed(() => {
    return getResourceDescriptionSharingMethod(resourceDescriptionDocument.value);
  });

  const setResourceDescriptionDocument = (document: SearchAPISelfDescriptionDocument) => {
    resourceDescriptionDocument.value = document;
  };

  return {
    resourceDescriptionDocument,
    resourceDescriptionSummary,
    resourceDescriptionOfferingType,
    resourceDescriptionSharingMethodId,
    setResourceDescriptionDocument,
  };
});
