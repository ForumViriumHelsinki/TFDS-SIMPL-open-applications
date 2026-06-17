import { describe, it, expect, beforeEach, vi, beforeAll, afterAll } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref } from 'vue';
import { useResourceDescriptionCreationStore } from '@/store/resourceDescriptionCreation';
import type { UIError, PossibleUIError } from '@/util/errors';
import type { ConvertedSchema } from '@/types/shapes';
import type { ErrorObject } from 'ajv';
import type { JsonFormsChangeEvent } from '@jsonforms/vue';

// Mock external composables and utilities
vi.mock('@/services/composables/useConvertedSchemas');
vi.mock('@/services/composables/useIdentityAttributes');
vi.mock('@/services/composables/useAccessPolicyActions');
vi.mock('@/services/composables/usePublish');
vi.mock('@/util/ttlParser/jsonld');
vi.mock('@/util/schemas');
vi.mock('@/store/temporarySuccessMessage');
vi.mock('@/store/schemas');
vi.mock('@/util/getEnv');
vi.mock('@vueuse/core');

// Mock nextTick
vi.mock('vue', async () => {
  const actual = await vi.importActual('vue');
  return {
    ...actual,
    nextTick: vi.fn().mockImplementation((cb?: () => void) => {
      if (cb) cb();
      return Promise.resolve();
    }),
  };
});

// Import the mocked functions
import { useConvertedSchemas } from '@/services/composables/useConvertedSchemas';
import { useIdentityAttributes } from '@/services/composables/useIdentityAttributes';
import { useAccessPolicyActions } from '@/services/composables/useAccessPolicyActions';
import { usePublish } from '@/services/composables/usePublish';
import { formatDataToJsonLd } from '@/util/ttlParser/jsonld';
import { useScroll } from '@vueuse/core';
import { useTemporarySuccessMessageStore } from '@/store/temporarySuccessMessage';
import { useSchemasStore } from '@/store/schemas';
import { getPublicEnv } from '@/util/getEnv';

// Create typed mock functions
const mockUseConvertedSchemas = vi.mocked(useConvertedSchemas);
const mockUseIdentityAttributes = vi.mocked(useIdentityAttributes);
const mockUseAccessPolicyActions = vi.mocked(useAccessPolicyActions);
const mockUsePublish = vi.mocked(usePublish);
const mockFormatDataToJsonLd = vi.mocked(formatDataToJsonLd);
const mockUseTemporarySuccessMessageStore = vi.mocked(useTemporarySuccessMessageStore);
const mockUseSchemasStore = vi.mocked(useSchemasStore);
const mockGetPublicEnv = vi.mocked(getPublicEnv);
const mockUseScroll = vi.mocked(useScroll);

