import { transformSearchResultItems } from '@/util/search';
import { fetchLocalEndpoint } from '@/util/services';
import type { SearchAPIResult, RawSearchAPIResults } from 'types/searchApi';

export async function useAdvancedSearch(searchData: Record<string, Record<string, unknown>>) {
  return fetchLocalEndpoint<SearchAPIResult[], RawSearchAPIResults, SearchAPIResult[]>(
    `/api/selfDescriptions/advanced`,
    {
      method: 'POST',
      body: searchData,
      errorIdentifier: 'ADVANCED_SEARCH_ERROR',
      apiName: 'advanced search',
      defaultData: [],
    },
    transformSearchResultItems
  );
}
