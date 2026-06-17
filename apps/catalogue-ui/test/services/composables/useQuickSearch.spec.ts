import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useQuickSearch } from '@/services/composables/useQuickSearch';
import { fetchLocalEndpoint } from '@/util/services';
import { transformSearchResultItems } from '@/util/search';

// Mock the dependencies
vi.mock('@/util/services', () => ({
  fetchLocalEndpoint: vi.fn(),
}));

vi.mock('@/util/search', () => ({
  transformSearchResultItems: vi.fn(),
}));

describe('useQuickSearch', () => {
  const searchString = 'test search query';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call fetchLocalEndpoint with correct parameters', async () => {
    const mockSearchResults = [
      { id: '1', title: 'Result 1', description: 'First result' },
      { id: '2', title: 'Result 2', description: 'Second result' },
    ];

    const mockResult = {
      data: ref(mockSearchResults),
      error: ref(null),
      isLoading: ref(false),
    };

    vi.mocked(fetchLocalEndpoint).mockResolvedValue(mockResult);

    const result = await useQuickSearch(searchString);

    expect(fetchLocalEndpoint).toHaveBeenCalledWith(
      `/api/selfDescriptions?q=${encodeURIComponent(searchString)}`,
      {
        method: 'GET',
        errorIdentifier: 'QUICK_SEARCH_ERROR',
        apiName: 'quick search',
        defaultData: [],
      },
      transformSearchResultItems
    );

    expect(result.data).toEqual(mockResult.data);
    expect(result.error).toEqual(mockResult.error);
    expect(result.isLoading).toEqual(mockResult.isLoading);
  });

  it('should handle empty search string', async () => {
    const emptySearchString = '';
    const mockResult = {
      data: ref([]),
      error: ref(null),
      isLoading: ref(false),
    };

    vi.mocked(fetchLocalEndpoint).mockResolvedValue(mockResult);

    const result = await useQuickSearch(emptySearchString);

    expect(fetchLocalEndpoint).toHaveBeenCalledWith(
      `/api/selfDescriptions?q=${emptySearchString}`,
      {
        method: 'GET',
        errorIdentifier: 'QUICK_SEARCH_ERROR',
        apiName: 'quick search',
        defaultData: [],
      },
      transformSearchResultItems
    );

    expect(result.data.value).toEqual([]);
  });

  it('should handle search string with special characters', async () => {
    const specialSearchString = 'test & search "query" with special chars!';
    const mockResult = {
      data: ref([]),
      error: ref(null),
      isLoading: ref(false),
    };

    vi.mocked(fetchLocalEndpoint).mockResolvedValue(mockResult);

    await useQuickSearch(specialSearchString);

    expect(fetchLocalEndpoint).toHaveBeenCalledWith(
      `/api/selfDescriptions?q=${encodeURIComponent(specialSearchString)}`,
      expect.any(Object),
      transformSearchResultItems
    );
  });

  it('should handle API errors', async () => {
    const mockError = {
      data: ref([]),
      error: ref({ title: 'Search Error', description: 'Quick search failed' }),
      isLoading: ref(false),
    };

    vi.mocked(fetchLocalEndpoint).mockResolvedValue(mockError);

    const result = await useQuickSearch(searchString);

    expect(result.error.value).toEqual({
      title: 'Search Error',
      description: 'Quick search failed',
    });
    expect(result.data.value).toEqual([]);
  });

  it('should pass transform function to fetchLocalEndpoint', async () => {
    const mockResult = {
      data: ref([]),
      error: ref(null),
      isLoading: ref(false),
    };

    vi.mocked(fetchLocalEndpoint).mockResolvedValue(mockResult);

    await useQuickSearch(searchString);

    expect(fetchLocalEndpoint).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
      transformSearchResultItems
    );
  });

  it('should return data, error, and isLoading properties', async () => {
    const mockResult = {
      data: ref([]),
      error: ref(null),
      isLoading: ref(true),
    };

    vi.mocked(fetchLocalEndpoint).mockResolvedValue(mockResult);

    const result = await useQuickSearch(searchString);

    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('error');
    expect(result).toHaveProperty('isLoading');
  });

  it('should use GET method for search request', async () => {
    const mockResult = {
      data: ref([]),
      error: ref(null),
      isLoading: ref(false),
    };

    vi.mocked(fetchLocalEndpoint).mockResolvedValue(mockResult);

    await useQuickSearch(searchString);

    expect(fetchLocalEndpoint).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'GET',
      }),
      expect.any(Function)
    );
  });
});
