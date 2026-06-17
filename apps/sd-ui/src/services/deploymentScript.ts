import { getPublicEnv } from '@/util/getEnv';
import { enhancedFetch } from '@/util/fetch';

const { PUBLIC_DEPLOYMENT_SCRIPT_UPLOAD_URL } = getPublicEnv();

export const getDeploymentScripts = async (keycloakToken?: string): Promise<Response> => {
  const response = await enhancedFetch(PUBLIC_DEPLOYMENT_SCRIPT_UPLOAD_URL, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${keycloakToken}`,
      Accept: 'application/json',
    },
  });
  return response;
};
