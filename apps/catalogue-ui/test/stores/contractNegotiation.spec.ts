import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useContractNegotiationStore } from '@/stores/contractNegotiation';
import type { ContractNegotiationStatusResponse } from 'types/contracts';
import type { UIError } from 'types/errors';

// Mock the dependencies
const mockFetchContractNegotiationStatus = vi.fn();
const mockStartContractNegotiation = vi.fn();

vi.mock('@/services/composables/useContractConsumption', () => ({
  useContractConsumption: () => ({
    fetchContractNegotiationStatus: mockFetchContractNegotiationStatus,
    startContractNegotiation: mockStartContractNegotiation,
  }),
}));

// Mock the resource description store
const mockResourceDescriptionDocument = {
  value: {
    credentialSubject: {
      'simpl:edcRegistration': {
        'simpl:assetId': 'asset-123',
        'simpl:contractDefinitionId': 'contract-123',
      },
      'simpl:edcConnector': {
        'simpl:providerEndpointURL': 'https://provider.com',
      },
    },
  },
};

vi.mock('@/stores/resourceDescription', () => ({
  useResourceDescriptionStore: () => ({
    resourceDescriptionDocument: mockResourceDescriptionDocument.value,
  }),
}));

// Mock the contract negotiation utilities
vi.mock('@/util/contractNegotiation', () => ({
  isEligibleForContractNegotiation: vi.fn((doc) => !!doc),
  getContractNegotiationData: vi.fn((doc) =>
    doc
      ? {
          contractOfferId: 'contract-123',
          providerEndpoint: 'https://provider.com',
          consumerEndpoint: 'https://consumer.com',
        }
      : null
  ),
}));

