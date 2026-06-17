import { describe, it, expect, vi, beforeEach } from 'vitest';
import { humanizeTransferProcessStatus } from '@/util/transferProcess';
import type { EdcTransferProcessStatusResponse } from 'types/contracts';

// Mock the dates utility
vi.mock('@/util/dates', () => ({
  formatDateTime: vi.fn(),
}));

// Import the mock after declaring it
import { formatDateTime } from '@/util/dates';
const mockFormatDateTime = vi.mocked(formatDateTime);

describe('transferProcess.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFormatDateTime.mockImplementation(
      (date) => `formatted-${date instanceof Date ? date.toISOString() : date}`
    );
  });

  describe('humanizeTransferProcessStatus', () => {
    it('formats transfer process status correctly with valid startedAt date', () => {
      const status: EdcTransferProcessStatusResponse = {
        '@id': 'transfer-123',
        transferType: 'HttpData-PULL',
        finalState: 'COMPLETED',
        assetId: 'asset-456',
        contractId: 'contract-789',
        type: 'TRANSFER_PROCESS',
        stateTimestamp: 1634567890000,
        state: 'COMPLETED',
      };

      const startedAt = new Date('2021-10-18T14:31:30Z');
      const result = humanizeTransferProcessStatus(status, startedAt);

      expect(result).toEqual({
        'Started at': 'formatted-2021-10-18T14:31:30.000Z',
        'Transfer Process ID': 'transfer-123',
        'Transfer State': 'COMPLETED',
        'Transfer Type': 'HttpData-PULL',
        'Last state update': 'formatted-2021-10-18T14:38:10.000Z',
      });
    });

    it('formats transfer process status with null startedAt date', () => {
      const status: EdcTransferProcessStatusResponse = {
        '@id': 'transfer-456',
        transferType: 'HttpData-PUSH',
        finalState: 'INITIAL',
        assetId: 'asset-123',
        contractId: 'contract-456',
        type: 'TRANSFER_PROCESS',
        stateTimestamp: 1634567890000,
        state: 'INITIAL',
      };

      const result = humanizeTransferProcessStatus(status, null);

      expect(result).toEqual({
        'Started at': 'N/A',
        'Transfer Process ID': 'transfer-456',
        'Transfer State': 'INITIAL',
        'Transfer Type': 'HttpData-PUSH',
        'Last state update': 'formatted-2021-10-18T14:38:10.000Z',
      });
    });

    it('handles different transfer types correctly', () => {
      const status: EdcTransferProcessStatusResponse = {
        '@id': 'transfer-789',
        transferType: 'S3-PUSH',
        finalState: 'PROVISIONING',
        assetId: 'asset-789',
        contractId: 'contract-123',
        type: 'TRANSFER_PROCESS',
        stateTimestamp: 1634567890000,
        state: 'PROVISIONING',
      };

      const startedAt = new Date('2021-10-18T10:00:00Z');
      const result = humanizeTransferProcessStatus(status, startedAt);

      expect(result).toEqual({
        'Started at': 'formatted-2021-10-18T10:00:00.000Z',
        'Transfer Process ID': 'transfer-789',
        'Transfer Type': 'S3-PUSH',
        'Transfer State': 'PROVISIONING',
        'Last state update': 'formatted-2021-10-18T14:38:10.000Z',
      });
    });

    it('handles empty transfer type', () => {
      const status: EdcTransferProcessStatusResponse = {
        '@id': 'transfer-empty',
        transferType: '',
        finalState: 'TERMINATED',
        assetId: 'asset-empty',
        contractId: 'contract-empty',
        type: 'TRANSFER_PROCESS',
        stateTimestamp: 1634567890000,
        state: 'TERMINATED',
      };

      const startedAt = new Date('2021-10-18T12:30:45Z');
      const result = humanizeTransferProcessStatus(status, startedAt);

      expect(result).toEqual({
        'Started at': 'formatted-2021-10-18T12:30:45.000Z',
        'Transfer Process ID': 'transfer-empty',
        'Transfer Type': '',
        'Transfer State': 'TERMINATED',
        'Last state update': 'formatted-2021-10-18T14:38:10.000Z',
      });
    });

    it('handles various final states correctly', () => {
      const testCases = [
        { state: 'INITIAL' as const, id: 'transfer-initial' },
        { state: 'PROVISIONING' as const, id: 'transfer-provisioning' },
        { state: 'DEPROVISIONED' as const, id: 'transfer-deprovisioned' },
        { state: 'DEPROVISIONING' as const, id: 'transfer-deprovisioning' },
        { state: 'COMPLETED' as const, id: 'transfer-completed' },
        { state: 'TERMINATED' as const, id: 'transfer-terminated' },
      ];

      testCases.forEach(({ state, id }) => {
        const status: EdcTransferProcessStatusResponse = {
          '@id': id,
          transferType: 'HttpData-PULL',
          finalState: state,
          assetId: 'asset-test',
          contractId: 'contract-test',
          type: 'TRANSFER_PROCESS',
          stateTimestamp: 1634567890000,
          state,
        };

        const startedAt = new Date('2021-10-18T14:31:30Z');
        const result = humanizeTransferProcessStatus(status, startedAt);

        expect(result).toEqual({
          'Started at': 'formatted-2021-10-18T14:31:30.000Z',
          'Transfer Process ID': id,
          'Transfer Type': 'HttpData-PULL',
          'Transfer State': state,
          'Last state update': 'formatted-2021-10-18T14:38:10.000Z',
        });
      });
    });

    it('calls formatDateTime with the correct date when startedAt is provided', () => {
      mockFormatDateTime.mockClear();

      const status: EdcTransferProcessStatusResponse = {
        '@id': 'transfer-test',
        transferType: 'HttpData-PULL',
        finalState: 'COMPLETED',
        assetId: 'asset-test',
        contractId: 'contract-test',
        type: 'TRANSFER_PROCESS',
        stateTimestamp: 1634567890000,
        state: 'COMPLETED',
      };

      const testDate = new Date('2021-10-18T14:31:30Z');
      humanizeTransferProcessStatus(status, testDate);

      expect(mockFormatDateTime).toHaveBeenCalledWith(testDate);
    });

    it('displays missing dates correctly', () => {
      mockFormatDateTime.mockClear();

      const status: EdcTransferProcessStatusResponse = {
        '@id': 'transfer-test',
        transferType: 'HttpData-PULL',
        finalState: 'COMPLETED',
        assetId: 'asset-test',
        contractId: 'contract-test',
        type: 'TRANSFER_PROCESS',
        stateTimestamp: 0,
        state: 'COMPLETED',
      };

      expect(humanizeTransferProcessStatus(status, null)).toEqual({
        'Started at': 'N/A',
        'Last state update': 'N/A',
        'Transfer Process ID': 'transfer-test',
        'Transfer State': 'COMPLETED',
        'Transfer Type': 'HttpData-PULL',
      });
    });
  });
});
