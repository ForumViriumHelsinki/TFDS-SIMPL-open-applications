import { describe, it, vi, expect, beforeEach } from 'vitest';
import { GET } from '@/pages/api/resourceDescriptions/[resourceDescriptionId]/versions';

const mockSafeServiceCall = vi.fn();

vi.mock('@/services/util/apiErrorHandler', () => ({
  safeServiceCall: (...args: any[]) => mockSafeServiceCall(...args),
}));

const createMockContext = (resourceDescriptionId: string, token = 'test-token') => {
  return {
    params: { resourceDescriptionId },
    cookies: {
      get: vi.fn().mockReturnValue(token ? { value: token } : undefined),
    },
    url: new URL(`http://localhost/api/resourceDescriptions/${resourceDescriptionId}/versions`),
  } as any;
};

describe('GET /api/resourceDescriptions/[resourceDescriptionId]/versions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls safeServiceCall with the resource description id and token', async () => {
    const okResponse = new Response(JSON.stringify({ totalCount: 0, items: [] }), { status: 200 });
    mockSafeServiceCall.mockResolvedValue(okResponse);

    const result = await GET(createMockContext('rd-abc-123'));

    expect(mockSafeServiceCall).toHaveBeenCalledWith(
      'sdtooling',
      'getResourceDescriptionVersions',
      'rd-abc-123',
      1,
      10,
      'test-token'
    );
    expect(result).toBe(okResponse);
  });

  it('passes undefined token when the cookie is missing', async () => {
    const okResponse = new Response(JSON.stringify({ totalCount: 0, items: [] }), { status: 200 });
    mockSafeServiceCall.mockResolvedValue(okResponse);

    await GET(createMockContext('rd-xyz-456', ''));

    expect(mockSafeServiceCall).toHaveBeenCalledWith(
      'sdtooling',
      'getResourceDescriptionVersions',
      'rd-xyz-456',
      1,
      10,
      undefined
    );
  });

  it('returns the error response from safeServiceCall when it fails', async () => {
    const errorResponse = new Response('Not Found', { status: 404 });
    mockSafeServiceCall.mockResolvedValue(errorResponse);

    const result = await GET(createMockContext('rd-missing'));

    expect(result).toBe(errorResponse);
  });
});
