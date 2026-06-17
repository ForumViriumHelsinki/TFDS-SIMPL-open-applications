import { safeServiceCall } from '@/services/apiErrorHandler';
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ cookies, request }) => {
  const searchData = await request.json();
  return safeServiceCall(
    'transferProcess',
    'startTransferProcess',
    searchData,
    cookies.get('token')?.value
  );
};
