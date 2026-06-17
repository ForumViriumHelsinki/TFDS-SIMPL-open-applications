import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useAdvancedSearch } from '@/services/composables/useAdvancedSearch';
import { fetchLocalEndpoint } from '@/util/services';
import { transformSearchResultItems } from '@/util/search';

// Mock the dependencies
vi.mock('@/util/services', () => ({
  fetchLocalEndpoint: vi.fn(),
}));

vi.mock('@/util/search', () => ({
  transformSearchResultItems: vi.fn(),
}));

describe('useAdvancedSearch', () => {
  const mockSearchData = {
    category1: {
      field1: 'value1',
      field2: 'value2',
    },
    category2: {
      field3: 'value3',
    },
  };

  const mockApiResponse = [
    { id: '1', title: 'Result 1' },
    { id: '2', title: 'Result 2' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call fetchLocalEndpoint with correct parameters', async () => {
    const mockResult = {
      data: ref(mockApiResponse),
      error: ref(null),
      isLoading: ref(false),
    };

    vi.mocked(fetchLocalEndpoint).mockResolvedValue(mockResult);

    const result = await useAdvancedSearch(mockSearchData);

    expect(fetchLocalEndpoint).toHaveBeenCalledWith(
      '/api/selfDescriptions/advanced',
      {
        method: 'POST',
        body: mockSearchData,
        errorIdentifier: 'ADVANCED_SEARCH_ERROR',
        apiName: 'advanced search',
        defaultData: [],
      },
      transformSearchResultItems
    );

    expect(result).toEqual(mockResult);
  });

  it('should handle empty search data', async () => {
    const emptySearchData = {};
    const mockResult = {
      data: ref([]),
      error: ref(null),
      isLoading: ref(false),
    };

    vi.mocked(fetchLocalEndpoint).mockResolvedValue(mockResult);

    const result = await useAdvancedSearch(emptySearchData);

    expect(fetchLocalEndpoint).toHaveBeenCalledWith(
      '/api/selfDescriptions/advanced',
      {
        method: 'POST',
        body: emptySearchData,
        errorIdentifier: 'ADVANCED_SEARCH_ERROR',
        apiName: 'advanced search',
        defaultData: [],
      },
      transformSearchResultItems
    );

    expect(result).toEqual(mockResult);
  });

  it('should handle API errors', async () => {
    const mockError = {
      data: ref([]),
      error: ref({ title: 'Search Error', description: 'Search failed' }),
      isLoading: ref(false),
    };

    vi.mocked(fetchLocalEndpoint).mockResolvedValue(mockError);

    const result = await useAdvancedSearch(mockSearchData);

    expect(result.error.value).toEqual({ title: 'Search Error', description: 'Search failed' });
    expect(result.data.value).toEqual([]);
  });

  it('should pass transform function to fetchLocalEndpoint', async () => {
    const mockResult = {
      data: ref(mockApiResponse),
      error: ref(null),
      isLoading: ref(false),
    };

    vi.mocked(fetchLocalEndpoint).mockResolvedValue(mockResult);

    await useAdvancedSearch(mockSearchData);

    expect(fetchLocalEndpoint).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
      transformSearchResultItems
    );
  });
});
