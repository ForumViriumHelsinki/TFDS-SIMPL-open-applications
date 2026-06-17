import { safeServiceCall } from '@/services/util/apiErrorHandler';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ params, url, cookies }) => {
  const sharingMethodId = params.sharingMethodId;
  const offeringType = url.searchParams.get('offeringType');
  return safeServiceCall(
    'sdtooling',
    'getResourceAddressTemplates',
    sharingMethodId,
    offeringType,
    cookies.get('token')?.value
  );
};
