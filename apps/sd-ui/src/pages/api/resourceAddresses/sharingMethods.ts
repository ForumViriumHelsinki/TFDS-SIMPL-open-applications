import { safeServiceCall } from '@/services/util/apiErrorHandler';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url, cookies }) => {
  const offeringType = url.searchParams.get('offeringType');
  return safeServiceCall(
    'sdtooling',
    'getResourceAddressSharingMethods',
    offeringType,
    cookies.get('token')?.value
  );
};
