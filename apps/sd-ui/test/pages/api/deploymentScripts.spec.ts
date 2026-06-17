import { describe, it, vi, expect, beforeEach } from 'vitest';
import { GET } from '@/pages/api/deploymentScripts';

const mockSafeServiceCall = vi.fn();

vi.mock('@/services/util/apiErrorHandler', () => ({
  safeServiceCall: (...args: any[]) => mockSafeServiceCall(...args),
}));

const createMockContext = (token = 'test-token') => {
  return {
    cookies: {
      get: vi.fn().mockReturnValue(token ? { value: token } : undefined),
    },
  } as any;
};

describe('GET /api/deploymentScripts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls safeServiceCall with deploymentScript service and token', async () => {
    const okResponse = new Response('ok', { status: 200 });
    mockSafeServiceCall.mockResolvedValue(okResponse);

    const result = await GET(createMockContext());

    expect(mockSafeServiceCall).toHaveBeenCalledWith(
      'deploymentScript',
      'getDeploymentScripts',
      'test-token'
    );
    expect(result).toBe(okResponse);
  });

  it('passes undefined token when cookie is missing', async () => {
    const okResponse = new Response('ok', { status: 200 });
    mockSafeServiceCall.mockResolvedValue(okResponse);

    await GET(createMockContext(''));

    expect(mockSafeServiceCall).toHaveBeenCalledWith(
      'deploymentScript',
      'getDeploymentScripts',
      undefined
    );
  });

  it('forwards safeServiceCall response unchanged', async () => {
    const response = new Response(JSON.stringify({ scripts: [] }), { status: 200 });
    mockSafeServiceCall.mockResolvedValue(response);

    const result = await GET(createMockContext());

    expect(result).toBe(response);
  });
});
