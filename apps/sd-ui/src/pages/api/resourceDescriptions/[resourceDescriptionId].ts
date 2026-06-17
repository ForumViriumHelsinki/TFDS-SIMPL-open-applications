import { safeServiceCall } from '@/services/util/apiErrorHandler';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ params, cookies }) => {
  const resourceDescriptionId = params.resourceDescriptionId;
  return safeServiceCall(
    'sdtooling',
    'getResourceDescriptionDetails',
    resourceDescriptionId,
    cookies.get('token')?.value
  );
};
