import {
  type SearchAPIResults,
  type RawSearchAPIResults,
  type SearchAPIResult,
  type SearchAPISelfDescriptionDocument,
} from '@simpl/vue-components';
import { fetchLocalEndpoint } from '@/util/services';

export function useResourceDescriptions() {
  const getResourceDescriptions = (
    orderBy: 'publicationDate' | 'resourceType' = 'publicationDate'
  ) =>
    fetchLocalEndpoint<SearchAPIResults, RawSearchAPIResults>(
      `/api/resourceDescriptions?orderBy=${orderBy}`,
      {
        method: 'GET',
        errorIdentifier: 'RESOURCE_DESCRIPTIONS_FETCH_ERROR',
        apiName: 'SD Tooling',
        defaultData: [],
      },
      (data) => {
        return {
          items: data.items.map((item: SearchAPIResult) => Object.values(item)[0]),
          totalCount: data.totalCount,
        };
      }
    );

  const getResourceDescriptionById = (id: string) =>
    fetchLocalEndpoint<SearchAPISelfDescriptionDocument>(`/api/resourceDescriptions/${id}`, {
      method: 'GET',
      errorIdentifier: 'RESOURCE_DESCRIPTION_FETCH_ERROR',
      apiName: 'SD Tooling',
      defaultData: null,
    });

  const getResourceDescriptionVersions = (
    resourceDescriptionId: string,
    page: number = 1,
    pageSize: number = 10
  ) =>
    fetchLocalEndpoint<SearchAPIResults, RawSearchAPIResults>(
      `/api/resourceDescriptions/${encodeURIComponent(resourceDescriptionId)}/versions?page=${page}&pageSize=${pageSize}`,
      {
        method: 'GET',
        errorIdentifier: 'RESOURCE_DESCRIPTION_VERSIONS_FETCH_ERROR',
        apiName: 'SD Tooling',
        defaultData: [],
      },
      (data) => ({
        items: data.items.map((item: SearchAPIResult) => Object.values(item)[0]),
        totalCount: data.totalCount,
      })
    );

  const revokeResourceDescriptionById = (id: string) =>
    fetchLocalEndpoint<null>(`/api/resourceDescriptions/${id}/revoke`, {
      method: 'POST',
      errorIdentifier: 'RESOURCE_DESCRIPTION_REVOKE_ERROR',
      apiName: 'SD Tooling',
      defaultData: null,
    });

  return {
    getResourceDescriptions,
    getResourceDescriptionById,
    getResourceDescriptionVersions,
    revokeResourceDescriptionById,
  };
}
