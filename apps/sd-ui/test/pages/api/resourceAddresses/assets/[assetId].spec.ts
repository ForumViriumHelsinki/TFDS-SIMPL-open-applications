import { describe, it, vi, expect, beforeEach } from 'vitest';
import { GET } from '@/pages/api/resourceAddresses/assets/[assetId]';

const mockSafeServiceCall = vi.fn();

vi.mock('@/services/util/apiErrorHandler', () => ({
  safeServiceCall: (...args: any[]) => mockSafeServiceCall(...args),
}));

const createMockContext = (assetId: string, token = 'test-token') => {
  return {
    params: { assetId },
    cookies: {
      get: vi.fn().mockReturnValue(token ? { value: token } : undefined),
    },
  } as any;
};

describe('GET /api/resourceAddresses/assets/[assetId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls safeServiceCall with assetId and token', async () => {
    const okResponse = new Response('ok', { status: 200 });
    mockSafeServiceCall.mockResolvedValue(okResponse);

    const result = await GET(createMockContext('asset-123'));

    expect(mockSafeServiceCall).toHaveBeenCalledWith(
      'sdtooling',
      'getResourceAddressByAssetId',
      'asset-123',
      'test-token'
    );
    expect(result).toBe(okResponse);
  });

  it('passes undefined token when cookie is missing', async () => {
    const okResponse = new Response('ok', { status: 200 });
    mockSafeServiceCall.mockResolvedValue(okResponse);

    await GET(createMockContext('asset-456', ''));

    expect(mockSafeServiceCall).toHaveBeenCalledWith(
      'sdtooling',
      'getResourceAddressByAssetId',
      'asset-456',
      undefined
    );
  });

  it('forwards safeServiceCall response unchanged', async () => {
    const response = new Response(JSON.stringify({ value: 'data' }), { status: 200 });
    mockSafeServiceCall.mockResolvedValue(response);

    const result = await GET(createMockContext('asset-789'));

    expect(result).toBe(response);
  });
});
