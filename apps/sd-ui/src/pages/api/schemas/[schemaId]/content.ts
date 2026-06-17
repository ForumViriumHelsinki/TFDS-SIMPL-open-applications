import { safeServiceCall } from '@/services/util/apiErrorHandler';
import type { APIRoute } from 'astro';
import { buildSchemaResponse } from '../_buildSchemaResponse';

export const GET: APIRoute = async ({ url, cookies, params }) => {
  const response = await safeServiceCall(
    'sdtooling',
    'fetchSchemaData',
    params.schemaId,
    cookies.get('token')?.value
  );

  if (!response.ok) {
    return response;
  }

  return buildSchemaResponse(await response.text(), url.searchParams.get('schemaUIType'));
};
