import { describe, it, vi, expect, beforeEach } from 'vitest';
import { enhancedFetch } from '@/util/fetch';

vi.mock('@/util/fetch', () => ({
  enhancedFetch: vi.fn(),
}));

vi.mock('@/util/getEnv', () => ({
  getPublicEnv: () => ({
    PUBLIC_ASSET_ORCHESTRATOR_API_URL: 'http://test-orchestrator',
  }),
}));

// Import after mocks so the module-level getPublicEnv() call uses the mock
import { getWorkflows, getWorkflowsConfiguration } from '@/services/assetOrchestrator';

const mockFetch = vi.mocked(enhancedFetch);

const makeOkResponse = (body: object = {}) =>
  new Response(JSON.stringify(body), { status: 200 });

describe('assetOrchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue(makeOkResponse());
  });

  // --- getWorkflows ---

  describe('getWorkflows', () => {
    it('calls enhancedFetch with the correct URL including encoded tag', async () => {
      await getWorkflows('RD_DATA', 'my-token');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-orchestrator/v1/workflows?tag=RD_DATA',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('URL-encodes special characters in the tag', async () => {
      await getWorkflows('tag with spaces & symbols', 'my-token');

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain(encodeURIComponent('tag with spaces & symbols'));
    });

    it('sends Bearer token in the Authorization header', async () => {
      await getWorkflows('RD_DATA', 'my-token');

      const [, options] = mockFetch.mock.calls[0];
      expect((options?.headers as Record<string, string>)['Authorization']).toBe(
        'Bearer my-token'
      );
    });

    it('sends Accept: application/json header', async () => {
      await getWorkflows('RD_DATA', 'my-token');

      const [, options] = mockFetch.mock.calls[0];
      expect((options?.headers as Record<string, string>)['Accept']).toBe('application/json');
    });

    it('works when keycloakToken is undefined', async () => {
      await getWorkflows('RD_DATA');

      const [, options] = mockFetch.mock.calls[0];
      expect((options?.headers as Record<string, string>)['Authorization']).toBe(
        'Bearer undefined'
      );
    });

    it('returns the response from enhancedFetch', async () => {
      const mockResponse = makeOkResponse({ codeLocations: [], total: 0 });
      mockFetch.mockResolvedValue(mockResponse);

      const result = await getWorkflows('RD_DATA', 'my-token');

      expect(result).toBe(mockResponse);
    });
  });

  // --- getWorkflowsConfiguration ---

  describe('getWorkflowsConfiguration', () => {
    it('calls enhancedFetch with the correct path-based URL', async () => {
      await getWorkflowsConfiguration('my-repo', 'user_code', 'data_pipeline', 'my-token');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-orchestrator/v1/workflows/my-repo/user_code/data_pipeline/defaultConfig',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('URL-encodes special characters in repositoryName', async () => {
      await getWorkflowsConfiguration('repo/with/slashes', 'user_code', 'job', 'my-token');

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain(encodeURIComponent('repo/with/slashes'));
      expect(url).not.toContain('repo/with/slashes/user_code');
    });

    it('URL-encodes special characters in codeLocation', async () => {
      await getWorkflowsConfiguration('repo', 'code location', 'job', 'my-token');

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain(encodeURIComponent('code location'));
    });

    it('URL-encodes special characters in jobName', async () => {
      await getWorkflowsConfiguration('repo', 'code', 'job name & more', 'my-token');

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain(encodeURIComponent('job name & more'));
    });

    it('sends Bearer token in the Authorization header', async () => {
      await getWorkflowsConfiguration('repo', 'code', 'job', 'my-token');

      const [, options] = mockFetch.mock.calls[0];
      expect((options?.headers as Record<string, string>)['Authorization']).toBe(
        'Bearer my-token'
      );
    });

    it('sends Accept: application/json header', async () => {
      await getWorkflowsConfiguration('repo', 'code', 'job', 'my-token');

      const [, options] = mockFetch.mock.calls[0];
      expect((options?.headers as Record<string, string>)['Accept']).toBe('application/json');
    });

    it('works when keycloakToken is undefined', async () => {
      await getWorkflowsConfiguration('repo', 'code', 'job');

      const [, options] = mockFetch.mock.calls[0];
      expect((options?.headers as Record<string, string>)['Authorization']).toBe(
        'Bearer undefined'
      );
    });

    it('returns the response from enhancedFetch', async () => {
      const mockResponse = makeOkResponse({
        jobName: 'data_pipeline',
        repositoryName: 'my-repo',
        codeLocation: 'user_code',
        defaultYamlConfig: 'ops:\n  process_data:\n    config:\n      url: https://default.com',
      });
      mockFetch.mockResolvedValue(mockResponse);

      const result = await getWorkflowsConfiguration('my-repo', 'user_code', 'data_pipeline', 'my-token');

      expect(result).toBe(mockResponse);
    });

    it('appends /defaultConfig at the end of the URL', async () => {
      await getWorkflowsConfiguration('repo', 'code', 'job', 'my-token');

      const [url] = mockFetch.mock.calls[0];
      expect(url).toMatch(/\/defaultConfig$/);
    });
  });
});
