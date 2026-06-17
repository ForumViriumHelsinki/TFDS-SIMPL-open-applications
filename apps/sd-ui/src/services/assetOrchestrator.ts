import { getPublicEnv } from '@/util/getEnv';
import { enhancedFetch } from '@/util/fetch';

const { PUBLIC_ASSET_ORCHESTRATOR_API_URL } = getPublicEnv();

const getBaseUrl = (): string => {
  return `${PUBLIC_ASSET_ORCHESTRATOR_API_URL}/v1`;
};

export const getWorkflows = async (tag: string, keycloakToken?: string): Promise<Response> => {
  const url = `${getBaseUrl()}/workflows?tag=${encodeURIComponent(tag)}`;
  const response = await enhancedFetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${keycloakToken}`,
      Accept: 'application/json',
    },
  });
  return response;
};

export const getWorkflowsConfiguration = async (
  repositoryName: string,
  codeLocation: string,
  jobName: string,
  keycloakToken?: string
): Promise<Response> => {
  const url = `${getBaseUrl()}/workflows/${encodeURIComponent(repositoryName)}/${encodeURIComponent(codeLocation)}/${encodeURIComponent(jobName)}/defaultConfig`;
  const response = await enhancedFetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${keycloakToken}`,
      Accept: 'application/json',
    },
  });
  return response;
};
