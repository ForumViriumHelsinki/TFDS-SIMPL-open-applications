import { describe, it, vi, expect, beforeEach } from 'vitest';
import { GET } from '@/pages/api/workflows';

const mockSafeServiceCall = vi.fn();
const mockCreateProblemDetailsResponse = vi.fn();

vi.mock('@/services/util/apiErrorHandler', () => ({
  safeServiceCall: (...args: any[]) => mockSafeServiceCall(...args),
}));

vi.mock('@/util/errors', () => ({
  createProblemDetailsResponse: (...args: any[]) => mockCreateProblemDetailsResponse(...args),
  PROBLEM_DETAILS_CONTENT_TYPE: 'application/problem+json',
}));

function createMockContext(tag: string | null, token = 'test-token') {
  return {
    url: {
      searchParams: {
        get: (key: string) => (key === 'tag' ? tag : null),
      },
    },
    cookies: {
      get: vi.fn().mockReturnValue(token ? { value: token } : undefined),
    },
  } as any;
}

describe('GET /api/workflows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when tag is missing (null)', async () => {
    const errorResponse = new Response('error', { status: 400 });
    mockCreateProblemDetailsResponse.mockReturnValue(errorResponse);

    const result = await GET(createMockContext(null));

    expect(mockCreateProblemDetailsResponse).toHaveBeenCalledWith(
      undefined,
      'Missing tag parameter',
      400,
      'The tag query parameter is required (e.g. ?tag=RD_DATA)',
      '/api/workflows'
    );
    expect(result).toBe(errorResponse);
    expect(mockSafeServiceCall).not.toHaveBeenCalled();
  });

  it('returns 400 when tag is the string "null"', async () => {
    const errorResponse = new Response('error', { status: 400 });
    mockCreateProblemDetailsResponse.mockReturnValue(errorResponse);

    const result = await GET(createMockContext('null'));

    expect(mockCreateProblemDetailsResponse).toHaveBeenCalledWith(
      undefined,
      'Missing tag parameter',
      400,
      'The tag query parameter is required (e.g. ?tag=RD_DATA)',
      '/api/workflows'
    );
    expect(result).toBe(errorResponse);
    expect(mockSafeServiceCall).not.toHaveBeenCalled();
  });

  it('calls safeServiceCall with tag and token when tag is valid', async () => {
    const okResponse = new Response('ok', { status: 200 });
    mockSafeServiceCall.mockResolvedValue(okResponse);

    const result = await GET(createMockContext('RD_DATA'));

    expect(mockSafeServiceCall).toHaveBeenCalledWith(
      'assetOrchestrator',
      'getWorkflows',
      'RD_DATA',
      'test-token'
    );
    expect(result).toBe(okResponse);
    expect(mockCreateProblemDetailsResponse).not.toHaveBeenCalled();
  });

  it('passes undefined token when cookie is absent', async () => {
    const okResponse = new Response('ok', { status: 200 });
    mockSafeServiceCall.mockResolvedValue(okResponse);

    const ctx = {
      url: { searchParams: { get: () => 'MY_TAG' } },
      cookies: { get: vi.fn().mockReturnValue(undefined) },
    } as any;

    await GET(ctx);

    expect(mockSafeServiceCall).toHaveBeenCalledWith(
      'assetOrchestrator',
      'getWorkflows',
      'MY_TAG',
      undefined
    );
  });

  it('forwards the response from safeServiceCall unchanged', async () => {
    const okResponse = new Response(JSON.stringify({ codeLocations: [] }), { status: 200 });
    mockSafeServiceCall.mockResolvedValue(okResponse);

    const result = await GET(createMockContext('SOME_TAG'));

    expect(result).toBe(okResponse);
  });
});
