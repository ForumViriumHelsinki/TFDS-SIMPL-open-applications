import { useResourceAddress } from '@/services/composables/useResourceAddress';
import { defineStore } from 'pinia';
import type { UIError } from '@simpl/vue-components';
import { computed, ref } from 'vue';
import { useResourceDescriptionStore } from './resourceDescription';

export const useResourceSharingMethodStore = defineStore('resourceSharingMethod', () => {
  const sharingMethodId = ref<string | undefined>(undefined);
  const offeringType = ref<string | undefined>(undefined);

  const isTemplatesLoading = ref(false);

  const { getResourceAddressTemplates, getResourceAddressSchema, getResourceAddressUiSchema } =
    useResourceAddress();

  const loadResourceAddressTemplates = async () => {
    isTemplatesLoading.value = true;
    await fetchResourceAddressTemplates();
    isTemplatesLoading.value = false;
  };

  const initializeResourceSharingMethods = async () => {
    const resourceDescriptionStore = useResourceDescriptionStore();

    sharingMethodId.value = resourceDescriptionStore.resourceDescriptionSharingMethodId;
    offeringType.value = resourceDescriptionStore.resourceDescriptionOfferingType;
    resourceAddressForm.value.data = {
      type: sharingMethodId.value,
    };
    await loadResourceAddressTemplates();
  };

  const resourceAddressTemplates = ref([] as any);
  const resourceAddressTemplatesError = ref<UIError | null>(null);

  const fetchResourceAddressTemplates = async () => {
    if (!sharingMethodId.value || !offeringType.value) {
      const missingParameters = {
        sharingMethodId: !sharingMethodId.value,
        offeringType: !offeringType.value,
      };
      resourceAddressTemplatesError.value = {
        title: 'Missing parametres from resource description',
        description:
          'The following parametres are missing from the resource description: ' +
          Object.keys(missingParameters)
            .filter((key) => missingParameters[key])
            .join(', '),
      };
      resourceAddressTemplates.value = [];

      return;
    }

    const { data, error } = await getResourceAddressTemplates({
      sharingMethodId: sharingMethodId.value!,
      offeringType: offeringType.value!,
    });
    if (error.value) {
      resourceAddressTemplatesError.value = error.value;
    } else {
      resourceAddressTemplatesError.value = null;
      resourceAddressTemplates.value = data.value;
    }
  };

  const selectedTemplate = ref<string | undefined>(undefined);
  const selectedTemplateSchema = ref<any>(null);
  const selectedTemplateUiSchema = ref<any>(null);
  const schemasLoading = ref(false);
  const isFormValidated = ref(false);

  const resourceAddressForm = ref({
    data: {
      type: sharingMethodId.value,
    },
    errors: [],
  });

  const isResourceAddressFormValid = computed(() => {
    return resourceAddressForm.value.errors.length === 0;
  });

  const isResourceAddressReady = computed(() => {
    return (
      isFormValidated.value &&
      !!selectedTemplateSchema.value &&
      !!selectedTemplateUiSchema.value &&
      !!selectedTemplate.value &&
      Object.keys(resourceAddressForm.value.data).length > 0 &&
      isResourceAddressFormValid.value
    );
  });

  const setSelectedTemplate = async (templateId: string | undefined) => {
    selectedTemplate.value = templateId;
    isFormValidated.value = false;

    if (templateId) {
      schemasLoading.value = true;

      const { data, error } = await getResourceAddressSchema({ templateId });
      if (error.value) {
        resourceAddressTemplatesError.value = error.value;
      } else {
        selectedTemplateSchema.value = data.value;
      }

      const { data: uiSchemadata, error: uiSchemaError } = await getResourceAddressUiSchema({
        templateId,
      });
      if (uiSchemaError.value) {
        resourceAddressTemplatesError.value = uiSchemaError.value;
      } else {
        selectedTemplateUiSchema.value = uiSchemadata.value;
      }
      schemasLoading.value = false;
    }
  };

  const updateFormErrors = (errors: never[]) => {
    resourceAddressForm.value.errors = errors;
    isFormValidated.value = true;
  };

  const resetResourceSharingMethods = () => {
    sharingMethodId.value = undefined;
    offeringType.value = undefined;
    resourceAddressTemplates.value = [];
    resourceAddressTemplatesError.value = null;
    selectedTemplate.value = undefined;
    selectedTemplateSchema.value = null;
    selectedTemplateUiSchema.value = null;
    resourceAddressForm.value = { data: {}, errors: [] };
    schemasLoading.value = false;
    isFormValidated.value = false;
  };

  const resourceAddress = computed(() => {
    if (!isResourceAddressFormValid.value) {
      return null;
    }

    return resourceAddressForm.value.data;
  });

  return {
    sharingMethodId,
    offeringType,
    isTemplatesLoading,
    loadResourceAddressTemplates,
    initializeResourceSharingMethods,
    resourceAddressTemplates,
    resourceAddressTemplatesError,
    fetchResourceAddressTemplates,
    selectedTemplate,
    selectedTemplateSchema,
    selectedTemplateUiSchema,
    schemasLoading,
    resourceAddressForm,
    isResourceAddressFormValid,
    setSelectedTemplate,
    updateFormErrors,
    resetResourceSharingMethods,
    resourceAddress,
    isResourceAddressReady,
  };
});
