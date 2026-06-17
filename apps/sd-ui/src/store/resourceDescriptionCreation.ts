import { defineStore } from 'pinia';
import { ref, computed, toValue } from 'vue';
import type {
  AccessPolicyJsonFormsConfig,
  ResourceSharingJsonFormsConfig,
  StatusMessageDetails,
} from '@simpl/vue-components';
import type { ErrorObject } from 'ajv';
import type { ConvertedSchema } from '@/types/shapes';
import type { PossibleUIError } from '@/util/errors';
import { useConvertedSchemas } from '@/services/composables/useConvertedSchemas';
import { useIdentityAttributes } from '@/services/composables/useIdentityAttributes';
import { useAccessPolicyActions } from '@/services/composables/useAccessPolicyActions';
import { usePublish } from '@/services/composables/usePublish';
import { formatDataToJsonLd, type ExtendedJsonSchema4 } from '@/util/ttlParser/jsonld';
import { normalizePrefillToSchema } from '@/util/normalizePrefillToSchema';
import { useSchemasStore } from './schemas';
import { type JsonFormsChangeEvent } from '@jsonforms/vue';
import { useTemporarySuccessMessageStore } from './temporarySuccessMessage';

const getRootFormSchema = (schema: ConvertedSchema | null | undefined) => {
  const root = schema?.root;
  if (!root) {
    return undefined;
  }

  const rootEntries = Object.entries(root);
  const offeringShape = rootEntries.find(([shapeName]) => shapeName.endsWith('OfferingShape'));

  if (offeringShape) {
    return offeringShape[1];
  }

  return rootEntries[0]?.[1];
};

