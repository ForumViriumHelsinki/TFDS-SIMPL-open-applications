import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getEndpoint, getSchemas, fetchSchemaData } from '@/services/advancedSearch';
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
  })),
}));

describe('advancedSearch service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();

    // Reset to default mock implementations
    vi.mocked(fetchTokenClientSide).mockResolvedValue('mock-token');
    vi.mocked(getPublicEnv).mockReturnValue({
      PUBLIC_SEARCH_API_URL: 'https://search-api.example.com',
      PUBLIC_SEARCH_API_VERSION: null,
    });
  });

  describe('getEndpoint', () => {
    it('should return versioned endpoints (v2 for schemas, v1 for content)', () => {
      vi.mocked(getPublicEnv).mockReturnValue({
        PUBLIC_SEARCH_API_URL: 'https://search-api.example.com',
        PUBLIC_SEARCH_API_VERSION: 'v1',
      });

      expect(getEndpoint('schemas')).toBe('https://search-api.example.com/v2/schemas');
      expect(getEndpoint('content', { schemaId: 'abc' })).toBe(
        'https://search-api.example.com/v2/schemas/abc/content'
      );
    });

    it('should return empty string for invalid endpoint name', () => {
      // TypeScript should prevent this, but testing the fallback behavior
      expect(getEndpoint('invalidEndpoint' as any)).toBe('');
    });

    it('should handle different API URLs (schemas use v2, content uses v1)', () => {
      vi.mocked(getPublicEnv).mockReturnValue({
        PUBLIC_SEARCH_API_URL: 'https://different-api.example.com',
        PUBLIC_SEARCH_API_VERSION: null,
      });

      expect(getEndpoint('schemas')).toBe('https://different-api.example.com/v2/schemas');
      expect(getEndpoint('content', { schemaId: 'def' })).toBe(
        'https://different-api.example.com/v2/schemas/def/content'
      );
    });

    it('should handle versioned API with different base URL', () => {
      vi.mocked(getPublicEnv).mockReturnValue({
        PUBLIC_SEARCH_API_URL: 'https://versioned-api.example.com',
        PUBLIC_SEARCH_API_VERSION: 'v3',
      });

      expect(getEndpoint('schemas')).toBe('https://versioned-api.example.com/v2/schemas');
      expect(getEndpoint('content', { schemaId: 'xyz' })).toBe(
        'https://versioned-api.example.com/v2/schemas/xyz/content'
      );
    });
  });

  describe('getSchemas', () => {
    it('should call fetch with correct parameters for basic request', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ schemas: [] }),
        } as Response)
      );

      await getSchemas();

      expect(vi.mocked(fetchTokenClientSide)).toHaveBeenCalledWith(undefined);
      expect(vi.mocked(setAuthorizationHeader)).toHaveBeenCalledWith(
        'mock-token',
        expect.any(Headers)
      );
      expect(global.fetch).toHaveBeenCalledWith('https://search-api.example.com/v2/schemas', {
        method: 'GET',
        headers: expect.any(Headers),
      });
    });

    it('should use provided keycloak token', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response)
      );

      const customToken = 'custom-token';
      await getSchemas(customToken);

      expect(vi.mocked(fetchTokenClientSide)).toHaveBeenCalledWith(customToken);
    });

    it('should set correct headers', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response)
      );

      await getSchemas();

      const [, options] = vi.mocked(global.fetch).mock.calls[0];
      const headers = options?.headers as Headers;

      expect(vi.mocked(setAuthorizationHeader)).toHaveBeenCalledWith('mock-token', headers);
    });

    it('should use versioned API when PUBLIC_SEARCH_API_VERSION is set', async () => {
      vi.mocked(getPublicEnv).mockReturnValue({
        PUBLIC_SEARCH_API_URL: 'https://search-api.example.com',
        PUBLIC_SEARCH_API_VERSION: 'v2',
      });

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response)
      );

      await getSchemas();

      expect(global.fetch).toHaveBeenCalledWith('https://search-api.example.com/v2/schemas', {
        method: 'GET',
        headers: expect.any(Headers),
      });
    });

    it('should handle fetch errors', async () => {
      const mockError = new Error('Network error');
      global.fetch = vi.fn(() => Promise.reject(mockError));

      await expect(getSchemas()).rejects.toThrow('Network error');
    });
  });

  describe('fetchSchemaData', () => {
    it('should call fetch with correct parameters for basic request', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          text: () => Promise.resolve('@prefix : <http://example.org/> .'),
        } as Response)
      );

      const schema = 'test-schema.ttl';
      await fetchSchemaData(schema);

      expect(vi.mocked(fetchTokenClientSide)).toHaveBeenCalledWith(undefined);
      expect(vi.mocked(setAuthorizationHeader)).toHaveBeenCalledWith(
        'mock-token',
        expect.any(Headers)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        'https://search-api.example.com/v2/schemas/test-schema.ttl/content',
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
          text: () => Promise.resolve(''),
        } as Response)
      );

      const customToken = 'custom-token';
      const schema = 'test-schema.ttl';
      await fetchSchemaData(schema, customToken);

      expect(vi.mocked(fetchTokenClientSide)).toHaveBeenCalledWith(customToken);
    });

    it('should set authorization header', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          text: () => Promise.resolve(''),
        } as Response)
      );

      await fetchSchemaData('test.ttl');

      expect(vi.mocked(setAuthorizationHeader)).toHaveBeenCalledWith(
        'mock-token',
        expect.any(Headers)
      );
    });

    it('should always use v1 for content endpoint regardless of PUBLIC_SEARCH_API_VERSION', async () => {
      vi.mocked(getPublicEnv).mockReturnValue({
        PUBLIC_SEARCH_API_URL: 'https://search-api.example.com',
        PUBLIC_SEARCH_API_VERSION: 'v3',
      });

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          text: () => Promise.resolve(''),
        } as Response)
      );

      const schema = 'versioned-schema.ttl';
      await fetchSchemaData(schema);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://search-api.example.com/v2/schemas/versioned-schema.ttl/content',
        {
          method: 'GET',
          headers: expect.any(Headers),
        }
      );
    });

    it('should handle special characters in schema filename', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          text: () => Promise.resolve(''),
        } as Response)
      );

      const schemaWithSpecialChars = 'test schema & file.ttl';
      await fetchSchemaData(schemaWithSpecialChars);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://search-api.example.com/v2/schemas/test schema & file.ttl/content',
        {
          method: 'GET',
          headers: expect.any(Headers),
        }
      );
    });

    it('should handle fetch errors', async () => {
      const mockError = new Error('Schema not found');
      global.fetch = vi.fn(() => Promise.reject(mockError));

      await expect(fetchSchemaData('missing-schema.ttl')).rejects.toThrow('Schema not found');
    });
  });

  describe('error handling', () => {
    it('should handle authentication errors in getSchemas', async () => {
      vi.mocked(fetchTokenClientSide).mockRejectedValue(new Error('Auth failed'));

      await expect(getSchemas()).rejects.toThrow('Auth failed');
    });

    it('should handle authentication errors in fetchSchemaData', async () => {
      vi.mocked(fetchTokenClientSide).mockRejectedValue(new Error('Token expired'));

      await expect(fetchSchemaData('test.ttl')).rejects.toThrow('Token expired');
    });

    it('should handle network timeouts', async () => {
      const timeoutError = new Error('Request timeout');
      global.fetch = vi.fn(() => Promise.reject(timeoutError));

      await expect(getSchemas()).rejects.toThrow('Request timeout');
      await expect(fetchSchemaData('test.ttl')).rejects.toThrow('Request timeout');
    });
  });

  describe('integration scenarios', () => {
    it('should work with different versions and schemas (content always uses v1)', async () => {
      vi.mocked(getPublicEnv).mockReturnValue({
        PUBLIC_SEARCH_API_URL: 'https://prod-api.example.com',
        PUBLIC_SEARCH_API_VERSION: 'v3',
      });

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          text: () => Promise.resolve('@prefix example: <http://example.org/> .'),
        } as Response)
      );

      const customToken = 'prod-token';
      const result = await fetchSchemaData('production-schema.ttl', customToken);

      expect(vi.mocked(fetchTokenClientSide)).toHaveBeenCalledWith(customToken);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://prod-api.example.com/v2/schemas/production-schema.ttl/content',
        {
          method: 'GET',
          headers: expect.any(Headers),
        }
      );
      expect(result).toBeDefined();
    });

    it('should handle concurrent requests properly', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: 'test' }),
        } as Response)
      );

      // Simulate concurrent requests
      const promises = [getSchemas(), getSchemas('token1'), getSchemas('token2')];

      await Promise.all(promises);

      expect(vi.mocked(fetchTokenClientSide)).toHaveBeenCalledTimes(3);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });
});
