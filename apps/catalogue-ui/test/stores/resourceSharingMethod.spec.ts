import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useResourceSharingMethodStore } from '@/stores/resourceSharingMethod';
import type { UIError } from 'types/errors';

// Mock the composables and stores that are dependencies
const mockGetResourceAddressTemplates = vi.fn();
const mockGetResourceAddressSchema = vi.fn();
const mockGetResourceAddressUiSchema = vi.fn();

vi.mock('@/services/composables/useResourceAddress', () => ({
  useResourceAddress: () => ({
    getResourceAddressTemplates: mockGetResourceAddressTemplates,
    getResourceAddressSchema: mockGetResourceAddressSchema,
    getResourceAddressUiSchema: mockGetResourceAddressUiSchema,
  }),
}));

const mockResourceDescriptionStore = {
  resourceDescriptionSharingMethodId: undefined as string | undefined,
  resourceDescriptionOfferingType: undefined as string | undefined,
};

vi.mock('@/stores/resourceDescription', () => ({
  useResourceDescriptionStore: () => mockResourceDescriptionStore,
}));

describe('resourceSharingMethodStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    
    // Reset mock store state
    mockResourceDescriptionStore.resourceDescriptionSharingMethodId = undefined;
    mockResourceDescriptionStore.resourceDescriptionOfferingType = undefined;
  });

  const mockTemplates = [
    { id: 'template-1', name: 'Template 1' },
    { id: 'template-2', name: 'Template 2' },
  ];

  const mockSchema = {
    type: 'object',
    properties: {
      url: { type: 'string' },
      apiKey: { type: 'string' },
    },
  };

  const mockUiSchema = {
    url: { 'ui:widget': 'text' },
    apiKey: { 'ui:widget': 'password' },
  };

  const mockError: UIError = {
    title: 'Test Error',
    description: 'Something went wrong',
  };

  describe('initial state', () => {
    it('should initialize with correct default values', () => {
      const store = useResourceSharingMethodStore();

      expect(store.sharingMethodId).toBeUndefined();
      expect(store.offeringType).toBeUndefined();
      expect(store.isTemplatesLoading).toBe(false);
      expect(store.resourceAddressTemplates).toEqual([]);
      expect(store.resourceAddressTemplatesError).toBeNull();
      expect(store.selectedTemplate).toBeUndefined();
      expect(store.selectedTemplateSchema).toBeNull();
      expect(store.selectedTemplateUiSchema).toBeNull();
      expect(store.schemasLoading).toBe(false);
      expect(store.resourceAddressForm).toEqual({ data: {}, errors: [] });
      expect(store.isResourceAddressFormValid).toBe(true);
      expect(store.isResourceAddressReady).toBe(false);
      expect(store.resourceAddress).toEqual({});
    });
  });

  describe('initializeResourceSharingMethods', () => {
    it('should initialize sharing method and offering type from resource description store', async () => {
      const store = useResourceSharingMethodStore();
      
      mockResourceDescriptionStore.resourceDescriptionSharingMethodId = 'api-access';
      mockResourceDescriptionStore.resourceDescriptionOfferingType = 'data-offering';
      mockGetResourceAddressTemplates.mockResolvedValue({
        data: { value: mockTemplates },
        error: { value: null },
      });

      await store.initializeResourceSharingMethods();

      expect(store.sharingMethodId).toBe('api-access');
      expect(store.offeringType).toBe('data-offering');
    });

    it('should load resource address templates during initialization', async () => {
      const store = useResourceSharingMethodStore();
      
      mockResourceDescriptionStore.resourceDescriptionSharingMethodId = 'api-access';
      mockResourceDescriptionStore.resourceDescriptionOfferingType = 'data-offering';
      mockGetResourceAddressTemplates.mockResolvedValue({
        data: { value: mockTemplates },
        error: { value: null },
      });

      await store.initializeResourceSharingMethods();

      expect(mockGetResourceAddressTemplates).toHaveBeenCalledWith({
        sharingMethodId: 'api-access',
        offeringType: 'data-offering',
      });
      expect(store.resourceAddressTemplates).toEqual(mockTemplates);
    });
  });

  describe('loadResourceAddressTemplates', () => {
    it('should set loading state during template loading', async () => {
      const store = useResourceSharingMethodStore();
      store.sharingMethodId = 'api-access';
      store.offeringType = 'data-offering';
      
      let resolvePromise: (value: any) => void;
      const promise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      
      mockGetResourceAddressTemplates.mockReturnValue(promise);

      const loadPromise = store.loadResourceAddressTemplates();
      
      expect(store.isTemplatesLoading).toBe(true);
      
      resolvePromise!({
        data: { value: mockTemplates },
        error: { value: null },
      });
      
      await loadPromise;
      
      expect(store.isTemplatesLoading).toBe(false);
    });
  });

  describe('fetchResourceAddressTemplates', () => {
    it('should fetch templates when sharing method and offering type are provided', async () => {
      const store = useResourceSharingMethodStore();
      store.sharingMethodId = 'api-access';
      store.offeringType = 'data-offering';

      mockGetResourceAddressTemplates.mockResolvedValue({
        data: { value: mockTemplates },
        error: { value: null },
      });

      await store.fetchResourceAddressTemplates();

      expect(mockGetResourceAddressTemplates).toHaveBeenCalledWith({
        sharingMethodId: 'api-access',
        offeringType: 'data-offering',
      });
      expect(store.resourceAddressTemplates).toEqual(mockTemplates);
      expect(store.resourceAddressTemplatesError).toBeNull();
    });

    it('should handle API errors when fetching templates', async () => {
      const store = useResourceSharingMethodStore();
      store.sharingMethodId = 'api-access';
      store.offeringType = 'data-offering';

      mockGetResourceAddressTemplates.mockResolvedValue({
        data: { value: null },
        error: { value: mockError },
      });

      await store.fetchResourceAddressTemplates();

      expect(store.resourceAddressTemplatesError).toEqual(mockError);
    });

    it('should set empty templates when sharing method or offering type is missing', async () => {
      const store = useResourceSharingMethodStore();
      // Don't set sharingMethodId or offeringType

      await store.fetchResourceAddressTemplates();

      expect(store.resourceAddressTemplates).toEqual([]);
      expect(mockGetResourceAddressTemplates).not.toHaveBeenCalled();
    });
  });

  describe('setSelectedTemplate', () => {
    it('should set selected template and fetch schemas', async () => {
      const store = useResourceSharingMethodStore();

      mockGetResourceAddressSchema.mockResolvedValue({
        data: { value: mockSchema },
        error: { value: null },
      });
      mockGetResourceAddressUiSchema.mockResolvedValue({
        data: { value: mockUiSchema },
        error: { value: null },
      });

      await store.setSelectedTemplate('template-1');

      expect(store.selectedTemplate).toBe('template-1');
      expect(mockGetResourceAddressSchema).toHaveBeenCalledWith({ templateId: 'template-1' });
      expect(mockGetResourceAddressUiSchema).toHaveBeenCalledWith({ templateId: 'template-1' });
      expect(store.selectedTemplateSchema).toEqual(mockSchema);
      expect(store.selectedTemplateUiSchema).toEqual(mockUiSchema);
    });

    it('should handle schema loading state', async () => {
      const store = useResourceSharingMethodStore();

      let resolveSchemaPromise: (value: any) => void;
      let resolveUiSchemaPromise: (value: any) => void;
      
      const schemaPromise = new Promise(resolve => {
        resolveSchemaPromise = resolve;
      });
      const uiSchemaPromise = new Promise(resolve => {
        resolveUiSchemaPromise = resolve;
      });

      mockGetResourceAddressSchema.mockReturnValue(schemaPromise);
      mockGetResourceAddressUiSchema.mockReturnValue(uiSchemaPromise);

      const setTemplatePromise = store.setSelectedTemplate('template-1');

      expect(store.schemasLoading).toBe(true);

      resolveSchemaPromise!({
        data: { value: mockSchema },
        error: { value: null },
      });
      resolveUiSchemaPromise!({
        data: { value: mockUiSchema },
        error: { value: null },
      });

      await setTemplatePromise;

      expect(store.schemasLoading).toBe(false);
    });

    it('should handle schema fetch errors', async () => {
      const store = useResourceSharingMethodStore();

      mockGetResourceAddressSchema.mockResolvedValue({
        data: { value: null },
        error: { value: mockError },
      });
      mockGetResourceAddressUiSchema.mockResolvedValue({
        data: { value: mockUiSchema },
        error: { value: null },
      });

      await store.setSelectedTemplate('template-1');

      expect(store.resourceAddressTemplatesError).toEqual(mockError);
    });

    it('should handle UI schema fetch errors', async () => {
      const store = useResourceSharingMethodStore();

      mockGetResourceAddressSchema.mockResolvedValue({
        data: { value: mockSchema },
        error: { value: null },
      });
      mockGetResourceAddressUiSchema.mockResolvedValue({
        data: { value: null },
        error: { value: mockError },
      });

      await store.setSelectedTemplate('template-1');

      expect(store.resourceAddressTemplatesError).toEqual(mockError);
    });

    it('should clear template when undefined is passed', async () => {
      const store = useResourceSharingMethodStore();
      
      // First set a template
      store.selectedTemplate = 'template-1';

      await store.setSelectedTemplate(undefined);

      expect(store.selectedTemplate).toBeUndefined();
      expect(mockGetResourceAddressSchema).not.toHaveBeenCalled();
      expect(mockGetResourceAddressUiSchema).not.toHaveBeenCalled();
    });
  });

  describe('updateFormErrors', () => {
    it('should update form errors', () => {
      const store = useResourceSharingMethodStore();
      const errors = ['Error 1', 'Error 2'] as never[];

      store.updateFormErrors(errors);

      expect(store.resourceAddressForm.errors).toEqual(errors);
    });
  });

  describe('resetResourceSharingMethods', () => {
    it('should reset all store state to initial values', () => {
      const store = useResourceSharingMethodStore();

      // Set some values first
      store.sharingMethodId = 'api-access';
      store.offeringType = 'data-offering';
      store.resourceAddressTemplates = mockTemplates;
      store.resourceAddressTemplatesError = mockError;
      store.selectedTemplate = 'template-1';
      store.selectedTemplateSchema = mockSchema;
      store.selectedTemplateUiSchema = mockUiSchema;
      store.resourceAddressForm = { data: { url: 'test' }, errors: ['error'] as never[] };
      store.schemasLoading = true;

      store.resetResourceSharingMethods();

      expect(store.sharingMethodId).toBeUndefined();
      expect(store.offeringType).toBeUndefined();
      expect(store.resourceAddressTemplates).toEqual([]);
      expect(store.resourceAddressTemplatesError).toBeNull();
      expect(store.selectedTemplate).toBeUndefined();
      expect(store.selectedTemplateSchema).toBeNull();
      expect(store.selectedTemplateUiSchema).toBeNull();
      expect(store.resourceAddressForm).toEqual({ data: {}, errors: [] });
      expect(store.schemasLoading).toBe(false);
    });
  });

  describe('computed properties', () => {
    describe('isResourceAddressFormValid', () => {
      it('should return true when there are no form errors', () => {
        const store = useResourceSharingMethodStore();
        store.resourceAddressForm = { data: {}, errors: [] };

        expect(store.isResourceAddressFormValid).toBe(true);
      });

      it('should return false when there are form errors', () => {
        const store = useResourceSharingMethodStore();
        store.resourceAddressForm = { data: {}, errors: ['error'] as never[] };

        expect(store.isResourceAddressFormValid).toBe(false);
      });
    });

    describe('isResourceAddressReady', () => {
      it('should return true when all conditions are met', () => {
        const store = useResourceSharingMethodStore();
        
        store.selectedTemplateSchema = mockSchema;
        store.selectedTemplateUiSchema = mockUiSchema;
        store.selectedTemplate = 'template-1';
        store.resourceAddressForm = { data: { url: 'test' }, errors: [] };
        store.updateFormErrors([] as never[]);

        expect(store.isResourceAddressReady).toBe(true);
      });

      it('should return false when form has not been validated yet', () => {
        const store = useResourceSharingMethodStore();
        
        store.selectedTemplateSchema = mockSchema;
        store.selectedTemplateUiSchema = mockUiSchema;
        store.selectedTemplate = 'template-1';
        store.resourceAddressForm = { data: { url: 'test' }, errors: [] };

        expect(store.isResourceAddressReady).toBe(false);
      });

      it('should return false when schema is missing', () => {
        const store = useResourceSharingMethodStore();
        
        store.selectedTemplateSchema = null;
        store.selectedTemplateUiSchema = mockUiSchema;
        store.selectedTemplate = 'template-1';
        store.resourceAddressForm = { data: { url: 'test' }, errors: [] };

        expect(store.isResourceAddressReady).toBe(false);
      });

      it('should return false when UI schema is missing', () => {
        const store = useResourceSharingMethodStore();
        
        store.selectedTemplateSchema = mockSchema;
        store.selectedTemplateUiSchema = null;
        store.selectedTemplate = 'template-1';
        store.resourceAddressForm = { data: { url: 'test' }, errors: [] };

        expect(store.isResourceAddressReady).toBe(false);
      });

      it('should return false when template is not selected', () => {
        const store = useResourceSharingMethodStore();
        
        store.selectedTemplateSchema = mockSchema;
        store.selectedTemplateUiSchema = mockUiSchema;
        store.selectedTemplate = undefined;
        store.resourceAddressForm = { data: { url: 'test' }, errors: [] };

        expect(store.isResourceAddressReady).toBe(false);
      });

      it('should return false when form data is empty', () => {
        const store = useResourceSharingMethodStore();
        
        store.selectedTemplateSchema = mockSchema;
        store.selectedTemplateUiSchema = mockUiSchema;
        store.selectedTemplate = 'template-1';
        store.resourceAddressForm = { data: {}, errors: [] };

        expect(store.isResourceAddressReady).toBe(false);
      });

      it('should return false when form has errors', () => {
        const store = useResourceSharingMethodStore();
        
        store.selectedTemplateSchema = mockSchema;
        store.selectedTemplateUiSchema = mockUiSchema;
        store.selectedTemplate = 'template-1';
        store.resourceAddressForm = { data: { url: 'test' }, errors: ['error'] as never[] };

        expect(store.isResourceAddressReady).toBe(false);
      });
    });

    describe('resourceAddress', () => {
      it('should return form data when form is valid', () => {
        const store = useResourceSharingMethodStore();
        const formData = { url: 'test', apiKey: 'secret' };
        
        store.resourceAddressForm = { data: formData, errors: [] };

        expect(store.resourceAddress).toEqual(formData);
      });

      it('should return null when form has errors', () => {
        const store = useResourceSharingMethodStore();
        const formData = { url: 'test', apiKey: 'secret' };
        
        store.resourceAddressForm = { data: formData, errors: ['error'] as never[] };

        expect(store.resourceAddress).toBeNull();
      });
    });
  });

  describe('store interface', () => {
    it('should return all expected properties and methods', () => {
      const store = useResourceSharingMethodStore();

      expect(store).toHaveProperty('sharingMethodId');
      expect(store).toHaveProperty('offeringType');
      expect(store).toHaveProperty('isTemplatesLoading');
      expect(store).toHaveProperty('loadResourceAddressTemplates');
      expect(store).toHaveProperty('initializeResourceSharingMethods');
      expect(store).toHaveProperty('resourceAddressTemplates');
      expect(store).toHaveProperty('resourceAddressTemplatesError');
      expect(store).toHaveProperty('fetchResourceAddressTemplates');
      expect(store).toHaveProperty('selectedTemplate');
      expect(store).toHaveProperty('selectedTemplateSchema');
      expect(store).toHaveProperty('selectedTemplateUiSchema');
      expect(store).toHaveProperty('schemasLoading');
      expect(store).toHaveProperty('resourceAddressForm');
      expect(store).toHaveProperty('isResourceAddressFormValid');
      expect(store).toHaveProperty('setSelectedTemplate');
      expect(store).toHaveProperty('updateFormErrors');
      expect(store).toHaveProperty('resetResourceSharingMethods');
      expect(store).toHaveProperty('resourceAddress');
      expect(store).toHaveProperty('isResourceAddressReady');

      // Check that methods are functions
      expect(typeof store.loadResourceAddressTemplates).toBe('function');
      expect(typeof store.initializeResourceSharingMethods).toBe('function');
      expect(typeof store.fetchResourceAddressTemplates).toBe('function');
      expect(typeof store.setSelectedTemplate).toBe('function');
      expect(typeof store.updateFormErrors).toBe('function');
      expect(typeof store.resetResourceSharingMethods).toBe('function');
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete workflow from initialization to ready state', async () => {
      const store = useResourceSharingMethodStore();

      // Mock resource description store values
      mockResourceDescriptionStore.resourceDescriptionSharingMethodId = 'api-access';
      mockResourceDescriptionStore.resourceDescriptionOfferingType = 'data-offering';

      // Mock API responses
      mockGetResourceAddressTemplates.mockResolvedValue({
        data: { value: mockTemplates },
        error: { value: null },
      });
      mockGetResourceAddressSchema.mockResolvedValue({
        data: { value: mockSchema },
        error: { value: null },
      });
      mockGetResourceAddressUiSchema.mockResolvedValue({
        data: { value: mockUiSchema },
        error: { value: null },
      });

      // Step 1: Initialize
      await store.initializeResourceSharingMethods();
      expect(store.sharingMethodId).toBe('api-access');
      expect(store.offeringType).toBe('data-offering');
      expect(store.resourceAddressTemplates).toEqual(mockTemplates);

      // Step 2: Select template
      await store.setSelectedTemplate('template-1');
      expect(store.selectedTemplate).toBe('template-1');
      expect(store.selectedTemplateSchema).toEqual(mockSchema);
      expect(store.selectedTemplateUiSchema).toEqual(mockUiSchema);

      // Step 3: Fill form data and validate
      store.resourceAddressForm = { 
        data: { url: 'https://api.example.com', apiKey: 'secret' }, 
        errors: [] 
      };
      store.updateFormErrors([] as never[]);

      // Check final state
      expect(store.isResourceAddressFormValid).toBe(true);
      expect(store.isResourceAddressReady).toBe(true);
      expect(store.resourceAddress).toEqual({ 
        url: 'https://api.example.com', 
        apiKey: 'secret' 
      });
    });
  });
});