export const useResourceDescriptionCreationStore = defineStore(
  'resourceDescriptionCreation',
  () => {
    const selectedShapeName = ref<string | undefined>(undefined);
    const statusMessage = ref<StatusMessageDetails | undefined>(undefined);
    const submitLoading = ref<boolean>(false);
    const formData = ref<Record<string, any>>({});
    const formErrors = ref<ErrorObject<string, Record<string, any>, unknown>[] | undefined>([]);
    const currentSchema = ref<ConvertedSchema | null>(null);
    const currentSchemaError = ref<PossibleUIError>(null);
    const schemaLoading = ref<boolean>(false);
    const metadata = ref<{ templateId?: string }>({});
    const initialSharingMethodId = ref<string | undefined>(undefined);
    const initialAssetId = ref<string | undefined>(undefined);
    const parentIdentifier = ref<string | undefined>(undefined);
    const newSchemaVersion = ref<string | undefined>(undefined);

    const { identityAttributes, error: identityAttributesError } = useIdentityAttributes();
    const { accessPolicyActions, error: accessPolicyActionsError } = useAccessPolicyActions();

    const temporarySuccessMessageStore = useTemporarySuccessMessageStore();
    const { setSuccessDetails } = temporarySuccessMessageStore;

    const schemasStore = useSchemasStore();

    const hasStatusMessage = computed(() => !!statusMessage.value);

    const prefixes = computed(() => {
      if (!currentSchema.value?.prefixes) return {};
      // Filter out the empty-string default namespace prefix — it is
      // invalid in a JSON-LD @context and causes jsonld.compact() to throw.
      return Object.fromEntries(
        Object.entries(currentSchema.value.prefixes).filter(([key]) => key !== '')
      );
    });

    const currentFormSchema = computed(() => {
      return getRootFormSchema(currentSchema.value);
    });

    const shouldShowForm = computed(() => {
      return (
        !!identityAttributes.value.length &&
        !!accessPolicyActions.value.length &&
        !!currentFormSchema.value
      );
    });

    const config = computed<AccessPolicyJsonFormsConfig & ResourceSharingJsonFormsConfig>(() => {
      return {
        identityAttributes: identityAttributes.value,
        accessPolicyActions: accessPolicyActions.value,
        resourceSharingMethod: {
          offeringType: schemasStore.getResourceTypeById(selectedShapeName.value)!,
          agentType: 'provider' as const,
          apiBaseUrl: '/api',
          ...(initialSharingMethodId.value
            ? { prefillSharingMethodId: initialSharingMethodId.value }
            : {}),
          ...(initialAssetId.value ? { prefillAssetId: initialAssetId.value } : {}),
        },
      };
    });

    const schemaLoadingError = computed(() => {
      return (
        currentSchemaError.value || identityAttributesError.value || accessPolicyActionsError.value
      );
    });

    const currentResourceAddressTemplateId = computed(() => metadata.value?.templateId);

    const initialFormData = ref<Record<string, any> | null>(null);

    const setSelectedShapeName = (shapeName: string | undefined) => {
      if (selectedShapeName.value === shapeName) {
        return;
      }

      selectedShapeName.value = shapeName;
      loadSchema();
    };

    const setInitialFormData = (data: Record<string, any> | null) => {
      initialFormData.value = data;
      isNewVersion.value = data !== null;
    };

    const setInitialSharingMethodId = (id: string) => {
      initialSharingMethodId.value = id;
    };

    const setInitialAssetId = (id: string) => {
      initialAssetId.value = id;
    };

    const setParentIdentifier = (id: string) => {
      parentIdentifier.value = id;
    };

    const setNewSchemaVersion = (version: string) => {
      newSchemaVersion.value = version;
    };

    const loadSchema = async () => {
      if (!selectedShapeName.value) {
        return;
      }
      schemaLoading.value = true;
      currentSchemaError.value = null;

      const { data, error } = await useConvertedSchemas(selectedShapeName.value);
      if (error.value) {
        currentSchema.value = null;
        currentSchemaError.value = error.value;
      } else {
        const loadedSchema = data.value;
        const initialData = initialFormData.value ?? {};
        const rootSchema = getRootFormSchema(loadedSchema) as Record<string, unknown> | undefined;

        // Set formData before currentSchema so that JsonForms INIT receives
        // the prefill payload immediately on mount.
        formData.value = normalizePrefillToSchema(
          initialData,
          rootSchema as { type?: string; properties?: Record<string, any> } | undefined
        );
        initialFormData.value = null;
        currentSchema.value = loadedSchema;
      }

      schemaLoading.value = false;
    };

    const setStatusMessage = (message: StatusMessageDetails | undefined) => {
      statusMessage.value = message;
    };

    const clearStatusMessage = () => {
      statusMessage.value = undefined;
    };

    const setSubmitLoading = (loading: boolean) => {
      submitLoading.value = loading;
    };

    const setFormData = (data: Record<string, any>) => {
      formData.value = data;
    };

    const clearFormData = () => {
      formData.value = {};
    };

    const setFormErrors = (
      errors: ErrorObject<string, Record<string, any>, unknown>[] | undefined
    ) => {
      formErrors.value = errors;
    };

    const setMetadata = (newMetadata: any) => {
      metadata.value = newMetadata;
    };

    const handleSubmitResult = (
      result: StatusMessageDetails,
      newResourceDescriptionId?: string
    ) => {
      setStatusMessage(result);
      if (result.severity === 'success' && newResourceDescriptionId) {
        setSuccessDetails(newResourceDescriptionId, selectedShapeName.value);
        closeOverlay();
      }
    };

    const submitForm = async () => {
      if (!currentSchema.value || !selectedShapeName.value) {
        return;
      }

      const schema = currentFormSchema.value as ExtendedJsonSchema4 | undefined;
      if (!schema) {
        handleSubmitResult({
          show: true,
          title: 'Submission Error',
          description: 'No form schema available for the selected shape.',
          severity: 'error' as const,
        });
        return;
      }

      setSubmitLoading(true);

      try {
        const value = JSON.parse(JSON.stringify(formData.value));

        // Filter out keys that are not part of the schema to avoid
        // formatDataToJsonLd throwing on metadata or renderer-specific fields
        const schemaProperties = schema.properties ?? {};
        const filteredValue = Object.fromEntries(
          Object.entries(value).filter(([key]) => key in schemaProperties)
        );

        const formattedJsonLd = await formatDataToJsonLd(
          filteredValue,
          { ...schema },
          toValue(prefixes)
        );

        if (isNewVersion.value && parentIdentifier.value) {
          const generalServiceProps = formattedJsonLd[
            'simpl:generalServiceProperties'
          ] as Record<string, unknown> | undefined;
          if (generalServiceProps) {
            generalServiceProps['dcterms:identifier'] = parentIdentifier.value;
            if (newSchemaVersion.value) {
              generalServiceProps['schema:version'] = newSchemaVersion.value;
            }
          }
        }

        const { data, error } = await usePublish(
          selectedShapeName.value,
          currentResourceAddressTemplateId.value!,
          formattedJsonLd
        );

        if (error.value) {
          handleSubmitResult({ ...error.value, show: true, severity: 'error' });
        } else if (data.value) {
          handleSubmitResult(
            {
              show: true,
              title: '',
              description: '',
              severity: 'success' as const,
            },
            data.value.id
          );
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An unknown error occurred';
        console.error('Form submission error:', err);
        handleSubmitResult({
          show: true,
          title: 'Submission Error',
          description: message,
          severity: 'error' as const,
        });
      } finally {
        setSubmitLoading(false);
      }
    };

    const selectedSchemaTitle = computed(() => {
      if (!selectedShapeName.value || !schemasStore.schemas) {
        return '';
      }
      const schema = schemasStore.schemas.find((s) => s.value === selectedShapeName.value);
      return schema?.label ?? '';
    });

    const isNewVersion = ref(false);

    const overlayTitle = computed(() => {
      const action = isNewVersion.value ? 'Create new version of' : 'Create a';
      return `${action} ${selectedSchemaTitle.value} resource description`;
    });

    const closeOverlay = () => {
      sessionStorage.removeItem('newVersionCredentialSubject');
      sessionStorage.removeItem('newVersionSharingMethodId');
      sessionStorage.removeItem('newVersionAssetId');
      parentIdentifier.value = undefined;
      newSchemaVersion.value = undefined;
      window.location.assign('/');
    };

    const reset = () => {
      selectedShapeName.value = undefined;
      statusMessage.value = undefined;
      submitLoading.value = false;
      formData.value = {};
      formErrors.value = [];
      currentSchema.value = null;
      currentSchemaError.value = null;
      schemaLoading.value = false;
      initialFormData.value = null;
      isNewVersion.value = false;
      initialSharingMethodId.value = undefined;
      initialAssetId.value = undefined;
      parentIdentifier.value = undefined;
      newSchemaVersion.value = undefined;
    };

    const onFormChange = (event: JsonFormsChangeEvent) => {
      setFormErrors(event.errors);
    };

    const onMetadataChange = (metadata: any) => {
      setMetadata(metadata);
    };

    return {
      selectedShapeName,
      statusMessage,
      submitLoading,
      formData,
      formErrors,
      currentResourceAddressTemplateId,
      currentSchema,
      currentSchemaError,
      schemaLoading,
      metadata,
      hasStatusMessage,
      prefixes,
      currentFormSchema,
      shouldShowForm,
      config,
      schemaLoadingError,
      setSelectedShapeName,
      setInitialFormData,
      setInitialSharingMethodId,
      setInitialAssetId,
      setParentIdentifier,
      setNewSchemaVersion,
      isNewVersion,
      loadSchema,
      setStatusMessage,
      clearStatusMessage,
      setSubmitLoading,
      setFormData,
      clearFormData,
      setFormErrors,
      handleSubmitResult,
      submitForm,
      onFormChange,
      onMetadataChange,
      reset,
      overlayTitle,
      closeOverlay,
    };
  }
);
