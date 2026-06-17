import { describe, it, vi, expect, beforeEach } from 'vitest';
import { POST } from '@/pages/api/publish';
import { PROBLEM_DETAILS_CONTENT_TYPE } from '@/util/errors';

const mockTransformData = vi.fn();
const mockSafeServiceCall = vi.fn();

vi.mock('@/util/schema/datatransformers', () => ({
  transformData: (...args: any[]) => mockTransformData(...args),
}));

vi.mock('@/services/util/apiErrorHandler', () => ({
  safeServiceCall: (...args: any[]) => mockSafeServiceCall(...args),
}));

function createMockContext(body: object) {
  return {
    request: {
      json: vi.fn().mockResolvedValue(body),
    } as unknown as Request,
    cookies: {
      get: vi.fn().mockReturnValue({ value: 'test-token' }),
    },
  } as any;
}

function createMockResponse(body: object, status: number, ok: boolean) {
  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue(body),
    headers: new Headers({ 'Content-Type': 'application/json' }),
  } as unknown as Response;
}

const defaultRequestBody = {
  selectedSchema: 'TestSchema',
  templateId: '1',
  selfDescription: { '@id': 'test-id', '@type': 'TestType' },
};

const transformedData = { transformed: true };

describe('POST /api/publish', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTransformData.mockResolvedValue(transformedData);
  });

  describe('finalizeSelfDescription step', () => {
    it('returns problem details with issues on finalize failure', async () => {
      const finalizeError = {
        type: 'urn:problem-type:simpl:remoteAssetOrchestratorError',
        title: 'Remote Asset Orchestrator Error',
        status: 400,
        detail: 'remote endpoint invocation error',
        issues: [{ detail: 'YAML configuration is invalid. Errors: [some error]' }],
      };

      mockSafeServiceCall.mockResolvedValueOnce(createMockResponse(finalizeError, 400, false));

      const ctx = createMockContext(defaultRequestBody);
      const response = await POST(ctx);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(response.headers.get('Content-Type')).toBe('application/problem+json');
      expect(body.title).toBe('Remote Asset Orchestrator Error');
      expect(body.detail).toBe('remote endpoint invocation error');
      expect(body.issues).toBeDefined();
      expect(body.issues[0].detail).toBe('YAML configuration is invalid. Errors: [some error]');
    });

    it('returns problem details without issues on finalize failure', async () => {
      const finalizeError = {
        type: 'urn:problem-type:simpl:validationError',
        title: 'Validation Error',
        status: 400,
        detail: 'The schemaId parameter is invalid',
      };

      mockSafeServiceCall.mockResolvedValueOnce(createMockResponse(finalizeError, 400, false));

      const ctx = createMockContext(defaultRequestBody);
      const response = await POST(ctx);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(response.headers.get('Content-Type')).toBe('application/problem+json');
      expect(body.title).toBe('Validation Error');
      expect(body.detail).toBe('The schemaId parameter is invalid');
      expect(body.issues).toBeUndefined();
    });

    it('calls safeServiceCall with correct arguments for finalize', async () => {
      const finalizeError = { title: 'Error', status: 500 };

      mockSafeServiceCall.mockResolvedValueOnce(createMockResponse(finalizeError, 500, false));

      const ctx = createMockContext(defaultRequestBody);
      await POST(ctx);

      expect(mockSafeServiceCall).toHaveBeenCalledWith(
        'sdtooling',
        'finalizeSelfDescription',
        defaultRequestBody.selectedSchema,
        defaultRequestBody.templateId,
        transformedData,
        'test-token'
      );
    });
  });

  describe('publishSelfDescriptionToCatalogue step', () => {
    it('returns problem details on publish failure', async () => {
      const finalizedData = { finalized: true };
      const publishError = {
        type: 'urn:problem-type:simpl:publishError',
        title: 'Publishing Error',
        status: 409,
        detail: 'Resource already published',
        issues: [{ detail: 'Duplicate resource ID' }],
      };

      mockSafeServiceCall
        .mockResolvedValueOnce(createMockResponse(finalizedData, 200, true))
        .mockResolvedValueOnce(createMockResponse(publishError, 409, false));

      const ctx = createMockContext(defaultRequestBody);
      const response = await POST(ctx);
      const body = await response.json();

      expect(response.status).toBe(409);
      expect(response.headers.get('Content-Type')).toBe('application/problem+json');
      expect(body.title).toBe('Publishing Error');
      expect(body.issues[0].detail).toBe('Duplicate resource ID');
    });

    it('calls safeServiceCall with finalized data for publish', async () => {
      const finalizedData = { finalized: true };
      const publishError = { title: 'Error', status: 500 };

      mockSafeServiceCall
        .mockResolvedValueOnce(createMockResponse(finalizedData, 200, true))
        .mockResolvedValueOnce(createMockResponse(publishError, 500, false));

      const ctx = createMockContext(defaultRequestBody);
      await POST(ctx);

      expect(mockSafeServiceCall).toHaveBeenCalledWith(
        'sdtooling',
        'publishSelfDescriptionToCatalogue',
        finalizedData,
        'test-token'
      );
    });
  });

  describe('success path', () => {
    it('returns published response when finalize and publish succeed', async () => {
      const finalizedData = { finalized: true };
      const publishedData = { id: 'new-resource-id', status: 'published' };

      mockSafeServiceCall
        .mockResolvedValueOnce(createMockResponse(finalizedData, 200, true))
        .mockResolvedValueOnce(createMockResponse(publishedData, 201, true));

      const ctx = createMockContext(defaultRequestBody);
      const response = await POST(ctx);
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.id).toBe('new-resource-id');
      expect(body.status).toBe('published');
    });

    it('passes transformed selfDescription to finalizeSelfDescription', async () => {
      const finalizedData = { finalized: true };
      const publishedData = { id: 'resource-id' };

      mockSafeServiceCall
        .mockResolvedValueOnce(createMockResponse(finalizedData, 200, true))
        .mockResolvedValueOnce(createMockResponse(publishedData, 200, true));

      const ctx = createMockContext(defaultRequestBody);
      await POST(ctx);

      expect(mockTransformData).toHaveBeenCalledWith(
        defaultRequestBody.selfDescription,
        'test-id',
        'test-token'
      );
      expect(mockSafeServiceCall).toHaveBeenCalledTimes(2);
    });
  });

  describe('error handling', () => {
    it('returns 500 problem details when transformData throws an Error', async () => {
      mockTransformData.mockRejectedValueOnce(new Error('Transform failed'));

      const ctx = createMockContext(defaultRequestBody);
      const response = await POST(ctx);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(response.headers.get('Content-Type')).toBe(PROBLEM_DETAILS_CONTENT_TYPE);
      expect(body.title).toBe('Unknown error');
      expect(body.detail).toBe('Transform failed');
    });

    it('returns 500 problem details when a non-Error is thrown', async () => {
      mockTransformData.mockRejectedValueOnce('unexpected failure');

      const ctx = createMockContext(defaultRequestBody);
      const response = await POST(ctx);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(response.headers.get('Content-Type')).toBe(PROBLEM_DETAILS_CONTENT_TYPE);
      expect(body.title).toBe('Unknown error');
      expect(body.detail).toBe('An unknown error occurred');
    });
  });
});
