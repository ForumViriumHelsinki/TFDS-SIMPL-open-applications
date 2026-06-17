import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useCatalogueSelfDescriptions } from '@/services/composables/useCatalogueSelfDescriptions';
import { fetchLocalEndpoint } from '@/util/services';

// Mock the dependencies
vi.mock('@/util/services', () => ({
  fetchLocalEndpoint: vi.fn(),
}));

describe('useCatalogueSelfDescriptions', () => {
  const selfDescriptionId = 'test-self-description-id';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call fetchLocalEndpoint with correct parameters', async () => {
    const mockSelfDescription = {
      id: selfDescriptionId,
      title: 'Test Self Description',
      description: 'A test self description document',
      data: {
        properties: {},
      },
    };

    const mockResult = {
      data: ref(mockSelfDescription),
      error: ref(null),
      isLoading: ref(false),
    };

    vi.mocked(fetchLocalEndpoint).mockResolvedValue(mockResult);

    const result = await useCatalogueSelfDescriptions(selfDescriptionId);

    expect(fetchLocalEndpoint).toHaveBeenCalledWith(`/api/selfDescriptions/${selfDescriptionId}`, {
      errorIdentifier: 'SELF_DESCRIPTION_ERROR',
      apiName: 'search',
      defaultData: null,
      method: 'GET',
    });

    expect(result).toEqual(mockResult);
  });

  it('should handle empty self description ID', async () => {
    const emptySelfDescriptionId = '';
    const mockResult = {
      data: ref(null),
      error: ref(null),
      isLoading: ref(false),
    };

    vi.mocked(fetchLocalEndpoint).mockResolvedValue(mockResult);

    const result = await useCatalogueSelfDescriptions(emptySelfDescriptionId);

    expect(fetchLocalEndpoint).toHaveBeenCalledWith(
      `/api/selfDescriptions/${emptySelfDescriptionId}`,
      {
        errorIdentifier: 'SELF_DESCRIPTION_ERROR',
        apiName: 'search',
        defaultData: null,
        method: 'GET',
      }
    );

    expect(result).toEqual(mockResult);
  });

  it('should handle API errors', async () => {
    const mockError = {
      data: ref(null),
      error: ref({
        title: 'Self Description Error',
        description: 'Failed to fetch self description',
      }),
      isLoading: ref(false),
    };

    vi.mocked(fetchLocalEndpoint).mockResolvedValue(mockError);

    const result = await useCatalogueSelfDescriptions(selfDescriptionId);

    expect(result.error.value).toEqual({
      title: 'Self Description Error',
      description: 'Failed to fetch self description',
    });
    expect(result.data.value).toBeNull();
  });

  it('should encode special characters in self description ID', async () => {
    const specialSelfDescriptionId = 'test id with spaces & special chars';
    const mockResult = {
      data: ref(null),
      error: ref(null),
      isLoading: ref(false),
    };

    vi.mocked(fetchLocalEndpoint).mockResolvedValue(mockResult);

    await useCatalogueSelfDescriptions(specialSelfDescriptionId);

    expect(fetchLocalEndpoint).toHaveBeenCalledWith(
      `/api/selfDescriptions/${specialSelfDescriptionId}`,
      expect.any(Object)
    );
  });

  it('should return null as default data when no self description is found', async () => {
    const mockResult = {
      data: ref(null),
      error: ref(null),
      isLoading: ref(false),
    };

    vi.mocked(fetchLocalEndpoint).mockResolvedValue(mockResult);

    const result = await useCatalogueSelfDescriptions(selfDescriptionId);

    expect(fetchLocalEndpoint).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        defaultData: null,
      })
    );

    expect(result.data.value).toBeNull();
  });
});
