import { safeServiceCall } from '@/services/util/apiErrorHandler';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ cookies }) => {
  return safeServiceCall('deploymentScript', 'getDeploymentScripts', cookies.get('token')?.value);
};
