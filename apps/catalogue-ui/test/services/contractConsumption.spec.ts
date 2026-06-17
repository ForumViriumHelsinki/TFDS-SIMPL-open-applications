import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getEndpoint,
  getCatalogueOffers,
  initiateContractNegotiation,
  getContractNegotiationStatus,
} from '@/services/contractConsumption';
import { fetchTokenClientSide, setAuthorizationHeader } from '@/util/authentication';
import { getPublicEnv } from '@/util/getEnv';
import type { ContractNegotiationRequestData } from 'types/contracts';

// Mock the dependencies
vi.mock('@/util/authentication', () => ({
  fetchTokenClientSide: vi.fn(),
  setAuthorizationHeader: vi.fn(),
}));

vi.mock('@/util/getEnv', () => ({
  getPublicEnv: vi.fn(() => ({
    PUBLIC_CONTRACT_CONSUMPTION_API_URL: 'https://contract-api.example.com',
    PUBLIC_CONTRACT_CONSUMPTION_API_VERSION: 'v1',
  })),
}));

describe('contractConsumption service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();

    // Reset to default mock implementations
    vi.mocked(fetchTokenClientSide).mockResolvedValue('mock-token');
    vi.mocked(getPublicEnv).mockReturnValue({
      PUBLIC_CONTRACT_CONSUMPTION_API_URL: 'https://contract-api.example.com',
    });
  });

  describe('getEndpoint', () => {
    it('should return correct endpoints for basic configuration', () => {
      expect(getEndpoint('negotiate')).toBe('https://contract-api.example.com/undefined/contracts');
      expect(getEndpoint('offers')).toBe(
        'https://contract-api.example.com/undefined/connectorCatalog/assets'
      );
      expect(getEndpoint('status')).toBe('https://contract-api.example.com/undefined/contracts');
    });

    it('should handle different API URLs', () => {
      vi.mocked(getPublicEnv).mockReturnValue({
        PUBLIC_CONTRACT_CONSUMPTION_API_URL: 'https://different-contract-api.example.com',
      });

      expect(getEndpoint('negotiate')).toBe(
        'https://different-contract-api.example.com/undefined/contracts'
      );
      expect(getEndpoint('offers')).toBe(
        'https://different-contract-api.example.com/undefined/connectorCatalog/assets'
      );
      expect(getEndpoint('status')).toBe(
        'https://different-contract-api.example.com/undefined/contracts'
      );
    });

    it('should include version in URL when PUBLIC_CONTRACT_CONSUMPTION_API_VERSION is provided', () => {
      vi.mocked(getPublicEnv).mockReturnValue({
        PUBLIC_CONTRACT_CONSUMPTION_API_URL: 'https://contract-api.example.com',
        PUBLIC_CONTRACT_CONSUMPTION_API_VERSION: 'v1',
      });

      expect(getEndpoint('negotiate')).toBe('https://contract-api.example.com/v1/contracts');
      expect(getEndpoint('offers')).toBe(
        'https://contract-api.example.com/v1/connectorCatalog/assets'
      );
      expect(getEndpoint('status')).toBe('https://contract-api.example.com/v1/contracts');
    });

    it('should handle different version formats', () => {
      vi.mocked(getPublicEnv).mockReturnValue({
        PUBLIC_CONTRACT_CONSUMPTION_API_URL: 'https://contract-api.example.com',
        PUBLIC_CONTRACT_CONSUMPTION_API_VERSION: 'api/v2.0',
      });

      expect(getEndpoint('negotiate')).toBe('https://contract-api.example.com/api/v2.0/contracts');
      expect(getEndpoint('offers')).toBe(
        'https://contract-api.example.com/api/v2.0/connectorCatalog/assets'
      );
      expect(getEndpoint('status')).toBe('https://contract-api.example.com/api/v2.0/contracts');
    });

    it('should handle empty version string', () => {
      vi.mocked(getPublicEnv).mockReturnValue({
        PUBLIC_CONTRACT_CONSUMPTION_API_URL: 'https://contract-api.example.com',
        PUBLIC_CONTRACT_CONSUMPTION_API_VERSION: '',
      });

      expect(getEndpoint('negotiate')).toBe('https://contract-api.example.com//contracts');
      expect(getEndpoint('offers')).toBe(
        'https://contract-api.example.com//connectorCatalog/assets'
      );
      expect(getEndpoint('status')).toBe('https://contract-api.example.com//contracts');
    });

    it('should handle version with leading slash', () => {
      vi.mocked(getPublicEnv).mockReturnValue({
        PUBLIC_CONTRACT_CONSUMPTION_API_URL: 'https://contract-api.example.com',
        PUBLIC_CONTRACT_CONSUMPTION_API_VERSION: '/v3',
      });

      expect(getEndpoint('negotiate')).toBe('https://contract-api.example.com//v3/contracts');
      expect(getEndpoint('offers')).toBe(
        'https://contract-api.example.com//v3/connectorCatalog/assets'
      );
      expect(getEndpoint('status')).toBe('https://contract-api.example.com//v3/contracts');
    });

    it('should handle complex versioned URLs', () => {
      vi.mocked(getPublicEnv).mockReturnValue({
        PUBLIC_CONTRACT_CONSUMPTION_API_URL: 'https://staging-contract-api.example.com/api',
        PUBLIC_CONTRACT_CONSUMPTION_API_VERSION: 'v2.1-beta',
      });

      expect(getEndpoint('negotiate')).toBe(
        'https://staging-contract-api.example.com/api/v2.1-beta/contracts'
      );
      expect(getEndpoint('offers')).toBe(
        'https://staging-contract-api.example.com/api/v2.1-beta/connectorCatalog/assets'
      );
      expect(getEndpoint('status')).toBe(
        'https://staging-contract-api.example.com/api/v2.1-beta/contracts'
      );
    });

    it('should handle localhost URLs', () => {
      vi.mocked(getPublicEnv).mockReturnValue({
        PUBLIC_CONTRACT_CONSUMPTION_API_URL: 'http://localhost:8080',
        PUBLIC_CONTRACT_CONSUMPTION_API_VERSION: 'v1',
      });

      expect(getEndpoint('negotiate')).toBe('http://localhost:8080/v1/contracts');
      expect(getEndpoint('offers')).toBe('http://localhost:8080/v1/connectorCatalog/assets');
      expect(getEndpoint('status')).toBe('http://localhost:8080/v1/contracts');
    });

    it('should handle URLs with ports and no version', () => {
      vi.mocked(getPublicEnv).mockReturnValue({
        PUBLIC_CONTRACT_CONSUMPTION_API_URL: 'https://contract-api.example.com:8443',
      });

      expect(getEndpoint('negotiate')).toBe(
        'https://contract-api.example.com:8443/undefined/contracts'
      );
      expect(getEndpoint('offers')).toBe(
        'https://contract-api.example.com:8443/undefined/connectorCatalog/assets'
      );
      expect(getEndpoint('status')).toBe(
        'https://contract-api.example.com:8443/undefined/contracts'
      );
    });

    it('should handle URLs with paths', () => {
      vi.mocked(getPublicEnv).mockReturnValue({
        PUBLIC_CONTRACT_CONSUMPTION_API_URL: 'https://api.example.com/contract-service',
      });

      expect(getEndpoint('negotiate')).toBe(
        'https://api.example.com/contract-service/undefined/contracts'
      );
      expect(getEndpoint('offers')).toBe(
        'https://api.example.com/contract-service/undefined/connectorCatalog/assets'
      );
      expect(getEndpoint('status')).toBe(
        'https://api.example.com/contract-service/undefined/contracts'
      );
    });

    it('should handle URLs with paths and version', () => {
      vi.mocked(getPublicEnv).mockReturnValue({
        PUBLIC_CONTRACT_CONSUMPTION_API_URL: 'https://api.example.com/services/contract',
        PUBLIC_CONTRACT_CONSUMPTION_API_VERSION: 'v2',
      });

      expect(getEndpoint('negotiate')).toBe(
        'https://api.example.com/services/contract/v2/contracts'
      );
      expect(getEndpoint('offers')).toBe(
        'https://api.example.com/services/contract/v2/connectorCatalog/assets'
      );
      expect(getEndpoint('status')).toBe('https://api.example.com/services/contract/v2/contracts');
    });

    it('should return empty string for invalid endpoint name', () => {
      // TypeScript should prevent this, but testing the fallback behavior
      expect(getEndpoint('invalidEndpoint' as any)).toBe('');
    });

    it('should handle null/undefined environment values gracefully', () => {
      vi.mocked(getPublicEnv).mockReturnValue({
        PUBLIC_CONTRACT_CONSUMPTION_API_URL: undefined as any,
        PUBLIC_CONTRACT_CONSUMPTION_API_VERSION: undefined as any,
      });

      expect(getEndpoint('negotiate')).toBe('undefined/undefined/contracts');
      expect(getEndpoint('offers')).toBe('undefined/undefined/connectorCatalog/assets');
      expect(getEndpoint('status')).toBe('undefined/undefined/contracts');
    });

    it('should handle trailing slashes in API URL', () => {
      vi.mocked(getPublicEnv).mockReturnValue({
        PUBLIC_CONTRACT_CONSUMPTION_API_URL: 'https://contract-api.example.com/',
      });

      expect(getEndpoint('negotiate')).toBe(
        'https://contract-api.example.com//undefined/contracts'
      );
      expect(getEndpoint('offers')).toBe(
        'https://contract-api.example.com//undefined/connectorCatalog/assets'
      );
      expect(getEndpoint('status')).toBe('https://contract-api.example.com//undefined/contracts');
    });

    it('should handle trailing slashes with version', () => {
      vi.mocked(getPublicEnv).mockReturnValue({
        PUBLIC_CONTRACT_CONSUMPTION_API_URL: 'https://contract-api.example.com/',
        PUBLIC_CONTRACT_CONSUMPTION_API_VERSION: 'v1',
      });

      expect(getEndpoint('negotiate')).toBe('https://contract-api.example.com//v1/contracts');
      expect(getEndpoint('offers')).toBe(
        'https://contract-api.example.com//v1/connectorCatalog/assets'
      );
      expect(getEndpoint('status')).toBe('https://contract-api.example.com//v1/contracts');
    });

    it('should be case sensitive for endpoint names', () => {
      expect(getEndpoint('Negotiate' as any)).toBe('');
      expect(getEndpoint('OFFERS' as any)).toBe('');
      expect(getEndpoint('Negotiate' as any)).not.toBe(getEndpoint('negotiate'));
    });

    it('should handle environment changes between calls', () => {
      // First call
      expect(getEndpoint('negotiate')).toBe('https://contract-api.example.com/undefined/contracts');

      // Change environment
      vi.mocked(getPublicEnv).mockReturnValue({
        PUBLIC_CONTRACT_CONSUMPTION_API_URL: 'https://new-api.example.com',
        PUBLIC_CONTRACT_CONSUMPTION_API_VERSION: 'v2',
      });

      // Second call should use new environment
      expect(getEndpoint('negotiate')).toBe('https://new-api.example.com/v2/contracts');
    });
  });

  describe('getCatalogueOffers', () => {
    const mockContractRequest: ContractNegotiationRequestData = {
      providerEndpoint: 'https://provider.example.com',
      contractDefinitionId: 'definition-123',
      assetId: 'asset-456',
    };

    it('should call fetch with correct parameters for catalogue offers', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ offers: ['offer1', 'offer2'] }),
        } as Response)
      );

      await getCatalogueOffers(mockContractRequest);

      expect(vi.mocked(fetchTokenClientSide)).toHaveBeenCalledWith(undefined);
      expect(vi.mocked(setAuthorizationHeader)).toHaveBeenCalledWith(
        'mock-token',
        expect.any(Headers)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        'https://contract-api.example.com/undefined/connectorCatalog/assets',
        {
          method: 'POST',
          headers: expect.any(Headers),
          body: JSON.stringify(mockContractRequest),
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
      await getCatalogueOffers(mockContractRequest, customToken);

      expect(vi.mocked(fetchTokenClientSide)).toHaveBeenCalledWith(customToken);
    });

    it('should set correct headers', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response)
      );

      await getCatalogueOffers(mockContractRequest);

      const [, options] = vi.mocked(global.fetch).mock.calls[0];
      const headers = options?.headers as Headers;

      expect(headers.get('Content-Type')).toBe('application/json');
      expect(vi.mocked(setAuthorizationHeader)).toHaveBeenCalledWith('mock-token', headers);
    });

    it('should serialize contract request correctly', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response)
      );

      const complexContractRequest: ContractNegotiationRequestData = {
        providerEndpoint: 'https://complex-provider.example.com',
        contractDefinitionId: 'complex-definition-123',
        assetId: 'complex-asset-456',
      };

      await getCatalogueOffers(complexContractRequest);

      const [, options] = vi.mocked(global.fetch).mock.calls[0];
      expect(options?.body).toBe(JSON.stringify(complexContractRequest));
    });

    it('should handle fetch errors', async () => {
      const mockError = new Error('Catalogue offers failed');
      global.fetch = vi.fn(() => Promise.reject(mockError));

      await expect(getCatalogueOffers(mockContractRequest)).rejects.toThrow(
        'Catalogue offers failed'
      );
    });

    it('should handle different API URLs', async () => {
      vi.mocked(getPublicEnv).mockReturnValue({
        PUBLIC_CONTRACT_CONSUMPTION_API_URL: 'https://staging-contract-api.example.com',
      });

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response)
      );

      await getCatalogueOffers(mockContractRequest);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://staging-contract-api.example.com/undefined/connectorCatalog/assets',
        expect.any(Object)
      );
    });
  });

  describe('initiateContractNegotiation', () => {
    const mockContractRequest: ContractNegotiationRequestData = {
      providerEndpoint: 'https://provider.example.com',
      contractDefinitionId: 'definition-123',
      assetId: 'asset-456',
    };

    it('should call fetch with correct parameters for contract negotiation', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ negotiationId: 'negotiation-123' }),
        } as Response)
      );

      await initiateContractNegotiation(mockContractRequest);

      expect(vi.mocked(fetchTokenClientSide)).toHaveBeenCalledWith(undefined);
      expect(vi.mocked(setAuthorizationHeader)).toHaveBeenCalledWith(
        'mock-token',
        expect.any(Headers)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        'https://contract-api.example.com/undefined/contracts',
        {
          method: 'POST',
          headers: expect.any(Headers),
          body: JSON.stringify(mockContractRequest),
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
      await initiateContractNegotiation(mockContractRequest, customToken);

      expect(vi.mocked(fetchTokenClientSide)).toHaveBeenCalledWith(customToken);
    });

    it('should set correct headers', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response)
      );

      await initiateContractNegotiation(mockContractRequest);

      const [, options] = vi.mocked(global.fetch).mock.calls[0];
      const headers = options?.headers as Headers;

      expect(headers.get('Content-Type')).toBe('application/json');
      expect(vi.mocked(setAuthorizationHeader)).toHaveBeenCalledWith('mock-token', headers);
    });

    it('should serialize contract request correctly', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response)
      );

      const complexContractRequest: ContractNegotiationRequestData = {
        providerEndpoint: 'https://complex-provider.example.com',
        contractDefinitionId: 'complex-definition-123',
        assetId: 'complex-asset-456',
      };

      await initiateContractNegotiation(complexContractRequest);

      const [, options] = vi.mocked(global.fetch).mock.calls[0];
      expect(options?.body).toBe(JSON.stringify(complexContractRequest));
    });

    it('should handle fetch errors', async () => {
      const mockError = new Error('Contract negotiation failed');
      global.fetch = vi.fn(() => Promise.reject(mockError));

      await expect(initiateContractNegotiation(mockContractRequest)).rejects.toThrow(
        'Contract negotiation failed'
      );
    });

    it('should handle different API URLs', async () => {
      vi.mocked(getPublicEnv).mockReturnValue({
        PUBLIC_CONTRACT_CONSUMPTION_API_URL: 'https://staging-contract-api.example.com',
      });

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response)
      );

      await initiateContractNegotiation(mockContractRequest);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://staging-contract-api.example.com/undefined/contracts',
        expect.any(Object)
      );
    });
  });

  describe('getContractNegotiationStatus', () => {
    it('should call fetch with correct parameters for status check', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ state: 'CONFIRMED' }),
        } as Response)
      );

      const negotiationId = 'negotiation-123';
      await getContractNegotiationStatus(negotiationId);

      expect(vi.mocked(fetchTokenClientSide)).toHaveBeenCalledWith(undefined);
      expect(vi.mocked(setAuthorizationHeader)).toHaveBeenCalledWith(
        'mock-token',
        expect.any(Headers)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        'https://contract-api.example.com/undefined/contracts/negotiation-123',
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
      const negotiationId = 'negotiation-456';
      await getContractNegotiationStatus(negotiationId, customToken);

      expect(vi.mocked(fetchTokenClientSide)).toHaveBeenCalledWith(customToken);
    });

    it('should set correct headers', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response)
      );

      await getContractNegotiationStatus('negotiation-123');

      const [, options] = vi.mocked(global.fetch).mock.calls[0];
      const headers = options?.headers as Headers;

      expect(vi.mocked(setAuthorizationHeader)).toHaveBeenCalledWith('mock-token', headers);
    });

    it('should handle special characters in negotiation ID', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response)
      );

      const negotiationIdWithSpecialChars = 'negotiation-123/special&chars';
      await getContractNegotiationStatus(negotiationIdWithSpecialChars);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://contract-api.example.com/undefined/contracts/negotiation-123/special&chars',
        {
          method: 'GET',
          headers: expect.any(Headers),
        }
      );
    });

    it('should handle empty negotiation ID', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response)
      );

      await getContractNegotiationStatus('');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://contract-api.example.com/undefined/contracts/',
        {
          method: 'GET',
          headers: expect.any(Headers),
        }
      );
    });

    it('should handle fetch errors', async () => {
      const mockError = new Error('Status check failed');
      global.fetch = vi.fn(() => Promise.reject(mockError));

      await expect(getContractNegotiationStatus('negotiation-123')).rejects.toThrow(
        'Status check failed'
      );
    });

    it('should handle different API URLs', async () => {
      vi.mocked(getPublicEnv).mockReturnValue({
        PUBLIC_CONTRACT_CONSUMPTION_API_URL: 'https://prod-contract-api.example.com',
      });

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response)
      );

      await getContractNegotiationStatus('negotiation-789');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://prod-contract-api.example.com/undefined/contracts/negotiation-789',
        expect.any(Object)
      );
    });
  });

  describe('error handling', () => {
    it('should handle authentication errors in getCatalogueOffers', async () => {
      vi.mocked(fetchTokenClientSide).mockRejectedValue(new Error('Auth failed'));

      const mockContractRequest: ContractNegotiationRequestData = {
        providerEndpoint: 'https://provider.example.com',
        contractDefinitionId: 'definition-123',
        assetId: 'asset-456',
      };

      await expect(getCatalogueOffers(mockContractRequest)).rejects.toThrow('Auth failed');
    });

    it('should handle authentication errors in initiateContractNegotiation', async () => {
      vi.mocked(fetchTokenClientSide).mockRejectedValue(new Error('Token expired'));

      const mockContractRequest: ContractNegotiationRequestData = {
        providerEndpoint: 'https://provider.example.com',
        contractDefinitionId: 'definition-123',
        assetId: 'asset-456',
      };

      await expect(initiateContractNegotiation(mockContractRequest)).rejects.toThrow(
        'Token expired'
      );
    });

    it('should handle authentication errors in getContractNegotiationStatus', async () => {
      vi.mocked(fetchTokenClientSide).mockRejectedValue(new Error('Token expired'));

      await expect(getContractNegotiationStatus('negotiation-123')).rejects.toThrow(
        'Token expired'
      );
    });

    it('should handle network timeouts', async () => {
      const timeoutError = new Error('Request timeout');
      global.fetch = vi.fn(() => Promise.reject(timeoutError));

      const mockContractRequest: ContractNegotiationRequestData = {
        providerEndpoint: 'https://provider.example.com',
        contractDefinitionId: 'definition-123',
        assetId: 'asset-456',
      };

      await expect(getCatalogueOffers(mockContractRequest)).rejects.toThrow('Request timeout');
      await expect(initiateContractNegotiation(mockContractRequest)).rejects.toThrow(
        'Request timeout'
      );
      await expect(getContractNegotiationStatus('negotiation-123')).rejects.toThrow(
        'Request timeout'
      );
    });
  });

  describe('integration scenarios', () => {
    it('should work with different environments and tokens', async () => {
      vi.mocked(getPublicEnv).mockReturnValue({
        PUBLIC_CONTRACT_CONSUMPTION_API_URL: 'https://dev-contract-api.example.com',
        PUBLIC_CONTRACT_CONSUMPTION_API_VERSION: 'v1',
      });

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ negotiationId: 'dev-negotiation-123' }),
        } as Response)
      );

      const devToken = 'dev-token';
      const contractRequest: ContractNegotiationRequestData = {
        providerEndpoint: 'https://provider.example.com',
        contractDefinitionId: 'dev-definition-123',
        assetId: 'dev-asset-456',
      };

      const result = await initiateContractNegotiation(contractRequest, devToken);

      expect(vi.mocked(fetchTokenClientSide)).toHaveBeenCalledWith(devToken);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://dev-contract-api.example.com/v1/contracts',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(contractRequest),
        })
      );
      expect(result).toBeDefined();
    });

    it('should handle concurrent contract operations', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        } as Response)
      );

      const contractRequest: ContractNegotiationRequestData = {
        providerEndpoint: 'https://provider.example.com',
        contractDefinitionId: 'concurrent-definition',
        assetId: 'concurrent-asset',
      };

      // Simulate concurrent operations
      const promises = [
        getCatalogueOffers(contractRequest, 'token1'),
        initiateContractNegotiation(contractRequest, 'token2'),
        getContractNegotiationStatus('negotiation-1', 'token3'),
      ];

      await Promise.all(promises);

      expect(vi.mocked(fetchTokenClientSide)).toHaveBeenCalledTimes(3);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should handle versioned API endpoints correctly', async () => {
      vi.mocked(getPublicEnv).mockReturnValue({
        PUBLIC_CONTRACT_CONSUMPTION_API_URL: 'https://contract-api.example.com',
        PUBLIC_CONTRACT_CONSUMPTION_API_VERSION: 'v2',
      });

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response)
      );

      const contractRequest: ContractNegotiationRequestData = {
        providerEndpoint: 'https://provider.example.com',
        contractDefinitionId: 'definition-123',
        assetId: 'asset-456',
      };

      // Test all three functions with versioned endpoints
      await getCatalogueOffers(contractRequest);
      await initiateContractNegotiation(contractRequest);
      await getContractNegotiationStatus('negotiation-123');

      const fetchCalls = vi.mocked(global.fetch).mock.calls;
      expect(fetchCalls[0][0]).toBe('https://contract-api.example.com/v2/connectorCatalog/assets');
      expect(fetchCalls[1][0]).toBe('https://contract-api.example.com/v2/contracts');
      expect(fetchCalls[2][0]).toBe(
        'https://contract-api.example.com/v2/contracts/negotiation-123'
      );
    });
  });
});
