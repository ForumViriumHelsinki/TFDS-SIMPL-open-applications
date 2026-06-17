import type { NodeObject } from 'jsonld';
import { fetchLocalEndpoint } from '@/util/services';
import type { ResourceDescriptionPublishResponse } from '@/types/resourceDescription';

export function usePublish(
  selectedSchema: string,
  templateId: string,
  selfDescription: NodeObject
) {
  return fetchLocalEndpoint<ResourceDescriptionPublishResponse>('/api/publish', {
    method: 'POST',
    errorIdentifier: 'publish-self-description',
    apiName: 'Publish',
    body: {
      selectedSchema,
      templateId,
      selfDescription,
    },
  });
}
