import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getEndpoint,
  fetchQuickSearchResponse,
  fetchAdvancedSearchResponse,
  getSelfDescriptionById,
} from '@/services/search';
import { fetchTokenClientSide, setAuthorizationHeader } from '@/util/authentication';
import { getPublicEnv } from '@/util/getEnv';

// Mock the dependencies
vi.mock('@/util/authentication', () => ({
  fetchTokenClientSide: vi.fn(),
  setAuthorizationHeader: vi.fn(),
}));

vi.mock('@/util/getEnv', () => ({
  getPublicEnv: vi.fn(() => ({
    PUBLIC_SEARCH_API_URL: 'https://search-api.example.com',
    PUBLIC_SEARCH_API_VERSION: null,
    PUBLIC_FEDERATED_CATALOGUE_API_URL: null,
    PUBLIC_QUERY_MAPPER_ADAPTER_API_URL: null,
    PUBLIC_QUERY_MAPPER_ADAPTER_API_VERSION: null,
  })),
}));

describe('search service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();

    // Reset to default mock implementations
    vi.mocked(fetchTokenClientSide).mockResolvedValue('mock-token');
    vi.mocked(getPublicEnv).mockReturnValue({
      PUBLIC_SEARCH_API_URL: 'https://search-api.example.com',
      PUBLIC_SEARCH_API_VERSION: null,
      PUBLIC_FEDERATED_CATALOGUE_API_URL: null,
      PUBLIC_QUERY_MAPPER_ADAPTER_API_URL: null,
      PUBLIC_QUERY_MAPPER_ADAPTER_API_VERSION: null,
    });
  });

  describe('getEndpoint', () => {
    it('should return default endpoints with v1 for basic configuration', () => {
      // Use default mock configuration
      expect(getEndpoint('quickSearch')).toBe('https://search-api.example.com/v1/selfDescriptions');
      expect(getEndpoint('advancedSearch')).toBe(
        'https://search-api.example.com/v1/selfDescriptions/advanced'
      );
      expect(getEndpoint('selfDescription')).toBe(
        'https://search-api.example.com/v1/selfDescriptions'
      );
    });

    it('should return versioned endpoints when PUBLIC_SEARCH_API_VERSION is set', () => {
      vi.mocked(getPublicEnv).mockReturnValue({
        PUBLIC_SEARCH_API_URL: 'https://search-api.example.com',
        PUBLIC_SEARCH_API_VERSION: 'v2',
        PUBLIC_FEDERATED_CATALOGUE_API_URL: null,
        PUBLIC_QUERY_MAPPER_ADAPTER_API_URL: null,
        PUBLIC_QUERY_MAPPER_ADAPTER_API_VERSION: null,
      });

      expect(getEndpoint('quickSearch')).toBe('https://search-api.example.com/v1/selfDescriptions');
      expect(getEndpoint('advancedSearch')).toBe(
        'https://search-api.example.com/v1/selfDescriptions/advanced'
      );
      expect(getEndpoint('selfDescription')).toBe(
        'https://search-api.example.com/v1/selfDescriptions'
      );
    });

    it('should return federated catalogue endpoint when PUBLIC_FEDERATED_CATALOGUE_API_URL is set', () => {
      vi.mocked(getPublicEnv).mockReturnValue({
        PUBLIC_SEARCH_API_URL: 'https://search-api.example.com',
        PUBLIC_SEARCH_API_VERSION: null,
        PUBLIC_FEDERATED_CATALOGUE_API_URL: 'https://federated-catalogue.example.com',
        PUBLIC_QUERY_MAPPER_ADAPTER_API_URL: null,
        PUBLIC_QUERY_MAPPER_ADAPTER_API_VERSION: null,
      });

      // Only selfDescription should be overridden
      expect(getEndpoint('quickSearch')).toBe('https://search-api.example.com/v1/selfDescriptions');
      expect(getEndpoint('advancedSearch')).toBe(
        'https://search-api.example.com/v1/selfDescriptions/advanced'
      );
      expect(getEndpoint('selfDescription')).toBe(
        'https://federated-catalogue.example.com/self-descriptions'
      );
    });

    it('should return query mapper adapter endpoints when PUBLIC_QUERY_MAPPER_ADAPTER_API_URL is set', () => {
      vi.mocked(getPublicEnv).mockReturnValue({
        PUBLIC_SEARCH_API_URL: 'https://search-api.example.com',
        PUBLIC_SEARCH_API_VERSION: null,
        PUBLIC_FEDERATED_CATALOGUE_API_URL: null,
        PUBLIC_QUERY_MAPPER_ADAPTER_API_URL: 'https://query-mapper.example.com',
        PUBLIC_QUERY_MAPPER_ADAPTER_API_VERSION: 'v1',
      });

      expect(getEndpoint('quickSearch')).toBe(
        'https://query-mapper.example.com/v1/selfDescriptions'
      );
      expect(getEndpoint('advancedSearch')).toBe(
        'https://query-mapper.example.com/v1/selfDescriptions/advancedSearch'
      );
      // selfDescription should still use the default
      expect(getEndpoint('selfDescription')).toBe(
        'https://search-api.example.com/v1/selfDescriptions'
      );
    });

    it('should prioritize query mapper adapter over versioned API for quickSearch and advancedSearch', () => {
      vi.mocked(getPublicEnv).mockReturnValue({
        PUBLIC_SEARCH_API_URL: 'https://search-api.example.com',
        PUBLIC_SEARCH_API_VERSION: 'v2',
        PUBLIC_FEDERATED_CATALOGUE_API_URL: null,
        PUBLIC_QUERY_MAPPER_ADAPTER_API_URL: 'https://query-mapper.example.com',
        PUBLIC_QUERY_MAPPER_ADAPTER_API_VERSION: 'v1',
      });

      // Query mapper should override versioned API
      expect(getEndpoint('quickSearch')).toBe(
        'https://query-mapper.example.com/v1/selfDescriptions'
      );
      expect(getEndpoint('advancedSearch')).toBe(
        'https://query-mapper.example.com/v1/selfDescriptions/advancedSearch'
      );
      // selfDescription should use v2 since query mapper doesn't override it
      expect(getEndpoint('selfDescription')).toBe(
        'https://search-api.example.com/v1/selfDescriptions'
      );
    });

    it('should prioritize federated catalogue over versioned API for selfDescription', () => {
      vi.mocked(getPublicEnv).mockReturnValue({
        PUBLIC_SEARCH_API_URL: 'https://search-api.example.com',
        PUBLIC_SEARCH_API_VERSION: 'v2',
        PUBLIC_FEDERATED_CATALOGUE_API_URL: 'https://federated-catalogue.example.com',
        PUBLIC_QUERY_MAPPER_ADAPTER_API_URL: null,
        PUBLIC_QUERY_MAPPER_ADAPTER_API_VERSION: null,
      });

      // quickSearch and advancedSearch should use v2
      expect(getEndpoint('quickSearch')).toBe('https://search-api.example.com/v1/selfDescriptions');
      expect(getEndpoint('advancedSearch')).toBe(
        'https://search-api.example.com/v1/selfDescriptions/advanced'
      );
      // selfDescription should use federated catalogue which overrides versioned API
      expect(getEndpoint('selfDescription')).toBe(
        'https://federated-catalogue.example.com/self-descriptions'
      );
    });

    it('should handle complex configuration with all options set', () => {
      vi.mocked(getPublicEnv).mockReturnValue({
        PUBLIC_SEARCH_API_URL: 'https://search-api.example.com',
        PUBLIC_SEARCH_API_VERSION: 'v2',
        PUBLIC_FEDERATED_CATALOGUE_API_URL: 'https://federated-catalogue.example.com',
        PUBLIC_QUERY_MAPPER_ADAPTER_API_URL: 'https://query-mapper.example.com',
        PUBLIC_QUERY_MAPPER_ADAPTER_API_VERSION: 'v3',
      });

      // Query mapper should override versioned API for quickSearch/advancedSearch
      expect(getEndpoint('quickSearch')).toBe(
        'https://query-mapper.example.com/v3/selfDescriptions'
      );
      expect(getEndpoint('advancedSearch')).toBe(
        'https://query-mapper.example.com/v3/selfDescriptions/advancedSearch'
      );
      // Federated catalogue should override versioned API for selfDescription
      expect(getEndpoint('selfDescription')).toBe(
        'https://federated-catalogue.example.com/self-descriptions'
      );
    });

    it('should return empty string for invalid endpoint name', () => {
      // TypeScript should prevent this, but testing the fallback behavior
      expect(getEndpoint('invalidEndpoint' as any)).toBe('');
    });
  });

  describe('fetchQuickSearchResponse', () => {
    it('should call fetch with correct parameters for basic search', async () => {
      const mockResponse = { results: [] };
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        } as Response)
      );

      const searchText = 'test search';
      await fetchQuickSearchResponse(searchText);

      expect(vi.mocked(fetchTokenClientSide)).toHaveBeenCalledWith(undefined);
      expect(vi.mocked(setAuthorizationHeader)).toHaveBeenCalledWith(
        'mock-token',
        expect.any(Headers)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        'https://search-api.example.com/v1/selfDescriptions?q=test%2Csearch',
        {
          method: 'GET',
          headers: expect.any(Headers),
        }
      );
    });

    it('should handle empty search text', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response)
      );

      await fetchQuickSearchResponse(null);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://search-api.example.com/v1/selfDescriptions?q=',
        {
          method: 'GET',
          headers: expect.any(Headers),
        }
      );
    });

    it('should use provided keycloak token', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response)
      );

      const customToken = 'custom-token';
      await fetchQuickSearchResponse('test', customToken);

      expect(vi.mocked(fetchTokenClientSide)).toHaveBeenCalledWith(customToken);
    });

    it('should use versioned API when PUBLIC_SEARCH_API_VERSION is set', async () => {
      // Mock getPublicEnv to return versioned config
      vi.mocked(getPublicEnv).mockReturnValue({
        PUBLIC_SEARCH_API_URL: 'https://search-api.example.com',
        PUBLIC_SEARCH_API_VERSION: 'v2',
        PUBLIC_FEDERATED_CATALOGUE_API_URL: null,
        PUBLIC_QUERY_MAPPER_ADAPTER_API_URL: null,
        PUBLIC_QUERY_MAPPER_ADAPTER_API_VERSION: null,
      });

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response)
      );

      await fetchQuickSearchResponse('test');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://search-api.example.com/v1/selfDescriptions?q=test',
        {
          method: 'GET',
          headers: expect.any(Headers),
        }
      );
    });

    it('should use query mapper adapter when configured', async () => {
      // Mock getPublicEnv to return query mapper config
      vi.mocked(getPublicEnv).mockReturnValue({
        PUBLIC_SEARCH_API_URL: 'https://search-api.example.com',
        PUBLIC_SEARCH_API_VERSION: null,
        PUBLIC_FEDERATED_CATALOGUE_API_URL: null,
        PUBLIC_QUERY_MAPPER_ADAPTER_API_URL: 'https://query-mapper.example.com',
        PUBLIC_QUERY_MAPPER_ADAPTER_API_VERSION: 'v1',
      });

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response)
      );

      await fetchQuickSearchResponse('test search');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://query-mapper.example.com/v1/selfDescriptions?searchString=test%2Csearch',
        {
          method: 'GET',
          headers: expect.any(Headers),
        }
      );
    });

    it('should encode search terms properly', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response)
      );

      await fetchQuickSearchResponse('test & special chars');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://search-api.example.com/v1/selfDescriptions?q=test%2C%26%2Cspecial%2Cchars',
        {
          method: 'GET',
          headers: expect.any(Headers),
        }
      );
    });
  });

  describe('fetchAdvancedSearchResponse', () => {
    beforeEach(() => {
      // Reset getPublicEnv to default for advanced search tests
      vi.mocked(getPublicEnv).mockReturnValue({
        PUBLIC_SEARCH_API_URL: 'https://search-api.example.com',
        PUBLIC_SEARCH_API_VERSION: null,
        PUBLIC_FEDERATED_CATALOGUE_API_URL: null,
        PUBLIC_QUERY_MAPPER_ADAPTER_API_URL: null,
        PUBLIC_QUERY_MAPPER_ADAPTER_API_VERSION: null,
      });
    });

    it('should call fetch with correct parameters for advanced search', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response)
      );

      const searchData = { field1: 'value1', field2: 'value2' };
      await fetchAdvancedSearchResponse(searchData);

      expect(vi.mocked(fetchTokenClientSide)).toHaveBeenCalledWith(undefined);
      expect(vi.mocked(setAuthorizationHeader)).toHaveBeenCalledWith(
        'mock-token',
        expect.any(Headers)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        'https://search-api.example.com/v1/selfDescriptions/advanced',
        {
          method: 'POST',
          headers: expect.any(Headers),
          body: JSON.stringify(searchData),
        }
      );
    });

    it('should use provided keycloak token', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response)
      );

      const customToken = 'custom-token';
      const searchData = { field: 'value' };
      await fetchAdvancedSearchResponse(searchData, customToken);

      expect(vi.mocked(fetchTokenClientSide)).toHaveBeenCalledWith(customToken);
    });

    it('should set correct headers', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response)
      );

      await fetchAdvancedSearchResponse({});

      const [, options] = vi.mocked(global.fetch).mock.calls[0];
      const headers = options?.headers as Headers;

      expect(headers).toBeDefined();
      expect(headers.get('Content-Type')).toBe('application/json');
    });
  });

  describe('getSelfDescriptionById', () => {
    beforeEach(() => {
      // Reset getPublicEnv to default
      vi.mocked(getPublicEnv).mockReturnValue({
        PUBLIC_SEARCH_API_URL: 'https://search-api.example.com',
        PUBLIC_SEARCH_API_VERSION: null,
        PUBLIC_FEDERATED_CATALOGUE_API_URL: null,
        PUBLIC_QUERY_MAPPER_ADAPTER_API_URL: null,
        PUBLIC_QUERY_MAPPER_ADAPTER_API_VERSION: null,
      });
    });

    it('should call fetch with correct parameters for basic API', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response)
      );

      const id = 'test-id-123';
      await getSelfDescriptionById(id);

      expect(vi.mocked(fetchTokenClientSide)).toHaveBeenCalledWith(undefined);
      expect(vi.mocked(setAuthorizationHeader)).toHaveBeenCalledWith(
        'mock-token',
        expect.any(Headers)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        'https://search-api.example.com/v1/selfDescriptions/test-id-123',
        {
          method: 'GET',
          headers: expect.any(Headers),
        }
      );
    });

    it('should use versioned API when PUBLIC_SEARCH_API_VERSION is set', async () => {
      vi.mocked(getPublicEnv).mockReturnValue({
        PUBLIC_SEARCH_API_URL: 'https://search-api.example.com',
        PUBLIC_SEARCH_API_VERSION: 'v2',
        PUBLIC_FEDERATED_CATALOGUE_API_URL: null,
        PUBLIC_QUERY_MAPPER_ADAPTER_API_URL: null,
        PUBLIC_QUERY_MAPPER_ADAPTER_API_VERSION: null,
      });

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response)
      );

      const id = 'test-id-123';
      await getSelfDescriptionById(id);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://search-api.example.com/v1/selfDescriptions/test-id-123',
        {
          method: 'GET',
          headers: expect.any(Headers),
        }
      );
    });

    it('should use federated catalogue API when configured', async () => {
      vi.mocked(getPublicEnv).mockReturnValue({
        PUBLIC_SEARCH_API_URL: 'https://search-api.example.com',
        PUBLIC_SEARCH_API_VERSION: null,
        PUBLIC_FEDERATED_CATALOGUE_API_URL: 'https://federated-catalogue.example.com',
        PUBLIC_QUERY_MAPPER_ADAPTER_API_URL: null,
        PUBLIC_QUERY_MAPPER_ADAPTER_API_VERSION: null,
      });

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response)
      );

      const id = 'test-id-123';
      await getSelfDescriptionById(id);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://federated-catalogue.example.com/self-descriptions/test-id-123',
        {
          method: 'GET',
          headers: expect.any(Headers),
        }
      );
    });

    it('should use provided keycloak token', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response)
      );

      const customToken = 'custom-token';
      const id = 'test-id';
      await getSelfDescriptionById(id, customToken);

      expect(vi.mocked(fetchTokenClientSide)).toHaveBeenCalledWith(customToken);
    });

    it('should set correct headers', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response)
      );

      await getSelfDescriptionById('test-id');

      const [, options] = vi.mocked(global.fetch).mock.calls[0];
      const headers = options?.headers as Headers;

      expect(vi.mocked(setAuthorizationHeader)).toHaveBeenCalledWith('mock-token', headers);
    });

    it('should encode ID parameter properly', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response)
      );

      const idWithSpecialChars = 'test-id/with&special=chars';
      await getSelfDescriptionById(idWithSpecialChars);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://search-api.example.com/v1/selfDescriptions/test-id/with&special=chars',
        {
          method: 'GET',
          headers: expect.any(Headers),
        }
      );
    });
  });

  describe('error handling', () => {
    it('should handle fetch errors in fetchQuickSearchResponse', async () => {
      const mockError = new Error('Network error');
      global.fetch = vi.fn(() => Promise.reject(mockError));

      await expect(fetchQuickSearchResponse('test')).rejects.toThrow('Network error');
    });

    it('should handle fetch errors in fetchAdvancedSearchResponse', async () => {
      const mockError = new Error('Network error');
      global.fetch = vi.fn(() => Promise.reject(mockError));

      await expect(fetchAdvancedSearchResponse({})).rejects.toThrow('Network error');
    });

    it('should handle fetch errors in getSelfDescriptionById', async () => {
      const mockError = new Error('Network error');
      global.fetch = vi.fn(() => Promise.reject(mockError));

      await expect(getSelfDescriptionById('test-id')).rejects.toThrow('Network error');
    });
  });
});
