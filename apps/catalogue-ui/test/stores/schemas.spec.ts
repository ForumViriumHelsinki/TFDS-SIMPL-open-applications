import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useSchemasStore } from '@/stores/schemas';
import { ref } from 'vue';

// Mock the composable
const mockSchemasRef = ref<any[]>([]);
const mockSchemasMetadataRef = ref<any[]>([]);
const mockSchemasErrorRef = ref<any>(null);
const mockSchemasLoadingRef = ref(false);
const mockFetchSchemas = vi.fn();

vi.mock('@/services/composables/useSchemas', () => ({
  useSchemas: () => ({
    schemas: mockSchemasRef,
    schemasMetadata: mockSchemasMetadataRef,
    schemasError: mockSchemasErrorRef,
    schemasLoading: mockSchemasLoadingRef,
    fetchSchemas: mockFetchSchemas,
  }),
}));

describe('useSchemasStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    // Reset mock values
    mockSchemasRef.value = [];
    mockSchemasMetadataRef.value = [];
    mockSchemasErrorRef.value = null;
    mockSchemasLoadingRef.value = false;
  });

  const mockSchemasOptions = [
    { label: 'Data Offering', value: 'data-offeringShape' },
    { label: 'Application Asset', value: 'application-health' },
  ];

  const mockSchemasMetadataList = [
    {
      id: 'data-offeringShape',
      title: 'Data Offering',
      name: 'Data Offering',
      description: 'Data schema',
      resourceType: 'data',
      version: '1.0.0',
    },
    {
      id: 'application-health',
      title: 'Application Asset',
      name: 'Application Asset',
      description: 'App schema',
      resourceType: 'application',
      version: '1.0.0',
    },
    {
      id: 'infrastructure-schema',
      title: 'Infrastructure',
      name: 'Infrastructure',
      description: 'Infra schema',
      resourceType: 'INFRASTRUCTURE',
      version: '1.0.0',
    },
  ];

  describe('basic properties', () => {
    it('should return schemas from composable', () => {
      mockSchemasRef.value = mockSchemasOptions;
      const store = useSchemasStore();

      expect(store.schemas).toEqual(mockSchemasOptions);
    });

    it('should return schemasMetadata from composable', () => {
      mockSchemasMetadataRef.value = mockSchemasMetadataList;
      const store = useSchemasStore();

      expect(store.schemasMetadata).toEqual(mockSchemasMetadataList);
    });

    it('should return schemasError from composable', () => {
      const mockError = { title: 'Error', description: 'Failed to load' };
      mockSchemasErrorRef.value = mockError;
      const store = useSchemasStore();

      expect(store.schemasError).toEqual(mockError);
    });

    it('should return schemasLoading from composable', () => {
      mockSchemasLoadingRef.value = true;
      const store = useSchemasStore();

      expect(store.schemasLoading).toBe(true);
    });
  });

  describe('computed properties', () => {
    describe('hasSchemas', () => {
      it('should return true when schemas exist', () => {
        mockSchemasRef.value = mockSchemasOptions;
        const store = useSchemasStore();

        expect(store.hasSchemas).toBe(true);
      });

      it('should return false when schemas is empty array', () => {
        mockSchemasRef.value = [];
        const store = useSchemasStore();

        expect(store.hasSchemas).toBe(false);
      });

      it('should return false when schemas is null', () => {
        mockSchemasRef.value = null;
        const store = useSchemasStore();

        expect(store.hasSchemas).toBe(false);
      });

      it('should return false when schemas is undefined', () => {
        mockSchemasRef.value = undefined;
        const store = useSchemasStore();

        expect(store.hasSchemas).toBe(false);
      });
    });

    describe('isLoading', () => {
      it('should return true when schemasLoading is true', () => {
        mockSchemasLoadingRef.value = true;
        const store = useSchemasStore();

        expect(store.isLoading).toBe(true);
      });

      it('should return false when schemasLoading is false', () => {
        mockSchemasLoadingRef.value = false;
        const store = useSchemasStore();

        expect(store.isLoading).toBe(false);
      });
    });
  });

  describe('helper functions', () => {
    describe('getSchemaById', () => {
      it('should return schema when found by id', () => {
        mockSchemasMetadataRef.value = mockSchemasMetadataList;
        const store = useSchemasStore();

        const result = store.getSchemaById('data-offeringShape');

        expect(result).toEqual(mockSchemasMetadataList[0]);
      });

      it('should return undefined when schema not found', () => {
        mockSchemasMetadataRef.value = mockSchemasMetadataList;
        const store = useSchemasStore();

        const result = store.getSchemaById('non-existent-id');

        expect(result).toBeUndefined();
      });

      it('should return undefined when schemaId is undefined', () => {
        mockSchemasMetadataRef.value = mockSchemasMetadataList;
        const store = useSchemasStore();

        const result = store.getSchemaById(undefined);

        expect(result).toBeUndefined();
      });

      it('should return undefined when schemasMetadata is empty', () => {
        mockSchemasMetadataRef.value = [];
        const store = useSchemasStore();

        const result = store.getSchemaById('data-offeringShape');

        expect(result).toBeUndefined();
      });
    });

    describe('getResourceTypeById', () => {
      it('should return resourceType when schema found', () => {
        mockSchemasMetadataRef.value = mockSchemasMetadataList;
        const store = useSchemasStore();

        const result = store.getResourceTypeById('data-offeringShape');

        expect(result).toBe('data');
      });

      it('should return null when schema not found', () => {
        mockSchemasMetadataRef.value = mockSchemasMetadataList;
        const store = useSchemasStore();

        const result = store.getResourceTypeById('non-existent-id');

        expect(result).toBeNull();
      });

      it('should return null when schemaId is undefined', () => {
        mockSchemasMetadataRef.value = mockSchemasMetadataList;
        const store = useSchemasStore();

        const result = store.getResourceTypeById(undefined);

        expect(result).toBeNull();
      });
    });

    describe('getSchemaIdByResourceType', () => {
      it('should return schema id when found by resourceType', () => {
        mockSchemasMetadataRef.value = mockSchemasMetadataList;
        const store = useSchemasStore();

        const result = store.getSchemaIdByResourceType('data');

        expect(result).toBe('data-offeringShape');
      });

      it('should be case-insensitive when matching resourceType', () => {
        mockSchemasMetadataRef.value = mockSchemasMetadataList;
        const store = useSchemasStore();

        expect(store.getSchemaIdByResourceType('DATA')).toBe('data-offeringShape');
        expect(store.getSchemaIdByResourceType('Application')).toBe('application-health');
        expect(store.getSchemaIdByResourceType('infrastructure')).toBe('infrastructure-schema');
      });

      it('should return undefined when resourceType not found', () => {
        mockSchemasMetadataRef.value = mockSchemasMetadataList;
        const store = useSchemasStore();

        const result = store.getSchemaIdByResourceType('non-existent-type');

        expect(result).toBeUndefined();
      });

      it('should return undefined when schemasMetadata is empty', () => {
        mockSchemasMetadataRef.value = [];
        const store = useSchemasStore();

        const result = store.getSchemaIdByResourceType('data');

        expect(result).toBeUndefined();
      });
    });
  });

  describe('fetchSchemas', () => {
    it('should call fetchSchemas from composable', () => {
      const store = useSchemasStore();

      store.fetchSchemas();

      expect(mockFetchSchemas).toHaveBeenCalledOnce();
    });
  });

  describe('store properties', () => {
    it('should have all expected properties', () => {
      const store = useSchemasStore();

      // State properties
      expect(store).toHaveProperty('schemas');
      expect(store).toHaveProperty('schemasMetadata');
      expect(store).toHaveProperty('schemasError');
      expect(store).toHaveProperty('schemasLoading');

      // Computed properties
      expect(store).toHaveProperty('hasSchemas');
      expect(store).toHaveProperty('isLoading');

      // Helper functions
      expect(typeof store.fetchSchemas).toBe('function');
      expect(typeof store.getSchemaById).toBe('function');
      expect(typeof store.getResourceTypeById).toBe('function');
      expect(typeof store.getSchemaIdByResourceType).toBe('function');
    });
  });
});
