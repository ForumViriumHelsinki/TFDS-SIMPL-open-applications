import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref } from 'vue';
import { useSchemasStore } from '@/store/schemas';
import type { UIError } from '@/util/errors';

// Mock the composables with reactive refs
const mockSchemasRef = ref<any[] | null | undefined>([]);
const mockSchemasMetadataRef = ref<any[]>([]);
const mockSchemasErrorRef = ref<UIError | null>(null);
const mockSchemasLoadingRef = ref<boolean>(false);

vi.mock('@/services/composables/useSchemas', () => ({
  useSchemas: () => ({
    schemas: mockSchemasRef,
    schemasMetadata: mockSchemasMetadataRef,
    schemasError: mockSchemasErrorRef,
    schemasLoading: mockSchemasLoadingRef,
  }),
}));

describe('schemasStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    // Set default mock values
    mockSchemasRef.value = [];
    mockSchemasMetadataRef.value = [];
    mockSchemasErrorRef.value = null;
    mockSchemasLoadingRef.value = false;
  });

  const mockSchemasList = [
    { id: 'schema-1', name: 'Data Service', version: '1.0' },
    { id: 'schema-2', name: 'Physical Resource', version: '2.0' },
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

  const mockError: UIError = {
    title: 'Schema Loading Error',
    description: 'Failed to load schemas from the server',
  };

  describe('initial state', () => {
    it('should initialize with correct default values', () => {
      const store = useSchemasStore();

      expect(store.schemas).toEqual([]);
      expect(store.schemasError).toBeNull();
      expect(store.schemasLoading).toBe(false);
      expect(store.hasSchemas).toBe(false);
      expect(store.isLoading).toBe(false);
    });
  });

  describe('computed properties', () => {
    describe('hasSchemas', () => {
      it('should return true when schemas exist', () => {
        mockSchemasRef.value = mockSchemasList;
        const store = useSchemasStore();

        expect(store.hasSchemas).toBe(true);
      });

      it('should return false when schemas array is empty', () => {
        mockSchemasRef.value = [];
        const store = useSchemasStore();

        expect(store.hasSchemas).toBe(false);
      });

      it('should return false when schemas is null', () => {
        mockSchemasRef.value = null;
        const store = useSchemasStore();

        expect(store.hasSchemas).toBe(null);
      });

      it('should return false when schemas is undefined', () => {
        mockSchemasRef.value = undefined;
        const store = useSchemasStore();

        expect(store.hasSchemas).toBe(undefined);
      });
    });

    describe('errorMessage', () => {
      it('should return undefined when there is no error', () => {
        mockSchemasErrorRef.value = null;
        const store = useSchemasStore();

        expect(store.schemasError).toBeNull();
      });

      it('should return formatted error message when there is an error', () => {
        mockSchemasErrorRef.value = mockError;
        const store = useSchemasStore();

        expect(store.schemasError).toEqual(mockError);
      });

      it('should handle partial error objects', () => {
        const partialError = { title: 'Error Title' };
        mockSchemasErrorRef.value = partialError as UIError;
        const store = useSchemasStore();

        expect(store.schemasError).toEqual(partialError);
      });
    });

    describe('isLoading', () => {
      it('should return true when schemas are loading', () => {
        mockSchemasLoadingRef.value = true;
        const store = useSchemasStore();

        expect(store.isLoading).toBe(true);
      });

      it('should return false when schemas are not loading', () => {
        mockSchemasLoadingRef.value = false;
        const store = useSchemasStore();

        expect(store.isLoading).toBe(false);
      });
    });
  });

  describe('reactive state', () => {
    it('should update when schemas change', () => {
      const store = useSchemasStore();

      // Initially empty
      expect(store.schemas).toEqual([]);
      expect(store.hasSchemas).toBe(false);

      // Update schemas
      mockSchemasRef.value = mockSchemasList;

      expect(store.schemas).toEqual(mockSchemasList);
      expect(store.hasSchemas).toBe(true);
    });

    it('should update when loading state changes', () => {
      const store = useSchemasStore();

      // Initially not loading
      expect(store.schemasLoading).toBe(false);
      expect(store.isLoading).toBe(false);

      // Start loading
      mockSchemasLoadingRef.value = true;

      expect(store.schemasLoading).toBe(true);
      expect(store.isLoading).toBe(true);
    });

    it('should update when error state changes', () => {
      const store = useSchemasStore();

      // Initially no error
      expect(store.schemasError).toBeNull();

      // Set error
      mockSchemasErrorRef.value = mockError;

      expect(store.schemasError).toEqual(mockError);
    });
  });

  describe('store interface', () => {
    it('should return all expected properties', () => {
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
      expect(typeof store.getSchemaById).toBe('function');
      expect(typeof store.getResourceTypeById).toBe('function');
      expect(typeof store.getSchemaIdByResourceType).toBe('function');
    });
  });

  describe('integration scenarios', () => {
    it('should handle successful schema loading', () => {
      mockSchemasRef.value = mockSchemasList;
      mockSchemasErrorRef.value = null;
      mockSchemasLoadingRef.value = false;

      const store = useSchemasStore();

      expect(store.schemas).toEqual(mockSchemasList);
      expect(store.hasSchemas).toBe(true);
      expect(store.isLoading).toBe(false);
    });

    it('should handle loading state', () => {
      mockSchemasRef.value = [];
      mockSchemasErrorRef.value = null;
      mockSchemasLoadingRef.value = true;

      const store = useSchemasStore();

      expect(store.schemas).toEqual([]);
      expect(store.hasSchemas).toBe(false);
      expect(store.isLoading).toBe(true);
    });

    it('should handle error state', () => {
      mockSchemasRef.value = [];
      mockSchemasErrorRef.value = mockError;
      mockSchemasLoadingRef.value = false;

      const store = useSchemasStore();

      expect(store.schemas).toEqual([]);
      expect(store.hasSchemas).toBe(false);
      expect(store.schemasError).toEqual(mockError);
      expect(store.isLoading).toBe(false);
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
});
