import { safeServiceCall } from '@/services/apiErrorHandler';
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, cookies }) => {
  const searchData = await request.json();
  return safeServiceCall(
    'search',
    'fetchAdvancedSearchResponse',
    searchData,
    cookies.get('token')?.value
  );
};
