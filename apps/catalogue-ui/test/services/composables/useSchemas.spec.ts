import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSchemas } from '@/services/composables/useSchemas';
import { filterSchemas } from '@/util/schemas';
import type { SchemasResponse } from '@/types/schemas';

vi.mock('@/util/services', () => ({
  fetchLocalEndpoint: vi.fn(),
}));

vi.mock('@/util/schemas', () => ({
  filterSchemas: vi.fn(),
}));

describe('useSchemas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have empty schemas array initially', () => {
      const { schemas } = useSchemas();

      expect(schemas.value).toEqual([]);
    });

    it('should have empty schemasMetadata array initially', () => {
      const { schemasMetadata } = useSchemas();

      expect(schemasMetadata.value).toEqual([]);
    });

    it('should have null error initially', () => {
      const { schemasError } = useSchemas();

      expect(schemasError.value).toBeNull();
    });

    it('should not be loading initially', () => {
      const { schemasLoading } = useSchemas();

      expect(schemasLoading.value).toBe(false);
    });
  });

  describe('fetchSchemas', () => {
    it('should set loading state during fetch', async () => {
      const { fetchLocalEndpoint } = await import('@/util/services');
      vi.mocked(fetchLocalEndpoint).mockReturnValue(
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              data: { value: { schemas: [] } },
              error: { value: null },
            });
          }, 100);
        }) as any
      );

      const { schemasLoading, fetchSchemas } = useSchemas();

      const promise = fetchSchemas();
      expect(schemasLoading.value).toBe(true);

      await promise;
      expect(schemasLoading.value).toBe(false);
    });

    it('should populate schemas and schemasMetadata on successful fetch', async () => {
      const mockSchemasResponse: SchemasResponse = {
        schemas: [
          {
            id: 'data-offeringShape',
            title: 'Data Offering',
            name: 'Data Offering',
            description: 'Data schema',
            resourceType: 'data',
            version: '1.0.0',
          },
        ],
      };

      const mockFilteredSchemas = [{ label: 'Data Offering', value: 'data-offeringShape' }];

      const { fetchLocalEndpoint } = await import('@/util/services');
      vi.mocked(fetchLocalEndpoint).mockResolvedValue({
        data: { value: mockSchemasResponse },
        error: { value: null },
      } as any);

      vi.mocked(filterSchemas).mockReturnValue(mockFilteredSchemas);

      const { schemas, schemasMetadata, fetchSchemas } = useSchemas();

      await fetchSchemas();

      expect(schemasMetadata.value).toEqual(mockSchemasResponse.schemas);
      expect(schemas.value).toEqual(mockFilteredSchemas);
      expect(filterSchemas).toHaveBeenCalledWith(mockSchemasResponse);
    });

    it('should set error on failed fetch', async () => {
      const mockError = { title: 'Error', description: 'Failed to load schemas' };

      const { fetchLocalEndpoint } = await import('@/util/services');
      vi.mocked(fetchLocalEndpoint).mockResolvedValue({
        data: { value: null },
        error: { value: mockError },
      } as any);

      const { schemasError, fetchSchemas } = useSchemas();

      await fetchSchemas();

      expect(schemasError.value).toEqual(mockError);
    });

    it('should call fetchLocalEndpoint with correct parameters', async () => {
      const { fetchLocalEndpoint } = await import('@/util/services');
      vi.mocked(fetchLocalEndpoint).mockResolvedValue({
        data: { value: { schemas: [] } },
        error: { value: null },
      } as any);

      const { fetchSchemas } = useSchemas();

      await fetchSchemas();

      expect(fetchLocalEndpoint).toHaveBeenCalledWith('/api/schemas', {
        method: 'GET',
        errorIdentifier: 'SCHEMA_FETCH_ERROR',
        apiName: 'SD Tooling',
        defaultData: { schemas: [] },
      });
    });

    it('should handle empty schemas response', async () => {
      const mockSchemasResponse: SchemasResponse = {
        schemas: [],
      };

      const { fetchLocalEndpoint } = await import('@/util/services');
      vi.mocked(fetchLocalEndpoint).mockResolvedValue({
        data: { value: mockSchemasResponse },
        error: { value: null },
      } as any);

      vi.mocked(filterSchemas).mockReturnValue([]);

      const { schemas, schemasMetadata, fetchSchemas } = useSchemas();

      await fetchSchemas();

      expect(schemasMetadata.value).toEqual([]);
      expect(schemas.value).toEqual([]);
    });

    it('should reset loading state even if fetch fails', async () => {
      const { fetchLocalEndpoint } = await import('@/util/services');
      vi.mocked(fetchLocalEndpoint).mockResolvedValue({
        data: { value: null },
        error: { value: { title: 'Error', description: 'Failed' } },
      } as any);

      const { schemasLoading, fetchSchemas } = useSchemas();

      await fetchSchemas();

      expect(schemasLoading.value).toBe(false);
    });
  });

  describe('return value', () => {
    it('should return all expected properties', () => {
      const result = useSchemas();

      expect(result).toHaveProperty('schemas');
      expect(result).toHaveProperty('schemasMetadata');
      expect(result).toHaveProperty('schemasError');
      expect(result).toHaveProperty('schemasLoading');
      expect(result).toHaveProperty('fetchSchemas');
      expect(typeof result.fetchSchemas).toBe('function');
    });
  });
});
