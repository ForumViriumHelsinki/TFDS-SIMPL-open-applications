import { transformSearchResultItems } from '@/util/search';
import { fetchLocalEndpoint } from '@/util/services';
import type { RawSearchAPIResults, SearchAPIResult } from 'types/searchApi';

export async function useQuickSearch(searchString: string) {
  const { data, error, isLoading } = await fetchLocalEndpoint<
    SearchAPIResult[],
    RawSearchAPIResults
  >(
    `/api/selfDescriptions?q=${encodeURIComponent(searchString)}`,
    {
      method: 'GET',
      errorIdentifier: 'QUICK_SEARCH_ERROR',
      apiName: 'quick search',
      defaultData: [],
    },
    transformSearchResultItems
  );

  return {
    data,
    error,
    isLoading,
  };
}
