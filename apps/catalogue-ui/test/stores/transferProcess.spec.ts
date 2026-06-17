import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useTransferProcessStore } from '@/stores/transferProcess';
import { useContractNegotiationStore } from '@/stores/contractNegotiation';
import { useResourceSharingMethodStore } from '@/stores/resourceSharingMethod';

// Mock dependencies
vi.mock('@/services/composables/useTransferProcess', () => ({
  useTransferProcess: vi.fn(() => ({
    startTransferProcess: vi.fn(),
    fetchTransferProcessStatus: vi.fn(),
  })),
}));

vi.mock('@vueuse/core', () => ({
  useIntervalFn: vi.fn((callback, interval, options) => ({
    resume: vi.fn(),
    pause: vi.fn(),
    isActive: vi.fn(() => false),
  })),
}));

vi.mock('@/stores/contractNegotiation', () => ({
  useContractNegotiationStore: vi.fn(),
}));

vi.mock('@/stores/resourceSharingMethod', () => ({
  useResourceSharingMethodStore: vi.fn(),
}));

describe('transferProcess store', () => {
  let store: ReturnType<typeof useTransferProcessStore>;
  let mockContractNegotiationStore: any;
  let mockResourceSharingMethodStore: any;
  let mockStartTransferProcess: any;
  let mockFetchTransferProcessStatus: any;
  let mockUseIntervalFn: any;
  let mockInterval: any;

  beforeEach(async () => {
    setActivePinia(createPinia());

    // Setup mock stores
    mockContractNegotiationStore = {
      negotiationStatus: {
        contractAgreementId: 'contract-123',
        counterPartyAddress: 'http://provider.com',
      },
    };

    mockResourceSharingMethodStore = {
      resourceAddress: {
        type: 'HttpData',
        properties: { baseUrl: 'http://consumer.com' },
      },
      selectedTemplate: '1',
    };

    vi.mocked(useContractNegotiationStore).mockReturnValue(mockContractNegotiationStore);
    vi.mocked(useResourceSharingMethodStore).mockReturnValue(mockResourceSharingMethodStore);

    // Setup mock composables
    const { useTransferProcess } = await import('@/services/composables/useTransferProcess');
    mockStartTransferProcess = vi.fn();
    mockFetchTransferProcessStatus = vi.fn();
    vi.mocked(useTransferProcess).mockReturnValue({
      startTransferProcess: mockStartTransferProcess,
      fetchTransferProcessStatus: mockFetchTransferProcessStatus,
    });

    // Setup mock interval
    mockInterval = {
      resume: vi.fn(),
      pause: vi.fn(),
      isActive: vi.fn(() => false),
    };
    const { useIntervalFn } = await import('@vueuse/core');
    mockUseIntervalFn = vi.mocked(useIntervalFn);
    mockUseIntervalFn.mockReturnValue(mockInterval);

    store = useTransferProcessStore();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('transferRequestData computed', () => {
    it('should return transfer request data when all required fields are present', () => {
      expect(store.transferRequestData).toEqual({
        contractId: 'contract-123',
        providerEndpoint: 'http://provider.com',
        templateId: '1',
        dataDestination: {
          type: 'HttpData',
          properties: { baseUrl: 'http://consumer.com' },
        },
      });
    });

    it('should return null when contract agreement ID is missing', () => {
      mockContractNegotiationStore.negotiationStatus.contractAgreementId = null;

      expect(store.transferRequestData).toBeNull();
    });

    it('should return null when counter party address is missing', () => {
      mockContractNegotiationStore.negotiationStatus.counterPartyAddress = null;

      expect(store.transferRequestData).toBeNull();
    });

    it('should return null when resource address is missing', () => {
      mockResourceSharingMethodStore.resourceAddress = null;

      expect(store.transferRequestData).toBeNull();
    });

    it('should return null when negotiation status is missing', () => {
      mockContractNegotiationStore.negotiationStatus = null;

      expect(store.transferRequestData).toBeNull();
    });
  });

  describe('transferProcessId management', () => {
    it('should initialize with null transfer process ID', () => {
      expect(store.transferProcessId).toBeNull();
    });

    it('should set transfer process ID', () => {
      store.setTransferProcessId('transfer-123');
      expect(store.transferProcessId).toBe('transfer-123');
    });
  });

  describe('transfer process state computed properties', () => {
    it('should calculate isTransferProcessFinalized correctly for COMPLETED state', () => {
      store.transferProcessStatus = { state: 'COMPLETED' } as any;
      expect(store.isTransferProcessFinalized).toBe(true);
    });

    it('should calculate isTransferProcessFinalized correctly for DEPROVISIONED state', () => {
      store.transferProcessStatus = { state: 'DEPROVISIONED' } as any;
      expect(store.isTransferProcessFinalized).toBe(true);
    });

    it('should calculate isTransferProcessFinalized correctly for other states', () => {
      store.transferProcessStatus = { state: 'STARTED' } as any;
      expect(store.isTransferProcessFinalized).toBe(false);
    });

    it('should calculate isTransferProcessFinalized correctly when status is null', () => {
      store.transferProcessStatus = null;
      expect(store.isTransferProcessFinalized).toBe(false);
    });

    it('should calculate isTransferProcessTerminated correctly', () => {
      store.transferProcessStatus = { state: 'TERMINATED' } as any;
      expect(store.isTransferProcessTerminated).toBe(true);
    });

    it('should calculate isTransferProcessTerminated correctly for other states', () => {
      store.transferProcessStatus = { state: 'STARTED' } as any;
      expect(store.isTransferProcessTerminated).toBe(false);
    });

    it('should calculate isTransferProcessEnded when finalized', () => {
      store.transferProcessStatus = { state: 'COMPLETED' } as any;
      expect(store.isTransferProcessEnded).toBe(true);
    });

    it('should calculate isTransferProcessEnded when terminated', () => {
      store.transferProcessStatus = { state: 'TERMINATED' } as any;
      expect(store.isTransferProcessEnded).toBe(true);
    });

    it('should calculate isTransferProcessEnded when error exists', () => {
      store.transferProcessError = {
        title: 'Error',
        description: 'Error description',
      };
      expect(store.isTransferProcessEnded).toBe(true);
    });

    it('should calculate isTransferProcessEnded as false when no end conditions are met', () => {
      store.transferProcessStatus = { state: 'STARTED' } as any;
      store.transferProcessError = null;
      expect(store.isTransferProcessEnded).toBe(false);
    });
  });

  describe('fetchNewTransferProcessStatus', () => {
    beforeEach(() => {
      store.setTransferProcessId('transfer-123');
    });

    it('should return early when no transfer process ID is set', async () => {
      store.transferProcessId = null;
      await store.fetchNewTransferProcessStatus();
      expect(mockFetchTransferProcessStatus).not.toHaveBeenCalled();
    });

    it('should fetch transfer process status successfully', async () => {
      const mockResponse = { state: 'STARTED' };
      mockFetchTransferProcessStatus.mockResolvedValue({
        data: { value: mockResponse },
        error: { value: null },
      });

      await store.fetchNewTransferProcessStatus();

      expect(mockFetchTransferProcessStatus).toHaveBeenCalledWith('transfer-123');
      expect(store.transferProcessStatus).toEqual(mockResponse);
    });

    it('should handle transfer process status error', async () => {
      const mockError = { title: 'API Error' };
      mockFetchTransferProcessStatus.mockResolvedValue({
        data: { value: null },
        error: { value: mockError },
      });

      await store.fetchNewTransferProcessStatus();

      expect(store.transferProcessError).toEqual(mockError);
    });

    it('should set error when transfer process is terminated', async () => {
      const mockResponse = { state: 'TERMINATED' };
      mockFetchTransferProcessStatus.mockResolvedValue({
        data: { value: mockResponse },
        error: { value: null },
      });

      await store.fetchNewTransferProcessStatus();

      expect(store.transferProcessStatus).toEqual(mockResponse);
      expect(store.transferProcessError).toEqual({
        title: 'Transfer process has been terminated',
        description:
          'Please retry or exit the process. If the problem persists, contact the admin.',
      });
    });

    it('should manage loading state correctly', async () => {
      let loadingStateDuringCall = false;

      mockFetchTransferProcessStatus.mockImplementation(() => {
        loadingStateDuringCall = store.isNextTransferProcessStatusLoading;
        return Promise.resolve({
          data: { value: { state: 'STARTED' } },
          error: { value: null },
        });
      });

      expect(store.isNextTransferProcessStatusLoading).toBe(false);

      await store.fetchNewTransferProcessStatus();

      expect(loadingStateDuringCall).toBe(true);
      expect(store.isNextTransferProcessStatusLoading).toBe(false);
    });
  });

  describe('initiateTransferProcess', () => {
    it('should return early when transfer request data is null', async () => {
      // Make transferRequestData return null
      mockContractNegotiationStore.negotiationStatus = null;

      await store.initiateTransferProcess();

      expect(mockStartTransferProcess).not.toHaveBeenCalled();
      expect(store.transferProcessStartedAt).toBeNull();
    });

    it('should initiate transfer process successfully', async () => {
      const mockResponse = { transferProcessId: 'transfer-123' };
      mockStartTransferProcess.mockResolvedValue({
        data: { value: mockResponse },
        error: { value: null },
      });

      const beforeTime = new Date();
      await store.initiateTransferProcess();
      const afterTime = new Date();

      expect(mockStartTransferProcess).toHaveBeenCalledWith({
        contractId: 'contract-123',
        providerEndpoint: 'http://provider.com',
        templateId: '1',
        dataDestination: {
          type: 'HttpData',
          properties: { baseUrl: 'http://consumer.com' },
        },
      });
      expect(store.transferProcessId).toBe('transfer-123');
      expect(mockInterval.resume).toHaveBeenCalled();
      expect(store.transferProcessStartedAt).toBeInstanceOf(Date);
      expect(store.transferProcessStartedAt!.getTime()).toBeGreaterThanOrEqual(
        beforeTime.getTime()
      );
      expect(store.transferProcessStartedAt!.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    it('should handle transfer process initiation error', async () => {
      const mockError = { title: 'Start Transfer Error' };
      mockStartTransferProcess.mockResolvedValue({
        data: { value: null },
        error: { value: mockError },
      });

      await store.initiateTransferProcess();

      expect(store.transferProcessError).toEqual(mockError);
    });
  });

  describe('resetTransferState', () => {
    it('should reset all transfer state', () => {
      // Set some state first
      store.setTransferProcessId('transfer-123');
      store.transferProcessStatus = { state: 'STARTED' } as any;
      store.transferProcessError = {
        title: 'Error',
        description: 'Error description',
      };
      store.transferProcessStartedAt = new Date();

      store.resetTransferState();

      expect(store.transferProcessId).toBeNull();
      expect(store.transferProcessStatus).toBeNull();
      expect(store.transferProcessError).toBeNull();
      expect(store.transferProcessStartedAt).toBeNull();
      expect(mockInterval.pause).toHaveBeenCalled();
    });
  });

  describe('interval behavior', () => {
    it('should setup interval with correct parameters', () => {
      expect(mockUseIntervalFn).toHaveBeenCalledWith(expect.any(Function), 3000, {
        immediate: false,
      });
    });

    it('should pause interval when transfer process is ended', async () => {
      // Get the callback function passed to useIntervalFn
      const [intervalCallback] = mockUseIntervalFn.mock.calls[0];

      // Set up ended state
      store.transferProcessStatus = { state: 'COMPLETED' } as any;

      await intervalCallback();

      expect(mockInterval.pause).toHaveBeenCalled();
    });

    it('should fetch new status when not ended and not loading', async () => {
      // Get the callback function passed to useIntervalFn
      const [intervalCallback] = mockUseIntervalFn.mock.calls[0];

      // Set up running state
      store.setTransferProcessId('transfer-123');
      store.transferProcessStatus = { state: 'STARTED' } as any;
      store.transferProcessError = null;

      mockFetchTransferProcessStatus.mockResolvedValue({
        data: { value: { state: 'STARTED' } },
        error: { value: null },
      });

      await intervalCallback();

      expect(mockFetchTransferProcessStatus).toHaveBeenCalledWith('transfer-123');
    });

    it('should not fetch when already loading', async () => {
      // Get the callback function passed to useIntervalFn
      const [intervalCallback] = mockUseIntervalFn.mock.calls[0];

      // Set up running state but loading
      store.setTransferProcessId('transfer-123');
      store.transferProcessStatus = { state: 'STARTED' } as any;
      store.transferProcessError = null;

      // Manually set loading state
      store.isNextTransferProcessStatusLoading = true;

      await intervalCallback();

      expect(mockFetchTransferProcessStatus).not.toHaveBeenCalled();
    });
  });
});
