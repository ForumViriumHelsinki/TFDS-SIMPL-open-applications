import { safeServiceCall } from '@/services/apiErrorHandler';
import type { APIRoute } from 'astro';
import type { GetResourceAddressSchemaParams } from '@simpl/vue-components';

export const GET: APIRoute = async ({ cookies, params }) => {
  const requestParams: GetResourceAddressSchemaParams = {
    templateId: params.templateId as string,
  };

  return safeServiceCall(
    'resourceAddress',
    'getDestinationAddressSchema',
    requestParams,
    cookies.get('token')?.value
  );
};
