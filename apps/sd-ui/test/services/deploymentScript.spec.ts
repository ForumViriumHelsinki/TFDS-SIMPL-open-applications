import { describe, it, vi, expect, beforeEach } from 'vitest';
import { enhancedFetch } from '@/util/fetch';

vi.mock('@/util/fetch', () => ({
  enhancedFetch: vi.fn(),
}));

vi.mock('@/util/getEnv', () => ({
  getPublicEnv: () => ({
    PUBLIC_DEPLOYMENT_SCRIPT_UPLOAD_URL: 'http://test-deployment-scripts',
  }),
}));

// Import after mocks so the module-level getPublicEnv() call uses the mock
import { getDeploymentScripts } from '@/services/deploymentScript';

const mockFetch = vi.mocked(enhancedFetch);

const makeOkResponse = (body: object = {}) =>
  new Response(JSON.stringify(body), { status: 200 });

describe('deploymentScript', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue(makeOkResponse());
  });

  describe('getDeploymentScripts', () => {
    it('calls enhancedFetch with the correct URL', async () => {
      await getDeploymentScripts('my-token');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-deployment-scripts',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('sends Bearer token in the Authorization header', async () => {
      await getDeploymentScripts('my-token');

      const [, options] = mockFetch.mock.calls[0];
      expect((options?.headers as Record<string, string>)['Authorization']).toBe(
        'Bearer my-token'
      );
    });

    it('sends Accept: application/json header', async () => {
      await getDeploymentScripts('my-token');

      const [, options] = mockFetch.mock.calls[0];
      expect((options?.headers as Record<string, string>)['Accept']).toBe('application/json');
    });

    it('works when keycloakToken is undefined', async () => {
      await getDeploymentScripts();

      const [, options] = mockFetch.mock.calls[0];
      expect((options?.headers as Record<string, string>)['Authorization']).toBe(
        'Bearer undefined'
      );
    });

    it('returns the response from enhancedFetch', async () => {
      const mockResponse = makeOkResponse({ scripts: [] });
      mockFetch.mockResolvedValue(mockResponse);

      const result = await getDeploymentScripts('my-token');

      expect(result).toBe(mockResponse);
    });
  });
});
