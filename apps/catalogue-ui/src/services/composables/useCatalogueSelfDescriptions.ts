import type {
  SearchAPISelfDescriptionDocument,
} from 'types/searchApi';
import { fetchLocalEndpoint } from '@/util/services';

export async function useCatalogueSelfDescriptions(selfDescriptionId: string) {
  return fetchLocalEndpoint<SearchAPISelfDescriptionDocument>(
    `/api/selfDescriptions/${selfDescriptionId}`,
    {
      errorIdentifier: 'SELF_DESCRIPTION_ERROR',
      apiName: 'search',
      defaultData: null,
      method: 'GET',
    }
  );
}
