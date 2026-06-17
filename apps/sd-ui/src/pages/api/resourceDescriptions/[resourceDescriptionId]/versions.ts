import { safeServiceCall } from '@/services/util/apiErrorHandler';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ params, cookies, url }) => {
  const resourceDescriptionId = params.resourceDescriptionId;
  const page = Number(url.searchParams.get('page') ?? '1');
  const pageSize = Number(url.searchParams.get('pageSize') ?? '10');
  return safeServiceCall(
    'sdtooling',
    'getResourceDescriptionVersions',
    resourceDescriptionId,
    page,
    pageSize,
    cookies.get('token')?.value
  );
};
