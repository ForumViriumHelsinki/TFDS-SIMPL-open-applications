import { safeServiceCall } from '@/services/apiErrorHandler';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url, cookies }) => {
  const searchString = url.searchParams.get('q');
  return safeServiceCall(
    'search',
    'fetchQuickSearchResponse',
    searchString,
    cookies.get('token')?.value
  );
};
