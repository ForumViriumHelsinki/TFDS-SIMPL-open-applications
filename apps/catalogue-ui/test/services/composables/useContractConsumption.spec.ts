import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useContractConsumption } from '@/services/composables/useContractConsumption';
import { fetchLocalEndpoint } from '@/util/services';

// Mock the dependencies
vi.mock('@/util/services', () => ({
  fetchLocalEndpoint: vi.fn(),
}));

describe('useContractConsumption', () => {
  const mockNegotiationData = {
    providerEndpoint: 'https://provider.example.com',
    contractDefinitionId: 'test-contract-definition-id',
    assetId: 'test-asset-id',
  };

  const negotiationId = 'test-negotiation-id';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCatalogOffers', () => {
    it('should call fetchLocalEndpoint with correct parameters for catalog offers', async () => {
      const mockOffers = {
        offers: [
          { id: 'offer1', policy: {} },
          { id: 'offer2', policy: {} },
        ],
      };

      const mockResult = {
        data: ref(mockOffers),
        error: ref(null),
        isLoading: ref(false),
      };

      vi.mocked(fetchLocalEndpoint).mockResolvedValue(mockResult);

      const { getCatalogOffers } = useContractConsumption();
      const result = await getCatalogOffers(mockNegotiationData);

      expect(fetchLocalEndpoint).toHaveBeenCalledWith('/api/connectorCatalog/assets', {
        method: 'POST',
        errorIdentifier: 'CONTRACT_OFFERS_ERROR',
        apiName: 'contract negotiation',
        body: mockNegotiationData,
      });

      expect(result).toEqual(mockResult);
    });

    it('should handle errors when fetching catalog offers', async () => {
      const mockError = {
        data: ref(null),
        error: ref({ title: 'Contract Error', description: 'Failed to fetch catalog offers' }),
        isLoading: ref(false),
      };

      vi.mocked(fetchLocalEndpoint).mockResolvedValue(mockError);

      const { getCatalogOffers } = useContractConsumption();
      const result = await getCatalogOffers(mockNegotiationData);

      expect(result.error.value).toEqual({
        title: 'Contract Error',
        description: 'Failed to fetch catalog offers',
      });
    });
  });

  describe('startContractNegotiation', () => {
    it('should call fetchLocalEndpoint with correct parameters for starting negotiation', async () => {
      const mockNegotiationResponse = {
        negotiationId: 'new-negotiation-id',
        status: 'INITIATED',
      };

      const mockResult = {
        data: ref(mockNegotiationResponse),
        error: ref(null),
        isLoading: ref(false),
      };

      vi.mocked(fetchLocalEndpoint).mockResolvedValue(mockResult);

      const { startContractNegotiation } = useContractConsumption();
      const result = await startContractNegotiation(mockNegotiationData);

      expect(fetchLocalEndpoint).toHaveBeenCalledWith('/api/contracts', {
        method: 'POST',
        errorIdentifier: 'NEGOTIATION_STATUS_ERROR',
        apiName: 'contract negotiation',
        body: mockNegotiationData,
      });

      expect(result).toEqual(mockResult);
    });

    it('should handle errors when starting contract negotiation', async () => {
      const mockError = {
        data: ref(null),
        error: ref({
          title: 'Negotiation Error',
          description: 'Failed to start contract negotiation',
        }),
        isLoading: ref(false),
      };

      vi.mocked(fetchLocalEndpoint).mockResolvedValue(mockError);

      const { startContractNegotiation } = useContractConsumption();
      const result = await startContractNegotiation(mockNegotiationData);

      expect(result.error.value).toEqual({
        title: 'Negotiation Error',
        description: 'Failed to start contract negotiation',
      });
    });
  });

  describe('fetchContractNegotiationStatus', () => {
    it('should call fetchLocalEndpoint with correct parameters for fetching negotiation status', async () => {
      const mockStatusResponse = {
        negotiationId,
        status: 'CONFIRMED',
        contractAgreementId: 'agreement-id',
      };

      const mockResult = {
        data: ref(mockStatusResponse),
        error: ref(null),
        isLoading: ref(false),
      };

      vi.mocked(fetchLocalEndpoint).mockResolvedValue(mockResult);

      const { fetchContractNegotiationStatus } = useContractConsumption();
      const result = await fetchContractNegotiationStatus(negotiationId);

      expect(fetchLocalEndpoint).toHaveBeenCalledWith(`/api/contracts/${negotiationId}`, {
        method: 'GET',
        errorIdentifier: 'NEGOTIATION_STATUS_ERROR',
        apiName: 'contract negotiation',
      });

      expect(result).toEqual(mockResult);
    });

    it('should handle errors when fetching negotiation status', async () => {
      const mockError = {
        data: ref(null),
        error: ref({ title: 'Status Error', description: 'Failed to fetch negotiation status' }),
        isLoading: ref(false),
      };

      vi.mocked(fetchLocalEndpoint).mockResolvedValue(mockError);

      const { fetchContractNegotiationStatus } = useContractConsumption();
      const result = await fetchContractNegotiationStatus(negotiationId);

      expect(result.error.value).toEqual({
        title: 'Status Error',
        description: 'Failed to fetch negotiation status',
      });
    });

    it('should handle empty negotiation ID', async () => {
      const emptyNegotiationId = '';
      const mockResult = {
        data: ref(null),
        error: ref(null),
        isLoading: ref(false),
      };

      vi.mocked(fetchLocalEndpoint).mockResolvedValue(mockResult);

      const { fetchContractNegotiationStatus } = useContractConsumption();
      await fetchContractNegotiationStatus(emptyNegotiationId);

      expect(fetchLocalEndpoint).toHaveBeenCalledWith(
        `/api/contracts/${emptyNegotiationId}`,
        expect.any(Object)
      );
    });
  });

  it('should return all three functions from the composable', () => {
    const composable = useContractConsumption();

    expect(composable).toHaveProperty('getCatalogOffers');
    expect(composable).toHaveProperty('startContractNegotiation');
    expect(composable).toHaveProperty('fetchContractNegotiationStatus');
    expect(typeof composable.getCatalogOffers).toBe('function');
    expect(typeof composable.startContractNegotiation).toBe('function');
    expect(typeof composable.fetchContractNegotiationStatus).toBe('function');
  });
});