describe('contractNegotiationStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    // Reset mock values
    mockResourceDescriptionDocument.value = {
      credentialSubject: {
        'simpl:edcRegistration': {
          'simpl:assetId': 'asset-123',
          'simpl:contractDefinitionId': 'contract-123',
        },
        'simpl:edcConnector': {
          'simpl:providerEndpointURL': 'https://provider.com',
        },
      },
    };
  });

  const mockNegotiationStatus: ContractNegotiationStatusResponse = {
    '@id': 'negotiation-123',
    state: 'REQUESTED',
    counterPartyAddress: 'https://counterparty.com',
    counterPartyId: 'counterparty-123',
    contractAgreementId: 'agreement-123',
    errorDetail: null,
    protocol: 'dataspace-protocol-http',
    type: 'PROVIDER',
    createdAt: Date.now(),
  };

  const mockError: UIError = {
    title: 'Negotiation Error',
    description: 'Something went wrong with the negotiation',
  };

  describe('initial state', () => {
    it('should initialize with correct default values', () => {
      const store = useContractNegotiationStore();

      expect(store.negotiationId).toBeNull();
      expect(store.negotiationStatus).toBeNull();
      expect(store.negotiationStatusError).toBeNull();
      expect(store.isNegotiationFinalized).toBe(false);
      expect(store.isNegotiationTerminated).toBe(false);
      expect(store.isNegotiationEnded).toBe(false);
      expect(store.isNextNegotiationStatusLoading).toBe(false);
      expect(store.isEligible).toBe(true);
      expect(store.negotiationData).toEqual({
        contractOfferId: 'contract-123',
        providerEndpoint: 'https://provider.com',
        consumerEndpoint: 'https://consumer.com',
      });
    });
  });

  describe('setNegotiationId', () => {
    it('should set the negotiation ID', () => {
      const store = useContractNegotiationStore();

      store.setNegotiationId('test-negotiation-id');

      expect(store.negotiationId).toBe('test-negotiation-id');
    });
  });

  describe('setNegotiationStatus', () => {
    it('should set the negotiation status', () => {
      const store = useContractNegotiationStore();

      store.setNegotiationStatus(mockNegotiationStatus);

      expect(store.negotiationStatus).toEqual(mockNegotiationStatus);
    });
  });

  describe('computed properties', () => {
    describe('isNegotiationFinalized', () => {
      it('should return true when negotiation state is FINALIZED', () => {
        const store = useContractNegotiationStore();

        store.setNegotiationStatus({
          ...mockNegotiationStatus,
          state: 'FINALIZED',
        });

        expect(store.isNegotiationFinalized).toBe(true);
      });

      it('should return false when negotiation state is not FINALIZED', () => {
        const store = useContractNegotiationStore();

        store.setNegotiationStatus({
          ...mockNegotiationStatus,
          state: 'REQUESTED',
        });

        expect(store.isNegotiationFinalized).toBe(false);
      });

      it('should return false when negotiation status is null', () => {
        const store = useContractNegotiationStore();

        expect(store.isNegotiationFinalized).toBe(false);
      });
    });

    describe('isNegotiationTerminated', () => {
      it('should return true when negotiation state is TERMINATED', () => {
        const store = useContractNegotiationStore();

        store.setNegotiationStatus({
          ...mockNegotiationStatus,
          state: 'TERMINATED',
        });

        expect(store.isNegotiationTerminated).toBe(true);
      });

      it('should return false when negotiation state is not TERMINATED', () => {
        const store = useContractNegotiationStore();

        store.setNegotiationStatus({
          ...mockNegotiationStatus,
          state: 'REQUESTED',
        });

        expect(store.isNegotiationTerminated).toBe(false);
      });

      it('should return false when negotiation status is null', () => {
        const store = useContractNegotiationStore();

        expect(store.isNegotiationTerminated).toBe(false);
      });
    });

    describe('isNegotiationEnded', () => {
      it('should return true when negotiation is finalized', () => {
        const store = useContractNegotiationStore();

        store.setNegotiationStatus({
          ...mockNegotiationStatus,
          state: 'FINALIZED',
        });

        expect(store.isNegotiationEnded).toBe(true);
      });

      it('should return true when negotiation is terminated', () => {
        const store = useContractNegotiationStore();

        store.setNegotiationStatus({
          ...mockNegotiationStatus,
          state: 'TERMINATED',
        });

        expect(store.isNegotiationEnded).toBe(true);
      });

      it('should return true when there is a negotiation status error', () => {
        const store = useContractNegotiationStore();

        store.negotiationStatusError = mockError;

        expect(store.isNegotiationEnded).toBe(true);
      });

      it('should return false when negotiation is in progress', () => {
        const store = useContractNegotiationStore();

        store.setNegotiationStatus({
          ...mockNegotiationStatus,
          state: 'REQUESTED',
        });

        expect(store.isNegotiationEnded).toBe(false);
      });
    });
  });

  describe('fetchNewNegotiationStatus', () => {
    it('should fetch negotiation status when negotiation ID is set', async () => {
      const store = useContractNegotiationStore();
      store.setNegotiationId('negotiation-123');

      mockFetchContractNegotiationStatus.mockResolvedValue({
        data: { value: mockNegotiationStatus },
        error: { value: null },
      });

      await store.fetchNewNegotiationStatus();

      expect(mockFetchContractNegotiationStatus).toHaveBeenCalledWith('negotiation-123');
      expect(store.negotiationStatus).toEqual(mockNegotiationStatus);
    });

    it('should handle API errors when fetching negotiation status', async () => {
      const store = useContractNegotiationStore();
      store.setNegotiationId('negotiation-123');

      mockFetchContractNegotiationStatus.mockResolvedValue({
        data: { value: null },
        error: { value: mockError },
      });

      await store.fetchNewNegotiationStatus();

      expect(store.negotiationStatusError).toEqual(mockError);
    });

    it('should set loading state during fetch', async () => {
      const store = useContractNegotiationStore();
      store.setNegotiationId('negotiation-123');

      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetchContractNegotiationStatus.mockReturnValue(promise);

      const fetchPromise = store.fetchNewNegotiationStatus();

      expect(store.isNextNegotiationStatusLoading).toBe(true);

      resolvePromise!({
        data: { value: mockNegotiationStatus },
        error: { value: null },
      });

      await fetchPromise;

      expect(store.isNextNegotiationStatusLoading).toBe(false);
    });

    it('should not fetch when negotiation ID is null', async () => {
      const store = useContractNegotiationStore();

      await store.fetchNewNegotiationStatus();

      expect(mockFetchContractNegotiationStatus).not.toHaveBeenCalled();
    });
  });

  describe('initiateNegotiation', () => {
    it('should start negotiation when negotiation data is available', async () => {
      const store = useContractNegotiationStore();

      mockStartContractNegotiation.mockResolvedValue({
        data: { value: { contractNegotiationId: 'new-negotiation-123' } },
        error: { value: null },
      });

      await store.initiateNegotiation();

      expect(mockStartContractNegotiation).toHaveBeenCalledWith({
        contractOfferId: 'contract-123',
        providerEndpoint: 'https://provider.com',
        consumerEndpoint: 'https://consumer.com',
      });
      expect(store.negotiationId).toBe('new-negotiation-123');
    });

    it('should handle API errors when starting negotiation', async () => {
      const store = useContractNegotiationStore();

      mockStartContractNegotiation.mockResolvedValue({
        data: { value: null },
        error: { value: mockError },
      });

      await store.initiateNegotiation();

      expect(store.negotiationStatusError).toEqual(mockError);
    });

    it('should not start negotiation when negotiation data is null', async () => {
      const store = useContractNegotiationStore();

      // Mock the utility to return null
      const { getContractNegotiationData } = await import('@/util/contractNegotiation');
      vi.mocked(getContractNegotiationData).mockReturnValueOnce(null);

      await store.initiateNegotiation();

      expect(mockStartContractNegotiation).not.toHaveBeenCalled();
    });
  });

  describe('resetNegotiationState', () => {
    it('should reset all negotiation state to initial values', () => {
      const store = useContractNegotiationStore();

      // Set some values first
      store.setNegotiationId('test-id');
      store.setNegotiationStatus(mockNegotiationStatus);
      store.negotiationStatusError = mockError;

      store.resetNegotiationState();

      expect(store.negotiationId).toBeNull();
      expect(store.negotiationStatus).toBeNull();
      expect(store.negotiationStatusError).toBeNull();
    });
  });

  describe('store interface', () => {
    it('should return all expected properties and methods', () => {
      const store = useContractNegotiationStore();

      expect(store).toHaveProperty('isEligible');
      expect(store).toHaveProperty('negotiationData');
      expect(store).toHaveProperty('negotiationId');
      expect(store).toHaveProperty('setNegotiationId');
      expect(store).toHaveProperty('negotiationStatus');
      expect(store).toHaveProperty('setNegotiationStatus');
      expect(store).toHaveProperty('negotiationStatusError');
      expect(store).toHaveProperty('isNegotiationFinalized');
      expect(store).toHaveProperty('isNegotiationTerminated');
      expect(store).toHaveProperty('isNegotiationEnded');
      expect(store).toHaveProperty('fetchNewNegotiationStatus');
      expect(store).toHaveProperty('initiateNegotiation');
      expect(store).toHaveProperty('resetNegotiationState');
      expect(store).toHaveProperty('negotiationReloadInterval');
      expect(store).toHaveProperty('isNextNegotiationStatusLoading');

      // Check that methods are functions
      expect(typeof store.setNegotiationId).toBe('function');
      expect(typeof store.setNegotiationStatus).toBe('function');
      expect(typeof store.fetchNewNegotiationStatus).toBe('function');
      expect(typeof store.initiateNegotiation).toBe('function');
      expect(typeof store.resetNegotiationState).toBe('function');
    });
  });
});
