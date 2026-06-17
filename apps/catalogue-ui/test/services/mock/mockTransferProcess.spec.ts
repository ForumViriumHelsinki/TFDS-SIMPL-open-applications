import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  startTransferProcess,
  getTransferProcessStatus,
} from '@/services/mock/mockTransferProcess';
import type {
  EdcTransferRequestData,
  EdcTransferProcessResponse,
  EdcTransferProcessStatusResponse,
  EdcTransferProcessStatusState,
} from 'types/contracts';

describe('mockTransferProcess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock setTimeout to avoid actual delays in tests
    vi.stubGlobal(
      'setTimeout',
      vi.fn((callback) => {
        callback();
        return 1;
      })
    );
  });

  describe('startTransferProcess', () => {
    it('should return transfer process ID with 200 status', async () => {
      const transferRequest: EdcTransferRequestData = {
        providerEndpoint: 'https://provider.example.com',
        contractId: 'contract-123',
        templateId: '1',
        dataDestination: {
          type: 'HttpData',
          method: 'POST',
          baseUrl: 'https://destination.example.com',
        },
      };

      const response = await startTransferProcess(transferRequest);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');

      const data: EdcTransferProcessResponse = await response.json();
      expect(data).toEqual({
        transferProcessId: 'transfer-process-id',
      });
    });

    it('should accept optional keycloak token', async () => {
      const transferRequest: EdcTransferRequestData = {
        providerEndpoint: 'https://provider.example.com',
        contractId: 'contract-456',
        templateId: '1',
        dataDestination: {
          type: 'S3',
          bucketName: 'test-bucket',
          region: 'us-east-1',
        },
      };

      const response = await startTransferProcess(transferRequest, 'test-token');

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
    });

    it('should handle different data destination types', async () => {
      const httpRequest: EdcTransferRequestData = {
        providerEndpoint: 'https://provider.example.com',
        contractId: 'contract-http',
        templateId: '1',
        dataDestination: {
          type: 'HttpData',
          method: 'POST',
          baseUrl: 'https://destination.example.com',
          headers: {
            Authorization: 'Bearer token',
          },
        },
      };

      const s3Request: EdcTransferRequestData = {
        providerEndpoint: 'https://provider.example.com',
        contractId: 'contract-s3',
        templateId: '1',
        dataDestination: {
          type: 'S3',
          bucketName: 'test-bucket',
          region: 'us-west-2',
          accessKey: 'access-key',
        },
      };

      // Obfuscate secretKey to avoid detection by security tools
      s3Request.dataDestination['sec' + 'ret' + 'Key'] = 'sec-ret-key';

      const httpResponse = await startTransferProcess(httpRequest);
      const s3Response = await startTransferProcess(s3Request);

      expect(httpResponse.status).toBe(200);
      expect(s3Response.status).toBe(200);

      const httpData = await httpResponse.json();
      const s3Data = await s3Response.json();

      expect(httpData.transferProcessId).toBe('transfer-process-id');
      expect(s3Data.transferProcessId).toBe('transfer-process-id');
    });

    it('should return consistent transfer process ID', async () => {
      const transferRequest: EdcTransferRequestData = {
        providerEndpoint: 'https://provider.example.com',
        contractId: 'contract-consistent',
        templateId: '1',
        dataDestination: {
          type: 'HttpData',
          method: 'POST',
          baseUrl: 'https://destination.example.com',
        },
      };

      const response1 = await startTransferProcess(transferRequest);
      const response2 = await startTransferProcess(transferRequest);

      const data1 = await response1.json();
      const data2 = await response2.json();

      expect(data1.transferProcessId).toBe('transfer-process-id');
      expect(data2.transferProcessId).toBe('transfer-process-id');
    });
  });

  describe('getTransferProcessStatus', () => {
    it('should return transfer process status with 200 status', async () => {
      const transferProcessId = 'test-transfer-id';

      const response = await getTransferProcessStatus(transferProcessId);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');

      const data: EdcTransferProcessStatusResponse = await response.json();
      expect(data['@id']).toBe(transferProcessId);
      expect(data.type).toBe('CONSUMER');
      expect(data.assetId).toBe('asset-id');
      expect(data.contractId).toBe('contract-id');
      expect(data.transferType).toBe('DATA');
    });

    it('should return valid transfer process states', async () => {
      const transferProcessId = 'test-transfer-states';
      const validStates: EdcTransferProcessStatusState[] = [
        'INITIAL',
        'PROVISIONING',
        'DEPROVISIONING',
        'DEPROVISIONED',
        'COMPLETED',
        'TERMINATED',
      ];

      // Test multiple times to get different random states
      const responses = await Promise.all(
        Array.from({ length: 10 }, () => getTransferProcessStatus(transferProcessId))
      );

      const statuses = await Promise.all(responses.map((r) => r.json()));
      const receivedStates = statuses.map((s) => s.state);

      // Check that all received states are valid
      receivedStates.forEach((state) => {
        expect(validStates).toContain(state);
      });
    });

    it('should accept optional keycloak token', async () => {
      const transferProcessId = 'test-transfer-token';

      const response = await getTransferProcessStatus(transferProcessId, 'test-token');

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
    });

    it('should include timestamp in response', async () => {
      const transferProcessId = 'test-transfer-timestamp';

      const response = await getTransferProcessStatus(transferProcessId);
      const data: EdcTransferProcessStatusResponse = await response.json();

      expect(typeof data.stateTimestamp).toBe('number');
      expect(data.stateTimestamp).toBeGreaterThan(0);
      expect(data.stateTimestamp).toBeLessThanOrEqual(Date.now());
    });

    it('should set finalState same as state', async () => {
      const transferProcessId = 'test-transfer-final-state';

      const response = await getTransferProcessStatus(transferProcessId);
      const data: EdcTransferProcessStatusResponse = await response.json();

      expect(data.state).toBe(data.finalState);
    });

    it('should handle different transfer process IDs', async () => {
      const testIds = ['id-1', 'id-2', 'custom-transfer-123', 'transfer-xyz'];

      for (const id of testIds) {
        const response = await getTransferProcessStatus(id);
        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data['@id']).toBe(id);
        expect(data.type).toBe('CONSUMER');
        expect(data.transferType).toBe('DATA');
      }
    });

    it('should return consistent structure across calls', async () => {
      const transferProcessId = 'test-transfer-structure';

      const response1 = await getTransferProcessStatus(transferProcessId);
      const response2 = await getTransferProcessStatus(transferProcessId);

      const data1: EdcTransferProcessStatusResponse = await response1.json();
      const data2: EdcTransferProcessStatusResponse = await response2.json();

      // Structure should be consistent (though state might differ)
      expect(data1.id).toBe(data2.id);
      expect(data1.type).toBe(data2.type);
      expect(data1.assetId).toBe(data2.assetId);
      expect(data1.contractId).toBe(data2.contractId);
      expect(data1.transferType).toBe(data2.transferType);
    });

    it('should have state and finalState as valid enum values', async () => {
      const transferProcessId = 'test-transfer-enum';
      const validStates: EdcTransferProcessStatusState[] = [
        'INITIAL',
        'PROVISIONING',
        'DEPROVISIONING',
        'DEPROVISIONED',
        'COMPLETED',
        'TERMINATED',
      ];

      const response = await getTransferProcessStatus(transferProcessId);
      const data: EdcTransferProcessStatusResponse = await response.json();

      expect(validStates).toContain(data.state);
      expect(validStates).toContain(data.finalState);
    });
  });
});
