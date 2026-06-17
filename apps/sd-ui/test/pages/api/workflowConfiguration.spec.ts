import { describe, it, vi, expect, beforeEach } from 'vitest';
import { GET } from '@/pages/api/workflowConfiguration';

const mockSafeServiceCall = vi.fn();
const mockCreateProblemDetailsResponse = vi.fn();

vi.mock('@/services/util/apiErrorHandler', () => ({
  safeServiceCall: (...args: any[]) => mockSafeServiceCall(...args),
}));

vi.mock('@/util/errors', () => ({
  createProblemDetailsResponse: (...args: any[]) => mockCreateProblemDetailsResponse(...args),
  PROBLEM_DETAILS_CONTENT_TYPE: 'application/problem+json',
}));

function createMockContext(
  params: Record<string, string | null>,
  token = 'test-token'
) {
  return {
    url: {
      searchParams: {
        get: (key: string) => params[key] ?? null,
      },
    },
    cookies: {
      get: vi.fn().mockReturnValue(token ? { value: token } : undefined),
    },
  } as any;
}

const ALL_PARAMS = {
  repositoryName: 'my-repo',
  codeLocation: 'user_code',
  jobName: 'data_pipeline',
};

describe('GET /api/workflowConfiguration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Validation: missing parameters ---

  it('returns 400 listing all three params when all are missing', async () => {
    const errorResponse = new Response('error', { status: 400 });
    mockCreateProblemDetailsResponse.mockReturnValue(errorResponse);

    const result = await GET(
      createMockContext({ repositoryName: null, codeLocation: null, jobName: null })
    );

    expect(mockCreateProblemDetailsResponse).toHaveBeenCalledWith(
      undefined,
      'Missing required query parameters',
      400,
      'The following query parameters are required: repositoryName, codeLocation, jobName',
      '/api/workflowsConfiguration'
    );
    expect(result).toBe(errorResponse);
    expect(mockSafeServiceCall).not.toHaveBeenCalled();
  });

  it('returns 400 listing only repositoryName when it is missing', async () => {
    const errorResponse = new Response('error', { status: 400 });
    mockCreateProblemDetailsResponse.mockReturnValue(errorResponse);

    await GET(
      createMockContext({ repositoryName: null, codeLocation: 'user_code', jobName: 'data_pipeline' })
    );

    expect(mockCreateProblemDetailsResponse).toHaveBeenCalledWith(
      undefined,
      'Missing required query parameters',
      400,
      'The following query parameters are required: repositoryName',
      '/api/workflowsConfiguration'
    );
    expect(mockSafeServiceCall).not.toHaveBeenCalled();
  });

  it('returns 400 listing only codeLocation when it is missing', async () => {
    const errorResponse = new Response('error', { status: 400 });
    mockCreateProblemDetailsResponse.mockReturnValue(errorResponse);

    await GET(
      createMockContext({ repositoryName: 'my-repo', codeLocation: null, jobName: 'data_pipeline' })
    );

    expect(mockCreateProblemDetailsResponse).toHaveBeenCalledWith(
      undefined,
      'Missing required query parameters',
      400,
      'The following query parameters are required: codeLocation',
      '/api/workflowsConfiguration'
    );
    expect(mockSafeServiceCall).not.toHaveBeenCalled();
  });

  it('returns 400 listing only jobName when it is missing', async () => {
    const errorResponse = new Response('error', { status: 400 });
    mockCreateProblemDetailsResponse.mockReturnValue(errorResponse);

    await GET(
      createMockContext({ repositoryName: 'my-repo', codeLocation: 'user_code', jobName: null })
    );

    expect(mockCreateProblemDetailsResponse).toHaveBeenCalledWith(
      undefined,
      'Missing required query parameters',
      400,
      'The following query parameters are required: jobName',
      '/api/workflowsConfiguration'
    );
    expect(mockSafeServiceCall).not.toHaveBeenCalled();
  });

  it('returns 400 listing codeLocation and jobName when both are missing', async () => {
    const errorResponse = new Response('error', { status: 400 });
    mockCreateProblemDetailsResponse.mockReturnValue(errorResponse);

    await GET(
      createMockContext({ repositoryName: 'my-repo', codeLocation: null, jobName: null })
    );

    expect(mockCreateProblemDetailsResponse).toHaveBeenCalledWith(
      undefined,
      'Missing required query parameters',
      400,
      'The following query parameters are required: codeLocation, jobName',
      '/api/workflowsConfiguration'
    );
  });

  it('treats a parameter value of "null" as missing', async () => {
    const errorResponse = new Response('error', { status: 400 });
    mockCreateProblemDetailsResponse.mockReturnValue(errorResponse);

    await GET(
      createMockContext({ repositoryName: 'null', codeLocation: 'user_code', jobName: 'data_pipeline' })
    );

    expect(mockCreateProblemDetailsResponse).toHaveBeenCalledWith(
      undefined,
      'Missing required query parameters',
      400,
      'The following query parameters are required: repositoryName',
      '/api/workflowsConfiguration'
    );
    expect(mockSafeServiceCall).not.toHaveBeenCalled();
  });

  // --- Happy path ---

  it('calls safeServiceCall with all params and token when all are valid', async () => {
    const okResponse = new Response('ok', { status: 200 });
    mockSafeServiceCall.mockResolvedValue(okResponse);

    const result = await GET(createMockContext(ALL_PARAMS));

    expect(mockSafeServiceCall).toHaveBeenCalledWith(
      'assetOrchestrator',
      'getWorkflowsConfiguration',
      'my-repo',
      'user_code',
      'data_pipeline',
      'test-token'
    );
    expect(result).toBe(okResponse);
    expect(mockCreateProblemDetailsResponse).not.toHaveBeenCalled();
  });

  it('passes undefined token when cookie is absent', async () => {
    const okResponse = new Response('ok', { status: 200 });
    mockSafeServiceCall.mockResolvedValue(okResponse);

    const ctx = {
      url: {
        searchParams: {
          get: (key: string) => ALL_PARAMS[key as keyof typeof ALL_PARAMS] ?? null,
        },
      },
      cookies: { get: vi.fn().mockReturnValue(undefined) },
    } as any;

    await GET(ctx);

    expect(mockSafeServiceCall).toHaveBeenCalledWith(
      'assetOrchestrator',
      'getWorkflowsConfiguration',
      'my-repo',
      'user_code',
      'data_pipeline',
      undefined
    );
  });

  it('forwards the response from safeServiceCall unchanged', async () => {
    const okResponse = new Response(
      JSON.stringify({ jobName: 'data_pipeline', defaultYamlConfig: 'ops: {}' }),
      { status: 200 }
    );
    mockSafeServiceCall.mockResolvedValue(okResponse);

    const result = await GET(createMockContext(ALL_PARAMS));

    expect(result).toBe(okResponse);
  });
});
