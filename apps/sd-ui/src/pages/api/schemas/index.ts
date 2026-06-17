import { safeServiceCall } from '@/services/util/apiErrorHandler';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ cookies }) => {
  return safeServiceCall('sdtooling', 'getSchemas', cookies.get('token')?.value);
};
