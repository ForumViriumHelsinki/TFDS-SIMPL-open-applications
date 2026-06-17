import { safeServiceCall } from '@/services/util/apiErrorHandler';
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ params, cookies }) => {
  const resourceDescriptionId = params.resourceDescriptionId;
  return safeServiceCall(
    'sdtooling',
    'revokeResourceDescription',
    resourceDescriptionId,
    cookies.get('token')?.value
  );
};
