import { safeServiceCall } from '@/services/apiErrorHandler';
import type { APIRoute } from 'astro';
import type {
  SharingMethodId,
  OfferingType,
} from 'types/resourceAddress';
import type { GetResourceAddressTemplatesParams } from '@simpl/vue-components';

export const GET: APIRoute = async ({ cookies, params, url }) => {
  const requestParams: GetResourceAddressTemplatesParams = {
    sharingMethodId: params.sharingMethodId as SharingMethodId,
    offeringType: url.searchParams.get('offeringType') as OfferingType,
  };

  return safeServiceCall(
    'resourceAddress',
    'getDestinationAddressTemplates',
    requestParams,
    cookies.get('token')?.value
  );
};
