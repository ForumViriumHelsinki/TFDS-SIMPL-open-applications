import { describe, it, vi, expect, beforeEach } from 'vitest';
import { GET } from '@/pages/api/schemas/[schemaId]/[version]/content';

const mockSafeServiceCall = vi.fn();
const mockBuildSchemaResponse = vi.fn();

vi.mock('@/services/util/apiErrorHandler', () => ({
  safeServiceCall: (...args: any[]) => mockSafeServiceCall(...args),
}));

vi.mock('@/pages/api/schemas/_buildSchemaResponse', () => ({
  buildSchemaResponse: (...args: any[]) => mockBuildSchemaResponse(...args),
}));

const createMockContext = (
  schemaId: string,
  version: string,
  schemaUIType?: string | null,
  token = 'test-token'
) => {
  const url = new URL(`http://localhost/api/schemas/${schemaId}/${version}/content`);
  if (schemaUIType != null) url.searchParams.set('schemaUIType', schemaUIType);
  return {
    url,
    params: { schemaId, version },
    cookies: {
      get: vi.fn().mockReturnValue(token ? { value: token } : undefined),
    },
  } as any;
};

describe('GET /api/schemas/[schemaId]/[version]/content', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls safeServiceCall with fetchVersionedSchemaData, schemaId, version, and token', async () => {
    mockSafeServiceCall.mockResolvedValue({ ok: true, text: vi.fn().mockResolvedValue('') });
    mockBuildSchemaResponse.mockResolvedValue(new Response('ok', { status: 200 }));

    await GET(createMockContext('service-offeringShape', '2.0.0', 'sdCreation'));

    expect(mockSafeServiceCall).toHaveBeenCalledWith(
      'sdtooling',
      'fetchVersionedSchemaData',
      'service-offeringShape',
      '2.0.0',
      'test-token'
    );
  });

  it('returns the error response immediately when safeServiceCall fails', async () => {
    const errorResponse = new Response('Not Found', { status: 404 });
    mockSafeServiceCall.mockResolvedValue(errorResponse);

    const result = await GET(createMockContext('bad-schema', '1.0.0'));

    expect(result).toBe(errorResponse);
    expect(mockBuildSchemaResponse).not.toHaveBeenCalled();
  });

  it('calls buildSchemaResponse with the response text and schemaUIType', async () => {
    const turtleContent = '@prefix ex: <http://example.com/> .';
    mockSafeServiceCall.mockResolvedValue({ ok: true, text: vi.fn().mockResolvedValue(turtleContent) });
    const builtResponse = new Response('{}', { status: 200 });
    mockBuildSchemaResponse.mockResolvedValue(builtResponse);

    const result = await GET(createMockContext('my-schema', '1.2.3', 'sdCreation'));

    expect(mockBuildSchemaResponse).toHaveBeenCalledWith(turtleContent, 'sdCreation');
    expect(result).toBe(builtResponse);
  });

  it('passes undefined token when cookie is missing', async () => {
    mockSafeServiceCall.mockResolvedValue({ ok: true, text: vi.fn().mockResolvedValue('') });
    mockBuildSchemaResponse.mockResolvedValue(new Response('ok'));

    await GET(createMockContext('my-schema', '1.0.0', null, ''));

    expect(mockSafeServiceCall).toHaveBeenCalledWith(
      'sdtooling',
      'fetchVersionedSchemaData',
      'my-schema',
      '1.0.0',
      undefined
    );
  });
});
