import { safeServiceCall } from '@/services/util/apiErrorHandler';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ params, cookies }) => {
  const templateId = params.templateId;
  return safeServiceCall(
    'sdtooling',
    'getResourceAddressTemplateSchema',
    templateId,
    cookies.get('token')?.value
  );
};
