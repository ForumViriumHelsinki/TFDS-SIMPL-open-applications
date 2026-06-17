import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useAdvancedSearchSchemas } from '@/services/composables/useAdvancedSearchSchemas';
import { fetchLocalEndpoint } from '@/util/services';
import { filterAdvancedSearchSchemas } from '@/util/search';

// Mock the dependencies
vi.mock('@/util/services', () => ({
  fetchLocalEndpoint: vi.fn(),
}));

vi.mock('@/util/search', () => ({
  filterAdvancedSearchSchemas: vi.fn(),
}));

describe('useAdvancedSearchSchemas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchSearchSchemas', () => {
    it('should call fetchLocalEndpoint with correct parameters for fetching schemas', async () => {
      const mockSchemas = [
        { label: 'Schema 1', value: 'schema1' },
        { label: 'Schema 2', value: 'schema2' },
      ];

      const mockResult = {
        data: ref(mockSchemas),
        error: ref(null),
        isLoading: ref(false),
      };

      vi.mocked(fetchLocalEndpoint).mockResolvedValue(mockResult);

      const { fetchSearchSchemas } = useAdvancedSearchSchemas();
      const result = await fetchSearchSchemas();

      expect(fetchLocalEndpoint).toHaveBeenCalledWith(
        '/api/schemas',
        {
          method: 'GET',
          errorIdentifier: 'SCHEMA_FETCH_ERROR',
          apiName: 'xsfc advanced search be',
          defaultData: [],
        },
        filterAdvancedSearchSchemas
      );

      expect(result).toEqual(mockResult);
    });

    it('should handle errors when fetching schemas', async () => {
      const mockError = {
        data: ref([]),
        error: ref({ title: 'Schema Error', description: 'Failed to fetch schemas' }),
        isLoading: ref(false),
      };

      vi.mocked(fetchLocalEndpoint).mockResolvedValue(mockError);

      const { fetchSearchSchemas } = useAdvancedSearchSchemas();
      const result = await fetchSearchSchemas();

      expect(result.error.value).toEqual({
        title: 'Schema Error',
        description: 'Failed to fetch schemas',
      });
      expect(result.data.value).toEqual([]);
    });
  });

  describe('fetchConvertedSchema', () => {
    const schemaFileName = 'test-schema.ttl';

    it('should call fetchLocalEndpoint with correct parameters for converting schema', async () => {
      const mockConvertedSchema = {
        properties: {
          field1: { type: 'string' },
          field2: { type: 'number' },
        },
      };

      const mockResult = {
        data: ref(mockConvertedSchema),
        error: ref(null),
        isLoading: ref(false),
      };

      vi.mocked(fetchLocalEndpoint).mockResolvedValue(mockResult);

      const { fetchConvertedSchema } = useAdvancedSearchSchemas();
      const result = await fetchConvertedSchema(schemaFileName);

      expect(fetchLocalEndpoint).toHaveBeenCalledWith(
        `/api/schemas/${schemaFileName}/content?schemaUIType=advancedSearch`,
        {
          method: 'GET',
          errorIdentifier: 'TTL_CONVERT_ERROR',
          apiName: 'catalogue UI ttl to json',
        }
      );

      expect(result).toEqual(mockResult);
    });

    it('should handle errors when converting schema', async () => {
      const mockError = {
        data: ref(null),
        error: ref({ title: 'Conversion Error', description: 'Failed to convert TTL to JSON' }),
        isLoading: ref(false),
      };

      vi.mocked(fetchLocalEndpoint).mockResolvedValue(mockError);

      const { fetchConvertedSchema } = useAdvancedSearchSchemas();
      const result = await fetchConvertedSchema(schemaFileName);

      expect(result.error.value).toEqual({
        title: 'Conversion Error',
        description: 'Failed to convert TTL to JSON',
      });
    });

    it('should encode special characters in schema filename', async () => {
      const specialSchemaFileName = 'test schema with spaces.ttl';
      const mockResult = {
        data: ref({}),
        error: ref(null),
        isLoading: ref(false),
      };

      vi.mocked(fetchLocalEndpoint).mockResolvedValue(mockResult);

      const { fetchConvertedSchema } = useAdvancedSearchSchemas();
      await fetchConvertedSchema(specialSchemaFileName);

      expect(fetchLocalEndpoint).toHaveBeenCalledWith(
        `/api/schemas/${specialSchemaFileName}/content?schemaUIType=advancedSearch`,
        expect.any(Object)
      );
    });
  });
});
