import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useResourceDescriptions } from '@/services/composables/useResourceDescriptions';
import { fetchLocalEndpoint } from '@/util/services';

// Mock the dependencies
vi.mock('@/util/services', () => ({
  fetchLocalEndpoint: vi.fn(),
}));

describe('useResourceDescriptions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call fetchLocalEndpoint with correct parameters (default orderBy)', async () => {
    const { getResourceDescriptions } = useResourceDescriptions();

    const mockResult = {
      data: ref([]),
      error: ref(null),
      isLoading: ref(false),
    };

    vi.mocked(fetchLocalEndpoint).mockResolvedValue(mockResult);

    const result = await getResourceDescriptions();

    expect(fetchLocalEndpoint).toHaveBeenCalledWith(
      '/api/resourceDescriptions?orderBy=publicationDate',
      {
        method: 'GET',
        errorIdentifier: 'RESOURCE_DESCRIPTIONS_FETCH_ERROR',
        apiName: 'SD Tooling',
        defaultData: [],
      },
      expect.any(Function)
    );

    expect(result).toEqual(mockResult);
  });

  it('should call fetchLocalEndpoint with correct parameters (custom orderBy)', async () => {
    const { getResourceDescriptions } = useResourceDescriptions();

    const mockResult = {
      data: ref([]),
      error: ref(null),
      isLoading: ref(false),
    };

    vi.mocked(fetchLocalEndpoint).mockResolvedValue(mockResult);

    const result = await getResourceDescriptions('resourceType');

    expect(fetchLocalEndpoint).toHaveBeenCalledWith(
      '/api/resourceDescriptions?orderBy=resourceType',
      {
        method: 'GET',
        errorIdentifier: 'RESOURCE_DESCRIPTIONS_FETCH_ERROR',
        apiName: 'SD Tooling',
        defaultData: [],
      },
      expect.any(Function)
    );

    expect(result).toEqual(mockResult);
  });

  it('should transform data correctly using the callback', async () => {
    const { getResourceDescriptions } = useResourceDescriptions();

    const mockResult = {
      data: ref([]),
      error: ref(null),
      isLoading: ref(false),
    };

    vi.mocked(fetchLocalEndpoint).mockResolvedValue(mockResult);

    await getResourceDescriptions();

    // Get the transform callback passed to fetchLocalEndpoint
    const transformCallback = vi.mocked(fetchLocalEndpoint).mock.calls[0][2];

    // Verify callback exists
    expect(transformCallback).toBeDefined();
    expect(typeof transformCallback).toBe('function');

    if (transformCallback) {
      const rawData = {
        items: [{ key1: { id: '1', name: 'Item 1' } }, { key2: { id: '2', name: 'Item 2' } }],
        totalCount: 2,
      };

      const transformedData = transformCallback(rawData);

      expect(transformedData).toEqual({
        items: [
          { id: '1', name: 'Item 1' },
          { id: '2', name: 'Item 2' },
        ],
        totalCount: 2,
      });
    }
  });
});

describe('getResourceDescriptionVersions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call fetchLocalEndpoint with the correct URL and default page/pageSize', async () => {
    const mockResult = { data: ref(null), error: ref(null), isLoading: ref(false) };
    vi.mocked(fetchLocalEndpoint).mockResolvedValue(mockResult);

    const { getResourceDescriptionVersions } = useResourceDescriptions();
    await getResourceDescriptionVersions('rd-xyz');

    expect(fetchLocalEndpoint).toHaveBeenCalledWith(
      '/api/resourceDescriptions/rd-xyz/versions?page=1&pageSize=10',
      {
        method: 'GET',
        errorIdentifier: 'RESOURCE_DESCRIPTION_VERSIONS_FETCH_ERROR',
        apiName: 'SD Tooling',
        defaultData: [],
      },
      expect.any(Function)
    );
  });

  it('should encode the resourceDescriptionId in the URL', async () => {
    vi.mocked(fetchLocalEndpoint).mockResolvedValue({ data: ref(null), error: ref(null), isLoading: ref(false) });

    const { getResourceDescriptionVersions } = useResourceDescriptions();
    await getResourceDescriptionVersions('urn:some:id/with/slashes', 2, 5);

    const [url] = vi.mocked(fetchLocalEndpoint).mock.calls[0];
    expect(url).toContain(encodeURIComponent('urn:some:id/with/slashes'));
    expect(url).toContain('page=2');
    expect(url).toContain('pageSize=5');
  });

  it('should transform raw items via the callback', async () => {
    vi.mocked(fetchLocalEndpoint).mockResolvedValue({ data: ref(null), error: ref(null), isLoading: ref(false) });

    const { getResourceDescriptionVersions } = useResourceDescriptions();
    await getResourceDescriptionVersions('rd-abc');

    const transformCallback = vi.mocked(fetchLocalEndpoint).mock.calls[0][2];
    expect(typeof transformCallback).toBe('function');

    const raw = {
      items: [{ key1: { id: '1', name: 'v1' } }, { key2: { id: '2', name: 'v2' } }],
      totalCount: 2,
    };
    const result = transformCallback!(raw);
    expect(result).toEqual({
      items: [{ id: '1', name: 'v1' }, { id: '2', name: 'v2' }],
      totalCount: 2,
    });
  });
});

describe('revokeResourceDescriptionById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call fetchLocalEndpoint with POST and the revoke endpoint', async () => {
    const mockResult = { data: ref(null), error: ref(null), isLoading: ref(false) };
    vi.mocked(fetchLocalEndpoint).mockResolvedValue(mockResult);

    const { revokeResourceDescriptionById } = useResourceDescriptions();
    const result = await revokeResourceDescriptionById('rd-abc-123');

    expect(fetchLocalEndpoint).toHaveBeenCalledWith(
      '/api/resourceDescriptions/rd-abc-123/revoke',
      {
        method: 'POST',
        errorIdentifier: 'RESOURCE_DESCRIPTION_REVOKE_ERROR',
        apiName: 'SD Tooling',
        defaultData: null,
      }
    );
    expect(result).toBe(mockResult);
  });

  it('should include the resource description id in the URL', async () => {
    vi.mocked(fetchLocalEndpoint).mockResolvedValue({
      data: ref(null),
      error: ref(null),
      isLoading: ref(false),
    });

    const { revokeResourceDescriptionById } = useResourceDescriptions();
    await revokeResourceDescriptionById('unique-id-999');

    const [url] = vi.mocked(fetchLocalEndpoint).mock.calls[0];
    expect(url).toContain('unique-id-999');
    expect(url).toContain('/revoke');
  });
});
