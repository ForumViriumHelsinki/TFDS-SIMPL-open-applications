import { safeServiceCall } from '@/services/util/apiErrorHandler';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ params, cookies }) => {
  const assetId = params.assetId;
  return safeServiceCall(
    'sdtooling',
    'getResourceAddressByAssetId',
    assetId,
    cookies.get('token')?.value
  );
};
