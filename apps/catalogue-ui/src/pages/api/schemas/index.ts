import { safeServiceCall } from '@/services/apiErrorHandler';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ cookies }) => {
  return safeServiceCall('advancedSearch', 'getSchemas', cookies.get('token')?.value);
};
