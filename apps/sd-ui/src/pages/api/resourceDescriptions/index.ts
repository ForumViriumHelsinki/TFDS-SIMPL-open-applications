import { safeServiceCall } from '@/services/util/apiErrorHandler';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ cookies, url }) => {
  const orderBy = url.searchParams.get('orderBy') as 'publicationDate' | 'resourceType';

  return safeServiceCall(
    'sdtooling',
    'getResourceDescriptions',
    cookies.get('token')?.value,
    orderBy
  );
};
