import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useTransferProcess } from '@/services/composables/useTransferProcess';
import { fetchLocalEndpoint } from '@/util/services';

// Mock the dependencies
vi.mock('@/util/services', () => ({
  fetchLocalEndpoint: vi.fn(),
}));

describe('useTransferProcess', () => {
  const mockTransferRequestData = {
    providerEndpoint: 'https://provider.example.com',
    contractId: 'test-contract-id',
    dataDestination: {
      type: 'HttpData',
      properties: {},
    },
  };

  const transferProcessId = 'test-transfer-process-id';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('startTransferProcess', () => {
    it('should call fetchLocalEndpoint with correct parameters for starting transfer', async () => {
      const mockTransferResponse = {
        transferProcessId: 'new-transfer-process-id',
        status: 'STARTED',
      };

      const mockResult = {
        data: ref(mockTransferResponse),
        error: ref(null),
        isLoading: ref(false),
      };

      vi.mocked(fetchLocalEndpoint).mockResolvedValue(mockResult);

      const { startTransferProcess } = useTransferProcess();
      const result = await startTransferProcess(mockTransferRequestData);

      expect(fetchLocalEndpoint).toHaveBeenCalledWith('/api/transfers', {
        method: 'POST',
        body: mockTransferRequestData,
        errorIdentifier: 'TRANSFER_PROCESS_ERROR',
        apiName: 'transfer process',
      });

      expect(result).toEqual(mockResult);
    });

    it('should handle errors when starting transfer process', async () => {
      const mockError = {
        data: ref(null),
        error: ref({ title: 'Transfer Error', description: 'Failed to start transfer process' }),
        isLoading: ref(false),
      };

      vi.mocked(fetchLocalEndpoint).mockResolvedValue(mockError);

      const { startTransferProcess } = useTransferProcess();
      const result = await startTransferProcess(mockTransferRequestData);

      expect(result.error.value).toEqual({
        title: 'Transfer Error',
        description: 'Failed to start transfer process',
      });
    });

    it('should handle invalid transfer request data', async () => {
      const invalidTransferData = {};
      const mockResult = {
        data: ref(null),
        error: ref(null),
        isLoading: ref(false),
      };

      vi.mocked(fetchLocalEndpoint).mockResolvedValue(mockResult);

      const { startTransferProcess } = useTransferProcess();
      await startTransferProcess(invalidTransferData as any);

      expect(fetchLocalEndpoint).toHaveBeenCalledWith('/api/transfers', {
        method: 'POST',
        body: invalidTransferData,
        errorIdentifier: 'TRANSFER_PROCESS_ERROR',
        apiName: 'transfer process',
      });
    });
  });

  describe('fetchTransferProcessStatus', () => {
    it('should call fetchLocalEndpoint with correct parameters for fetching status', async () => {
      const mockStatusResponse = {
        transferProcessId,
        status: 'COMPLETED',
        dataAddress: {
          endpoint: 'https://data.example.com/file.csv',
        },
      };

      const mockResult = {
        data: ref(mockStatusResponse),
        error: ref(null),
        isLoading: ref(false),
      };

      vi.mocked(fetchLocalEndpoint).mockResolvedValue(mockResult);

      const { fetchTransferProcessStatus } = useTransferProcess();
      const result = await fetchTransferProcessStatus(transferProcessId);

      expect(fetchLocalEndpoint).toHaveBeenCalledWith(`/api/transfers/${transferProcessId}`, {
        method: 'GET',
        errorIdentifier: 'TRANSFER_STATUS_ERROR',
        apiName: 'transfer',
      });

      expect(result).toEqual(mockResult);
    });

    it('should handle errors when fetching transfer status', async () => {
      const mockError = {
        data: ref(null),
        error: ref({ title: 'Status Error', description: 'Failed to fetch transfer status' }),
        isLoading: ref(false),
      };

      vi.mocked(fetchLocalEndpoint).mockResolvedValue(mockError);

      const { fetchTransferProcessStatus } = useTransferProcess();
      const result = await fetchTransferProcessStatus(transferProcessId);

      expect(result.error.value).toEqual({
        title: 'Status Error',
        description: 'Failed to fetch transfer status',
      });
    });

    it('should handle empty transfer process ID', async () => {
      const emptyTransferProcessId = '';
      const mockResult = {
        data: ref(null),
        error: ref(null),
        isLoading: ref(false),
      };

      vi.mocked(fetchLocalEndpoint).mockResolvedValue(mockResult);

      const { fetchTransferProcessStatus } = useTransferProcess();
      await fetchTransferProcessStatus(emptyTransferProcessId);

      expect(fetchLocalEndpoint).toHaveBeenCalledWith(
        `/api/transfers/${emptyTransferProcessId}`,
        expect.any(Object)
      );
    });

    it('should handle special characters in transfer process ID', async () => {
      const specialTransferProcessId = 'transfer-id-with-special-chars!@#$%';
      const mockResult = {
        data: ref(null),
        error: ref(null),
        isLoading: ref(false),
      };

      vi.mocked(fetchLocalEndpoint).mockResolvedValue(mockResult);

      const { fetchTransferProcessStatus } = useTransferProcess();
      await fetchTransferProcessStatus(specialTransferProcessId);

      expect(fetchLocalEndpoint).toHaveBeenCalledWith(
        `/api/transfers/${specialTransferProcessId}`,
        expect.any(Object)
      );
    });
  });

  it('should return both functions from the composable', () => {
    const composable = useTransferProcess();

    expect(composable).toHaveProperty('startTransferProcess');
    expect(composable).toHaveProperty('fetchTransferProcessStatus');
    expect(typeof composable.startTransferProcess).toBe('function');
    expect(typeof composable.fetchTransferProcessStatus).toBe('function');
  });

  it('should use correct API endpoints', async () => {
    const mockResult = {
      data: ref(null),
      error: ref(null),
      isLoading: ref(false),
    };

    vi.mocked(fetchLocalEndpoint).mockResolvedValue(mockResult);

    const { startTransferProcess, fetchTransferProcessStatus } = useTransferProcess();

    await startTransferProcess(mockTransferRequestData);
    expect(fetchLocalEndpoint).toHaveBeenCalledWith('/api/transfers', expect.any(Object));

    await fetchTransferProcessStatus(transferProcessId);
    expect(fetchLocalEndpoint).toHaveBeenCalledWith(
      `/api/transfers/${transferProcessId}`,
      expect.any(Object)
    );
  });

  it('should use correct HTTP methods', async () => {
    const mockResult = {
      data: ref(null),
      error: ref(null),
      isLoading: ref(false),
    };

    vi.mocked(fetchLocalEndpoint).mockResolvedValue(mockResult);

    const { startTransferProcess, fetchTransferProcessStatus } = useTransferProcess();

    await startTransferProcess(mockTransferRequestData);
    expect(fetchLocalEndpoint).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ method: 'POST' })
    );

    await fetchTransferProcessStatus(transferProcessId);
    expect(fetchLocalEndpoint).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ method: 'GET' })
    );
  });
});
