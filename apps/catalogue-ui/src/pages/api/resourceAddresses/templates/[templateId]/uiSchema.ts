import { safeServiceCall } from '@/services/apiErrorHandler';
import type { APIRoute } from 'astro';
import type { GetResourceAddressUiSchemaParams } from '@simpl/vue-components';

export const GET: APIRoute = async ({ cookies, params }) => {
  const requestParams: GetResourceAddressUiSchemaParams = {
    templateId: params.templateId as string,
  };

  return safeServiceCall(
    'resourceAddress',
    'getDestinationAddressUiSchema',
    requestParams,
    cookies.get('token')?.value
  );
};
