import { vi, describe, it, expect } from 'vitest';
import {
  getEndpoint,
  getDestinationAddressTemplates,
  getDestinationAddressSchema,
  getDestinationAddressUiSchema,
} from '@/services/resourceAddress';
import { getPublicEnv } from '@/util/getEnv';
import type { SharingMethodId } from 'types/resourceAddress';

// Mock dependencies
vi.mock('@/util/authentication', () => ({
  fetchTokenClientSide: vi.fn(),
  setAuthorizationHeader: vi.fn(),
}));

vi.mock('@/util/getEnv', () => ({
  getPublicEnv: vi.fn(),
}));

vi.mock('@/util/fetch', () => ({
  enhancedFetch: vi.fn(),
}));

describe('resourceAddress service', () => {
  const mockEnv = {
    PUBLIC_CONTRACT_CONSUMPTION_API_URL: 'https://api.example.com',
    PUBLIC_CONTRACT_CONSUMPTION_API_VERSION: 'v1',
  };

  const mockEnvWithoutVersion = {
    PUBLIC_CONTRACT_CONSUMPTION_API_URL: 'https://api.example.com',
    PUBLIC_CONTRACT_CONSUMPTION_API_VERSION: undefined,
  };

  const createMockResponse = (data: any = {}, ok = true, status = 200) => {
    return {
      ok,
      status,
      statusText: ok ? 'OK' : 'Error',
      headers: new Headers({ 'Content-Type': 'application/json' }),
      json: vi.fn().mockResolvedValue(data),
      text: vi.fn().mockResolvedValue(JSON.stringify(data)),
      clone: vi.fn(),
    } as any;
  };

  describe('getEndpoint', () => {
    it('should generate templates endpoint with version', () => {
      vi.mocked(getPublicEnv).mockReturnValue(mockEnv);
      const endpoint = getEndpoint('templates', { sharingMethodId: 'HttpData' });
      expect(endpoint).toBe(
        'https://api.example.com/v1/resourceAddresses/sharingMethods/HttpData/templates'
      );
    });

    it('should generate templates endpoint without version', () => {
      vi.mocked(getPublicEnv).mockReturnValue(mockEnvWithoutVersion);
      const endpoint = getEndpoint('templates', { sharingMethodId: 'HttpData' });
      expect(endpoint).toBe(
        'https://api.example.com/resourceAddresses/sharingMethods/HttpData/templates'
      );
    });

    it('should generate schema endpoint with version', () => {
      vi.mocked(getPublicEnv).mockReturnValue(mockEnv);
      const endpoint = getEndpoint('schema', { templateId: 'template-123' });
      expect(endpoint).toBe(
        'https://api.example.com/v1/resourceAddresses/templates/template-123/schema'
      );
    });

    it('should generate schema endpoint without version', () => {
      vi.mocked(getPublicEnv).mockReturnValue(mockEnvWithoutVersion);
      const endpoint = getEndpoint('schema', { templateId: 'template-123' });
      expect(endpoint).toBe(
        'https://api.example.com/resourceAddresses/templates/template-123/schema'
      );
    });

    it('should generate uiSchema endpoint with version', () => {
      vi.mocked(getPublicEnv).mockReturnValue(mockEnv);
      const endpoint = getEndpoint('uiSchema', { templateId: 'template-456' });
      expect(endpoint).toBe(
        'https://api.example.com/v1/resourceAddresses/templates/template-456/uiSchema'
      );
    });

    it('should generate uiSchema endpoint without version', () => {
      vi.mocked(getPublicEnv).mockReturnValue(mockEnvWithoutVersion);
      const endpoint = getEndpoint('uiSchema', { templateId: 'template-456' });
      expect(endpoint).toBe(
        'https://api.example.com/resourceAddresses/templates/template-456/uiSchema'
      );
    });
  });

  describe('getDestinationAddressTemplates', () => {
    const mockParams = {
      sharingMethodId: 'HttpData' as SharingMethodId,
      offeringType: 'data',
    };

    it('should fetch templates with provided token', async () => {
      const { getPublicEnv } = await import('@/util/getEnv');
      const { fetchTokenClientSide, setAuthorizationHeader } =
        await import('@/util/authentication');
      const { enhancedFetch } = await import('@/util/fetch');

      vi.mocked(getPublicEnv).mockReturnValue(mockEnv);
      vi.mocked(fetchTokenClientSide).mockResolvedValue('provided-token');
      vi.mocked(enhancedFetch).mockResolvedValue(createMockResponse());

      await getDestinationAddressTemplates(mockParams, 'provided-token');

      expect(fetchTokenClientSide).toHaveBeenCalledWith('provided-token');
      expect(setAuthorizationHeader).toHaveBeenCalledWith('provided-token', expect.any(Headers));
      expect(enhancedFetch).toHaveBeenCalledWith(
        'https://api.example.com/v1/resourceAddresses/sharingMethods/HttpData/templates?offeringType=DATA',
        {
          method: 'GET',
          headers: expect.any(Headers),
        }
      );
    });

    it('should fetch templates without token', async () => {
      const { getPublicEnv } = await import('@/util/getEnv');
      const { fetchTokenClientSide, setAuthorizationHeader } =
        await import('@/util/authentication');
      const { enhancedFetch } = await import('@/util/fetch');

      vi.mocked(getPublicEnv).mockReturnValue(mockEnv);
      vi.mocked(fetchTokenClientSide).mockResolvedValue('fetched-token');
      vi.mocked(enhancedFetch).mockResolvedValue(createMockResponse());

      await getDestinationAddressTemplates(mockParams);

      expect(fetchTokenClientSide).toHaveBeenCalledWith(undefined);
      expect(setAuthorizationHeader).toHaveBeenCalledWith('fetched-token', expect.any(Headers));
    });

    it('should set correct headers', async () => {
      const { getPublicEnv } = await import('@/util/getEnv');
      const { fetchTokenClientSide, setAuthorizationHeader } =
        await import('@/util/authentication');
      const { enhancedFetch } = await import('@/util/fetch');

      vi.mocked(getPublicEnv).mockReturnValue(mockEnv);
      vi.mocked(fetchTokenClientSide).mockResolvedValue('token');
      vi.mocked(enhancedFetch).mockResolvedValue(createMockResponse());

      await getDestinationAddressTemplates(mockParams);

      const [, options] = vi.mocked(enhancedFetch).mock.calls[0];
      const headers = options?.headers as Headers;

      expect(vi.mocked(setAuthorizationHeader)).toHaveBeenCalledWith('token', headers);
    });
  });

  describe('getDestinationAddressSchema', () => {
    const mockParams = {
      templateId: 'template-123',
    };

    it('should fetch schema with provided token', async () => {
      const { getPublicEnv } = await import('@/util/getEnv');
      const { fetchTokenClientSide, setAuthorizationHeader } =
        await import('@/util/authentication');
      const { enhancedFetch } = await import('@/util/fetch');

      vi.mocked(getPublicEnv).mockReturnValue(mockEnv);
      vi.mocked(fetchTokenClientSide).mockResolvedValue('provided-token');
      vi.mocked(enhancedFetch).mockResolvedValue(createMockResponse());

      await getDestinationAddressSchema(mockParams, 'provided-token');

      expect(fetchTokenClientSide).toHaveBeenCalledWith('provided-token');
      expect(setAuthorizationHeader).toHaveBeenCalledWith('provided-token', expect.any(Headers));
      expect(enhancedFetch).toHaveBeenCalledWith(
        'https://api.example.com/v1/resourceAddresses/templates/template-123/schema',
        {
          method: 'GET',
          headers: expect.any(Headers),
        }
      );
    });

    it('should fetch schema without token', async () => {
      const { getPublicEnv } = await import('@/util/getEnv');
      const { fetchTokenClientSide } = await import('@/util/authentication');
      const { enhancedFetch } = await import('@/util/fetch');

      vi.mocked(getPublicEnv).mockReturnValue(mockEnvWithoutVersion);
      vi.mocked(fetchTokenClientSide).mockResolvedValue('fetched-token');
      vi.mocked(enhancedFetch).mockResolvedValue(createMockResponse());

      await getDestinationAddressSchema(mockParams);

      expect(fetchTokenClientSide).toHaveBeenCalledWith(undefined);
      expect(enhancedFetch).toHaveBeenCalledWith(
        'https://api.example.com/resourceAddresses/templates/template-123/schema',
        expect.any(Object)
      );
    });
  });

  describe('getDestinationAddressUiSchema', () => {
    const mockParams = {
      templateId: 'template-456',
    };

    it('should fetch UI schema with provided token', async () => {
      const { getPublicEnv } = await import('@/util/getEnv');
      const { fetchTokenClientSide, setAuthorizationHeader } =
        await import('@/util/authentication');
      const { enhancedFetch } = await import('@/util/fetch');

      vi.mocked(getPublicEnv).mockReturnValue(mockEnv);
      vi.mocked(fetchTokenClientSide).mockResolvedValue('provided-token');
      vi.mocked(enhancedFetch).mockResolvedValue(createMockResponse());

      await getDestinationAddressUiSchema(mockParams, 'provided-token');

      expect(fetchTokenClientSide).toHaveBeenCalledWith('provided-token');
      expect(setAuthorizationHeader).toHaveBeenCalledWith('provided-token', expect.any(Headers));
      expect(enhancedFetch).toHaveBeenCalledWith(
        'https://api.example.com/v1/resourceAddresses/templates/template-456/uiSchema',
        {
          method: 'GET',
          headers: expect.any(Headers),
        }
      );
    });

    it('should fetch UI schema without token', async () => {
      const { getPublicEnv } = await import('@/util/getEnv');
      const { fetchTokenClientSide } = await import('@/util/authentication');
      const { enhancedFetch } = await import('@/util/fetch');

      vi.mocked(getPublicEnv).mockReturnValue(mockEnvWithoutVersion);
      vi.mocked(fetchTokenClientSide).mockResolvedValue('fetched-token');
      vi.mocked(enhancedFetch).mockResolvedValue(createMockResponse());

      await getDestinationAddressUiSchema(mockParams);

      expect(fetchTokenClientSide).toHaveBeenCalledWith(undefined);
      expect(enhancedFetch).toHaveBeenCalledWith(
        'https://api.example.com/resourceAddresses/templates/template-456/uiSchema',
        expect.any(Object)
      );
    });

    it('should set correct headers', async () => {
      const { getPublicEnv } = await import('@/util/getEnv');
      const { fetchTokenClientSide, setAuthorizationHeader } =
        await import('@/util/authentication');
      const { enhancedFetch } = await import('@/util/fetch');

      vi.mocked(getPublicEnv).mockReturnValue(mockEnv);
      vi.mocked(fetchTokenClientSide).mockResolvedValue('token');
      vi.mocked(enhancedFetch).mockResolvedValue(createMockResponse());

      await getDestinationAddressUiSchema(mockParams);

      const [, options] = vi.mocked(enhancedFetch).mock.calls[0];
      const headers = options?.headers as Headers;

      expect(vi.mocked(setAuthorizationHeader)).toHaveBeenCalledWith('token', headers);
    });
  });

  describe('error handling', () => {
    it('should handle authentication errors gracefully', async () => {
      const { getPublicEnv } = await import('@/util/getEnv');
      const { fetchTokenClientSide } = await import('@/util/authentication');

      vi.mocked(getPublicEnv).mockReturnValue(mockEnv);
      vi.mocked(fetchTokenClientSide).mockRejectedValue(new Error('Auth failed'));

      const mockParams = {
        sharingMethodId: 'HttpData' as SharingMethodId,
        offeringType: 'data',
      };

      await expect(getDestinationAddressTemplates(mockParams)).rejects.toThrow('Auth failed');
    });

    it('should handle fetch errors gracefully', async () => {
      const { getPublicEnv } = await import('@/util/getEnv');
      const { fetchTokenClientSide } = await import('@/util/authentication');
      const { enhancedFetch } = await import('@/util/fetch');

      vi.mocked(getPublicEnv).mockReturnValue(mockEnv);
      vi.mocked(fetchTokenClientSide).mockResolvedValue('token');
      vi.mocked(enhancedFetch).mockRejectedValue(new Error('Network error'));

      const mockParams = {
        templateId: 'template-123',
      };

      await expect(getDestinationAddressSchema(mockParams)).rejects.toThrow('Network error');
    });
  });
});
