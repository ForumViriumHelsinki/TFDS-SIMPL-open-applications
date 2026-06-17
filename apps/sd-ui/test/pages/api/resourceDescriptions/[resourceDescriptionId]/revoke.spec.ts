import { describe, it, vi, expect, beforeEach } from 'vitest';
import { POST } from '@/pages/api/resourceDescriptions/[resourceDescriptionId]/revoke';

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
  } as any;
};

describe('POST /api/resourceDescriptions/[resourceDescriptionId]/revoke', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls safeServiceCall with the resource description id and token', async () => {
    const okResponse = new Response('ok', { status: 200 });
    mockSafeServiceCall.mockResolvedValue(okResponse);

    const result = await POST(createMockContext('rd-abc-123'));

    expect(mockSafeServiceCall).toHaveBeenCalledWith(
      'sdtooling',
      'revokeResourceDescription',
      'rd-abc-123',
      'test-token'
    );
    expect(result).toBe(okResponse);
  });

  it('passes undefined token when the cookie is missing', async () => {
    const okResponse = new Response('ok', { status: 200 });
    mockSafeServiceCall.mockResolvedValue(okResponse);

    await POST(createMockContext('rd-xyz-456', ''));

    expect(mockSafeServiceCall).toHaveBeenCalledWith(
      'sdtooling',
      'revokeResourceDescription',
      'rd-xyz-456',
      undefined
    );
  });

  it('returns the error response from safeServiceCall when it fails', async () => {
    const errorResponse = new Response('Not Found', { status: 404 });
    mockSafeServiceCall.mockResolvedValue(errorResponse);

    const result = await POST(createMockContext('rd-missing'));

    expect(result).toBe(errorResponse);
  });
});