describe('resourceDescriptionCreationStore', () => {
  // Mock reactive refs for the composables
  const mockIdentityAttributesRef = ref([{ identifier: 'attr1', code: 'Attribute 1' }]);
  const mockAccessPolicyActionsRef = ref([{ label: 'action1', value: 'Action 1' }]);
  const mockIdentityAttributesErrorRef = ref<UIError | null>(null);
  const mockAccessPolicyActionsErrorRef = ref<UIError | null>(null);
  const mockIdentityAttributesLoadingRef = ref<boolean>(false);
  const mockAccessPolicyActionsLoadingRef = ref<boolean>(false);
  const mockY = ref(0);
  const mockX = ref(0);

  const originalLocation = window.location;
  const mockAssign = vi.fn();

  beforeAll(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { assign: mockAssign },
    });
  });

  afterAll(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    // Setup default mocks for utility functions
    mockFormatDataToJsonLd.mockResolvedValue({ '@context': {}, data: 'formatted' });

    // Setup mock for temporarySuccessMessageStore
    const mockSetSuccessDetails = vi.fn();
    mockUseTemporarySuccessMessageStore.mockReturnValue({
      setSuccessDetails: mockSetSuccessDetails,
    } as any);

    // Setup mock for useSchemasStore
    const mockSchemasMetadata = [
      {
        id: 'data-offeringShape',
        title: 'Data Offering',
        name: 'Data Offering',
        description: '',
        resourceType: 'data',
        version: '1.0.0',
      },
      {
        id: 'application-health',
        title: 'Application Asset',
        name: 'Application Asset',
        description: '',
        resourceType: 'application',
        version: '1.0.0',
      },
    ];
    mockUseSchemasStore.mockReturnValue({
      schemas: [
        { label: 'Data Offering', value: 'data-offeringShape' },
        { label: 'Application Asset', value: 'application-health' },
      ],
      schemasMetadata: mockSchemasMetadata,
      schemasError: null,
      schemasLoading: false,
      hasSchemas: true,
      isLoading: false,
      getSchemaById: (id: string) => mockSchemasMetadata.find((s) => s.id === id),
      getResourceTypeById: (id: string) =>
        mockSchemasMetadata.find((s) => s.id === id)?.resourceType ?? null,
      getSchemaIdByResourceType: (type: string) =>
        mockSchemasMetadata.find((s) => s.resourceType.toLowerCase() === type.toLowerCase())?.id,
    } as any);

    // Setup mock for getPublicEnv
    mockGetPublicEnv.mockReturnValue({
      PUBLIC_DEFAULT_TEMPLATE_ID: '4',
    });

    // Setup default mock for useConvertedSchemas to prevent unhandled rejections
    mockUseConvertedSchemas.mockResolvedValue({
      data: ref(null),
      error: ref(null),
      isLoading: ref(false),
    });

    // Setup default mock for usePublish to prevent unhandled rejections
    mockUsePublish.mockResolvedValue({
      data: ref(null),
      error: ref(null),
      isLoading: ref(false),
    });

    // Setup composable mocks
    mockUseIdentityAttributes.mockReturnValue({
      identityAttributes: mockIdentityAttributesRef,
      error: mockIdentityAttributesErrorRef,
      isLoading: mockIdentityAttributesLoadingRef,
    });

    mockUseAccessPolicyActions.mockReturnValue({
      accessPolicyActions: mockAccessPolicyActionsRef,
      error: mockAccessPolicyActionsErrorRef,
      isLoading: mockAccessPolicyActionsLoadingRef,
    });

    mockUseScroll.mockReturnValue({ x: mockX, y: mockY });

    // Reset mock ref values
    mockY.value = 0;
    mockX.value = 0;
    mockIdentityAttributesRef.value = [{ identifier: 'attr1', code: 'Attribute 1' }];
    mockAccessPolicyActionsRef.value = [{ label: 'action1', value: 'Action 1' }];
    mockIdentityAttributesErrorRef.value = null;
    mockAccessPolicyActionsErrorRef.value = null;
    mockIdentityAttributesLoadingRef.value = false;
    mockAccessPolicyActionsLoadingRef.value = false;
  });

  const mockSchema: ConvertedSchema = {
    root: {
      'test-shape': {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
        },
      },
    },
    prefixes: { ex: 'http://example.org/' },
  };

  const mockError: UIError = {
    title: 'Test Error',
    description: 'Something went wrong',
  };

  const mockFormErrors: ErrorObject<string, Record<string, any>, unknown>[] = [
    {
      instancePath: '/name',
      schemaPath: '#/properties/name/required',
      keyword: 'required',
      params: { missingProperty: 'name' },
      message: 'must have required property name',
      data: {},
      schema: true,
    },
  ];

  describe('initial state', () => {
    it('should initialize with correct default values', () => {
      const store = useResourceDescriptionCreationStore();

      expect(store.selectedShapeName).toBeUndefined();
      expect(store.statusMessage).toBeUndefined();
      expect(store.submitLoading).toBe(false);
      expect(store.formData).toEqual({});
      expect(store.formErrors).toEqual([]);
      expect(store.currentSchema).toBeNull();
      expect(store.currentSchemaError).toBeNull();
      expect(store.schemaLoading).toBe(false);
      expect(store.metadata).toEqual({});
    });
  });

  describe('computed properties', () => {
    describe('hasStatusMessage', () => {
      it('should return false when no status message is set', () => {
        const store = useResourceDescriptionCreationStore();
        expect(store.hasStatusMessage).toBe(false);
      });

      it('should return true when status message is set', () => {
        const store = useResourceDescriptionCreationStore();
        const statusMessage: StatusMessage = {
          title: 'Success',
          description: 'Operation completed',
          severity: 'success',
        };
        store.setStatusMessage(statusMessage);
        expect(store.hasStatusMessage).toBe(true);
      });
    });

    describe('prefixes', () => {
      it('should return empty object when no schema is loaded', () => {
        const store = useResourceDescriptionCreationStore();
        expect(store.prefixes).toEqual({});
      });

      it('should return prefixes from current schema', () => {
        const store = useResourceDescriptionCreationStore();
        store.currentSchema = mockSchema;
        expect(store.prefixes).toEqual({ ex: 'http://example.org/' });
      });
    });

    describe('currentFormSchema', () => {
      it('should return undefined when no schema is loaded', () => {
        const store = useResourceDescriptionCreationStore();
        expect(store.currentFormSchema).toBeUndefined();
      });

      it('should return first schema from root when schema is loaded', () => {
        const store = useResourceDescriptionCreationStore();
        store.currentSchema = mockSchema;
        expect(store.currentFormSchema).toEqual(mockSchema.root['test-shape']);
      });
    });

    describe('shouldShowForm', () => {
      it('should return false when identity attributes are empty', () => {
        mockIdentityAttributesRef.value = [];
        const store = useResourceDescriptionCreationStore();
        store.currentSchema = mockSchema;
        expect(store.shouldShowForm).toBe(false);
      });

      it('should return false when access policy actions are empty', () => {
        mockAccessPolicyActionsRef.value = [];
        const store = useResourceDescriptionCreationStore();
        store.currentSchema = mockSchema;
        expect(store.shouldShowForm).toBe(false);
      });

      it('should return false when no form schema is available', () => {
        const store = useResourceDescriptionCreationStore();
        expect(store.shouldShowForm).toBe(false);
      });

      it('should return true when all conditions are met', () => {
        const store = useResourceDescriptionCreationStore();
        store.currentSchema = mockSchema;
        expect(store.shouldShowForm).toBe(true);
      });
    });

    describe('config', () => {
      it('should return correct configuration', () => {
        const store = useResourceDescriptionCreationStore();
        store.setSelectedShapeName('data-offeringShape');

        const config = store.config;

        expect(config.identityAttributes).toEqual(mockIdentityAttributesRef.value);
        expect(config.accessPolicyActions).toEqual(mockAccessPolicyActionsRef.value);
        expect(config.resourceSharingMethod).toEqual({
          offeringType: 'data',
          agentType: 'provider',
          apiBaseUrl: '/api',
        });
      });
    });

    describe('schemaLoadingError', () => {
      it('should return null when no errors exist', () => {
        const store = useResourceDescriptionCreationStore();
        expect(store.schemaLoadingError).toBeNull();
      });

      it('should return current schema error when it exists', () => {
        const store = useResourceDescriptionCreationStore();
        store.currentSchemaError = mockError;
        expect(store.schemaLoadingError).toEqual(mockError);
      });

      it('should return identity attributes error when it exists', () => {
        mockIdentityAttributesErrorRef.value = mockError as any;
        const store = useResourceDescriptionCreationStore();
        expect(store.schemaLoadingError).toEqual(mockError);
      });

      it('should return access policy actions error when it exists', () => {
        mockIdentityAttributesErrorRef.value = mockError as any;
        const store = useResourceDescriptionCreationStore();
        expect(store.schemaLoadingError).toEqual(mockError);
      });
    });

    describe('currentResourceAddressTemplateId', () => {
      it('should return undefined when no template id is set', () => {
        const store = useResourceDescriptionCreationStore();
        expect(store.currentResourceAddressTemplateId).toBe(undefined);
      });

      it('should return template id from metadata', () => {
        const store = useResourceDescriptionCreationStore();
        store.onMetadataChange({ templateId: 'template-123' });
        expect(store.currentResourceAddressTemplateId).toBe('template-123');
      });
    });
  });

  describe('setSelectedShapeName', () => {
    it('should not trigger schema loading when same shape name is selected', () => {
      const store = useResourceDescriptionCreationStore();
      store.selectedShapeName = 'test-shape';

      store.setSelectedShapeName('test-shape');

      expect(mockUseConvertedSchemas).not.toHaveBeenCalled();
    });

    it('should trigger schema loading when different shape name is selected', async () => {
      mockUseConvertedSchemas.mockResolvedValue({
        data: ref(mockSchema),
        error: ref(null),
        isLoading: ref(false),
      });

      const store = useResourceDescriptionCreationStore();
      store.setSelectedShapeName('test-shape');

      await vi.waitFor(() => {
        expect(mockUseConvertedSchemas).toHaveBeenCalledWith('test-shape');
      });
    });

    it('should set shape name to undefined', () => {
      const store = useResourceDescriptionCreationStore();
      store.setSelectedShapeName(undefined);

      expect(store.selectedShapeName).toBeUndefined();
    });
  });

  describe('loadSchema', () => {
    it('should not load schema when no shape name is selected', async () => {
      const store = useResourceDescriptionCreationStore();
      await store.loadSchema();

      expect(mockUseConvertedSchemas).not.toHaveBeenCalled();
      expect(store.schemaLoading).toBe(false);
    });

    it('should successfully load schema', async () => {
      mockUseConvertedSchemas.mockResolvedValue({
        data: ref(mockSchema),
        error: ref(null),
        isLoading: ref(false),
      });

      const store = useResourceDescriptionCreationStore();
      store.selectedShapeName = 'test-shape';

      await store.loadSchema();

      expect(store.currentSchema).toEqual(mockSchema);
      expect(store.currentSchemaError).toBeNull();
      expect(store.schemaLoading).toBe(false);
    });

    it('should handle schema loading error', async () => {
      mockUseConvertedSchemas.mockResolvedValue({
        data: ref(null),
        error: ref(mockError),
        isLoading: ref(false),
      });

      const store = useResourceDescriptionCreationStore();
      store.selectedShapeName = 'test-shape';

      await store.loadSchema();

      expect(store.currentSchema).toBeNull();
      expect(store.currentSchemaError).toEqual(mockError);
      expect(store.schemaLoading).toBe(false);
    });

    it('should set loading state during schema loading', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockUseConvertedSchemas.mockReturnValue(promise as any);

      const store = useResourceDescriptionCreationStore();
      store.selectedShapeName = 'test-shape';

      const loadPromise = store.loadSchema();

      expect(store.schemaLoading).toBe(true);

      resolvePromise!({
        data: ref(mockSchema),
        error: ref(null),
        isLoading: ref(false),
      });

      await loadPromise;

      expect(store.schemaLoading).toBe(false);
    });
  });

  describe('form data management', () => {
    it('should set and clear form data', () => {
      const store = useResourceDescriptionCreationStore();
      const formData = { name: 'Test', description: 'Test description' };

      store.setFormData(formData);
      expect(store.formData).toEqual(formData);

      store.clearFormData();
      expect(store.formData).toEqual({});
    });

    it('should set form errors', () => {
      const store = useResourceDescriptionCreationStore();

      store.setFormErrors(mockFormErrors);
      expect(store.formErrors).toEqual(mockFormErrors);

      store.setFormErrors(undefined);
      expect(store.formErrors).toBeUndefined();
    });
  });

  describe('status message management', () => {
    it('should set and clear status messages', () => {
      const store = useResourceDescriptionCreationStore();
      const statusMessage: StatusMessage = {
        title: 'Success',
        description: 'Operation completed',
        severity: 'success',
      };

      store.setStatusMessage(statusMessage);
      expect(store.statusMessage).toEqual(statusMessage);

      store.clearStatusMessage();
      expect(store.statusMessage).toBeUndefined();
    });
  });

  describe('loading state management', () => {
    it('should set submit loading state', () => {
      const store = useResourceDescriptionCreationStore();

      store.setSubmitLoading(true);
      expect(store.submitLoading).toBe(true);

      store.setSubmitLoading(false);
      expect(store.submitLoading).toBe(false);
    });
  });

  describe('metadata management', () => {
    it('should set metadata', () => {
      const store = useResourceDescriptionCreationStore();
      const metadata = { templateId: 'template-123', other: 'value' };

      store.onMetadataChange(metadata);
      expect(store.metadata).toEqual(metadata);
    });
  });

  describe('handleSubmitResult', () => {
    it('should set status message and handle success', async () => {
      const store = useResourceDescriptionCreationStore();
      const result: StatusMessage = {
        title: 'Success',
        description: 'Form submitted successfully',
        severity: 'success',
      };
      const resourceId = 'resource-123';
      store.selectedShapeName = 'test-shape';

      store.handleSubmitResult(result, resourceId);

      expect(store.statusMessage).toEqual(result);

      // Verify success details set
      const mockSetSuccessDetails = mockUseTemporarySuccessMessageStore().setSuccessDetails;
      expect(mockSetSuccessDetails).toHaveBeenCalledWith(resourceId, 'test-shape');

      // Verify overlay closed (navigation)
      expect(mockAssign).toHaveBeenCalledWith('/');
    });
  });

  describe('submitForm', () => {
    beforeEach(() => {
      mockFormatDataToJsonLd.mockResolvedValue({ '@context': {}, data: 'formatted' });
    });

    it('should not submit when no schema is available', async () => {
      const store = useResourceDescriptionCreationStore();

      await store.submitForm();

      expect(mockUsePublish).not.toHaveBeenCalled();
      expect(store.submitLoading).toBe(false);
    });

    it('should not submit when no shape name is selected', async () => {
      const store = useResourceDescriptionCreationStore();
      store.currentSchema = mockSchema;

      await store.submitForm();

      expect(mockUsePublish).not.toHaveBeenCalled();
      expect(store.submitLoading).toBe(false);
    });

    it('should successfully submit form', async () => {
      mockUsePublish.mockResolvedValue({
        data: ref({
          id: 'published-resource',
          sdHash: 'hash',
          status: 'active',
          issuer: 'issuer',
          validatorDids: [],
          credentialSubject: {},
          type: 'type',
        }),
        error: ref(null),
        isLoading: ref(false),
      });

      const store = useResourceDescriptionCreationStore();
      store.currentSchema = mockSchema;
      store.selectedShapeName = 'test-shape';
      store.setFormData({ name: 'Test Resource', description: 'Test description' });
      store.onMetadataChange({ templateId: 'template-123' });

      await store.submitForm();

      expect(mockFormatDataToJsonLd).toHaveBeenCalled();
      expect(mockUsePublish).toHaveBeenCalledWith('test-shape', 'template-123', {
        '@context': {},
        data: 'formatted',
      });
      expect(store.statusMessage?.severity).toBe('success');
      expect(store.statusMessage?.title).toBe('');
      expect(store.submitLoading).toBe(false);

      // Verify success handling
      const mockSetSuccessDetails = mockUseTemporarySuccessMessageStore().setSuccessDetails;
      expect(mockSetSuccessDetails).toHaveBeenCalledWith('published-resource', 'test-shape');
      expect(mockAssign).toHaveBeenCalledWith('/');
    });

    it('should handle publish error', async () => {
      mockUsePublish.mockResolvedValue({
        data: ref(null),
        error: ref(mockError),
        isLoading: ref(false),
      });

      const store = useResourceDescriptionCreationStore();
      store.currentSchema = mockSchema;
      store.selectedShapeName = 'test-shape';
      store.setFormData({ name: 'Test Resource' });

      await store.submitForm();

      expect(store.statusMessage?.severity).toBe('error');
      expect(store.statusMessage?.title).toBe('Test Error');
      expect(store.submitLoading).toBe(false);
    });

    it('should handle JSON parsing or formatting errors', async () => {
      mockFormatDataToJsonLd.mockRejectedValue(new Error('Formatting failed'));

      const store = useResourceDescriptionCreationStore();
      store.currentSchema = mockSchema;
      store.selectedShapeName = 'test-shape';
      store.setFormData({ name: 'Test Resource' });

      await store.submitForm();

      expect(store.statusMessage?.severity).toBe('error');
      expect(store.statusMessage?.title).toBe('Submission Error');
      expect(store.statusMessage?.description).toBe('Formatting failed');
      expect(store.submitLoading).toBe(false);
    });

    it('should filter out form data keys not present in the schema', async () => {
      mockUsePublish.mockResolvedValue({
        data: ref({
          id: 'published-resource',
          sdHash: 'hash',
          status: 'active',
          issuer: 'issuer',
          validatorDids: [],
          credentialSubject: {},
          type: 'type',
        }),
        error: ref(null),
        isLoading: ref(false),
      });

      const store = useResourceDescriptionCreationStore();
      store.currentSchema = mockSchema;
      store.selectedShapeName = 'test-shape';
      store.setFormData({ name: 'Test Resource', unknownField: 'extra-data' });
      store.onMetadataChange({ templateId: 'template-123' });

      await store.submitForm();

      expect(mockFormatDataToJsonLd).toHaveBeenCalledWith(
        { name: 'Test Resource' },
        expect.any(Object),
        expect.any(Object)
      );
      expect(store.statusMessage?.severity).toBe('success');
    });

    it('should show error when currentFormSchema is undefined', async () => {
      const store = useResourceDescriptionCreationStore();
      store.currentSchema = { root: {}, prefixes: {} };
      store.selectedShapeName = 'test-shape';
      store.setFormData({ name: 'Test Resource' });

      await store.submitForm();

      expect(mockFormatDataToJsonLd).not.toHaveBeenCalled();
      expect(store.statusMessage?.severity).toBe('error');
      expect(store.statusMessage?.title).toBe('Submission Error');
      expect(store.statusMessage?.description).toBe(
        'No form schema available for the selected shape.'
      );
      expect(store.submitLoading).toBe(false);
    });

    it('should set loading state during submit', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockUsePublish.mockReturnValue(promise as any);

      const store = useResourceDescriptionCreationStore();
      store.currentSchema = mockSchema;
      store.selectedShapeName = 'test-shape';
      store.setFormData({ name: 'Test Resource' });

      const submitPromise = store.submitForm();

      expect(store.submitLoading).toBe(true);

      resolvePromise!({
        data: ref({ id: 'published-resource' }),
        error: ref(null),
        isLoading: ref(false),
      });

      await submitPromise;

      expect(store.submitLoading).toBe(false);
    });

    describe('new version submission', () => {
      const setupNewVersionStore = () => {
        const store = useResourceDescriptionCreationStore();
        store.currentSchema = mockSchema;
        store.selectedShapeName = 'test-shape';
        store.setFormData({ name: 'Test Resource' });
        store.onMetadataChange({ templateId: 'template-123' });
        // setInitialFormData with non-null data sets isNewVersion = true
        store.setInitialFormData({ prefilled: true });
        return store;
      };

      beforeEach(() => {
        mockUsePublish.mockResolvedValue({
          data: ref({
            id: 'published-resource',
            sdHash: 'hash',
            status: 'active',
            issuer: 'issuer',
          }),
          error: ref(null),
          isLoading: ref(false),
        });
      });

      it('setParentIdentifier stores the parent id used during submission', async () => {
        mockFormatDataToJsonLd.mockResolvedValue({
          '@context': {},
          'simpl:generalServiceProperties': {},
        });
        const store = setupNewVersionStore();

        store.setParentIdentifier('web:did:parent-id');
        await store.submitForm();

        expect(mockUsePublish).toHaveBeenCalledWith(
          'test-shape',
          'template-123',
          expect.objectContaining({
            'simpl:generalServiceProperties': expect.objectContaining({
              'dcterms:identifier': 'web:did:parent-id',
            }),
          })
        );
      });

      it('setNewSchemaVersion stores the version used during submission', async () => {
        mockFormatDataToJsonLd.mockResolvedValue({
          '@context': {},
          'simpl:generalServiceProperties': {},
        });
        const store = setupNewVersionStore();

        store.setParentIdentifier('web:did:parent-id');
        store.setNewSchemaVersion('1');
        await store.submitForm();

        expect(mockUsePublish).toHaveBeenCalledWith(
          'test-shape',
          'template-123',
          expect.objectContaining({
            'simpl:generalServiceProperties': expect.objectContaining({
              'dcterms:identifier': 'web:did:parent-id',
              'schema:version': '1',
            }),
          })
        );
      });

      it('injects only dcterms:identifier when schema version is not set', async () => {
        mockFormatDataToJsonLd.mockResolvedValue({
          '@context': {},
          'simpl:generalServiceProperties': {},
        });
        const store = setupNewVersionStore();

        store.setParentIdentifier('web:did:parent-id');
        // intentionally not calling setNewSchemaVersion
        await store.submitForm();

        const publishedPayload = mockUsePublish.mock.calls[0][2] as Record<string, any>;
        const generalProps = publishedPayload['simpl:generalServiceProperties'] as Record<string, any>;
        expect(generalProps['dcterms:identifier']).toBe('web:did:parent-id');
        expect(generalProps['schema:version']).toBeUndefined();
      });

      it('does not inject versioning fields when isNewVersion is false', async () => {
        mockFormatDataToJsonLd.mockResolvedValue({
          '@context': {},
          'simpl:generalServiceProperties': {},
        });
        const store = useResourceDescriptionCreationStore();
        store.currentSchema = mockSchema;
        store.selectedShapeName = 'test-shape';
        store.setFormData({ name: 'Test Resource' });
        store.onMetadataChange({ templateId: 'template-123' });
        // setInitialFormData(null) keeps isNewVersion = false
        store.setInitialFormData(null);
        store.setParentIdentifier('web:did:parent-id');

        await store.submitForm();

        const publishedPayload = mockUsePublish.mock.calls[0][2] as Record<string, any>;
        const generalProps = publishedPayload['simpl:generalServiceProperties'] as Record<string, any>;
        expect(generalProps['dcterms:identifier']).toBeUndefined();
      });

      it('does not inject versioning fields when generalServiceProperties is absent', async () => {
        mockFormatDataToJsonLd.mockResolvedValue({ '@context': {}, data: 'formatted' });
        const store = setupNewVersionStore();

        store.setParentIdentifier('web:did:parent-id');
        store.setNewSchemaVersion('1');
        await store.submitForm();

        // publish is still called; no crash and no injection on missing key
        expect(mockUsePublish).toHaveBeenCalledWith('test-shape', 'template-123', {
          '@context': {},
          data: 'formatted',
        });
      });
    });
  });

  describe('reset', () => {
    it('should reset all state to initial values', () => {
      const store = useResourceDescriptionCreationStore();

      // Set some values first
      store.selectedShapeName = 'test-shape';
      store.setStatusMessage({
        title: 'Test',
        description: 'Test',
        severity: 'success',
      });
      store.setSubmitLoading(true);
      store.setFormData({ name: 'test' });
      store.setFormErrors(mockFormErrors);
      store.currentSchema = mockSchema;
      store.currentSchemaError = mockError;
      store.schemaLoading = true;

      store.reset();

      expect(store.selectedShapeName).toBeUndefined();
      expect(store.statusMessage).toBeUndefined();
      expect(store.submitLoading).toBe(false);
      expect(store.formData).toEqual({});
      expect(store.formErrors).toEqual([]);
      expect(store.currentSchema).toBeNull();
      expect(store.currentSchemaError).toBeNull();
      expect(store.schemaLoading).toBe(false);
    });
  });

  describe('event handlers', () => {
    describe('onFormChange', () => {
      it('should update form errors from JsonForms change event', () => {
        const store = useResourceDescriptionCreationStore();
        const changeEvent: JsonFormsChangeEvent = {
          data: { name: 'test' },
          errors: mockFormErrors,
        };

        store.onFormChange(changeEvent);

        expect(store.formErrors).toEqual(mockFormErrors);
      });
    });

    describe('onMetadataChange', () => {
      it('should update metadata', () => {
        const store = useResourceDescriptionCreationStore();
        const metadata = { templateId: 'new-template' };

        store.onMetadataChange(metadata);

        expect(store.metadata).toEqual(metadata);
      });
    });
  });

  describe('store interface', () => {
    it('should return all expected properties and methods', () => {
      const store = useResourceDescriptionCreationStore();

      // State properties
      expect(store).toHaveProperty('selectedShapeName');
      expect(store).toHaveProperty('statusMessage');
      expect(store).toHaveProperty('submitLoading');
      expect(store).toHaveProperty('formData');
      expect(store).toHaveProperty('formErrors');
      expect(store).toHaveProperty('currentResourceAddressTemplateId');
      expect(store).toHaveProperty('currentSchema');
      expect(store).toHaveProperty('currentSchemaError');
      expect(store).toHaveProperty('schemaLoading');
      expect(store).toHaveProperty('metadata');

      // Computed properties
      expect(store).toHaveProperty('hasStatusMessage');
      expect(store).toHaveProperty('prefixes');
      expect(store).toHaveProperty('currentFormSchema');
      expect(store).toHaveProperty('shouldShowForm');
      expect(store).toHaveProperty('config');
      expect(store).toHaveProperty('schemaLoadingError');
      expect(store).toHaveProperty('overlayTitle');

      // Methods
      expect(typeof store.setSelectedShapeName).toBe('function');
      expect(typeof store.loadSchema).toBe('function');
      expect(typeof store.setStatusMessage).toBe('function');
      expect(typeof store.clearStatusMessage).toBe('function');
      expect(typeof store.setSubmitLoading).toBe('function');
      expect(typeof store.setFormData).toBe('function');
      expect(typeof store.clearFormData).toBe('function');
      expect(typeof store.setFormErrors).toBe('function');
      expect(typeof store.handleSubmitResult).toBe('function');
      expect(typeof store.submitForm).toBe('function');
      expect(typeof store.onFormChange).toBe('function');
      expect(typeof store.onMetadataChange).toBe('function');
      expect(typeof store.reset).toBe('function');
      expect(typeof store.closeOverlay).toBe('function');
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete workflow from shape selection to successful submission', async () => {
      // Mock all required composables
      mockUseConvertedSchemas.mockResolvedValue({
        data: ref(mockSchema),
        error: ref(null),
        isLoading: ref(false),
      });
      mockUsePublish.mockResolvedValue({
        data: ref({
          id: 'published-resource',
          sdHash: 'hash',
          status: 'active',
          issuer: 'issuer',
          validatorDids: [],
          credentialSubject: {},
          type: 'type',
          uploadDatetime: '2023-01-01',
          statusDatetime: '2023-01-01',
        }),
        error: ref(null),
        isLoading: ref(false),
      });

      const store = useResourceDescriptionCreationStore();
      mockY.value = 100;

      // Step 1: Select shape name and load schema
      store.setSelectedShapeName('test-shape');

      await vi.waitFor(() => {
        expect(store.currentSchema).toEqual(mockSchema);
      });

      // Step 2: Fill form data
      store.setFormData({ name: 'Test Resource', description: 'A test resource' });
      store.onMetadataChange({ templateId: 'template-123' });

      // Step 3: Verify form is ready
      expect(store.shouldShowForm).toBe(true);

      // Step 4: Submit form
      await store.submitForm();

      // Step 5: Verify successful submission
      expect(store.statusMessage?.severity).toBe('success');
      expect(store.statusMessage?.title).toBe('');

      // Verify success handling
      const mockSetSuccessDetails = mockUseTemporarySuccessMessageStore().setSuccessDetails;
      expect(mockSetSuccessDetails).toHaveBeenCalledWith('published-resource', 'test-shape');
      expect(mockAssign).toHaveBeenCalledWith('/');
    });

    it('should handle error workflow', async () => {
      // Mock schema loading error
      mockUseConvertedSchemas.mockResolvedValue({
        data: ref(null),
        error: ref(mockError),
        isLoading: ref(false),
      });

      const store = useResourceDescriptionCreationStore();

      // Step 1: Try to select shape name
      store.setSelectedShapeName('invalid-shape');

      await vi.waitFor(() => {
        expect(store.currentSchemaError).toEqual(mockError);
      });

      // Step 2: Verify error state
      expect(store.schemaLoadingError).toEqual(mockError);
      expect(store.shouldShowForm).toBe(false);
      expect(store.currentSchema).toBeNull();
    });
  });
});
