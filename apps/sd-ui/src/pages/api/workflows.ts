import { safeServiceCall } from '@/services/util/apiErrorHandler';
import { createProblemDetailsResponse } from '@/util/errors';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url, cookies }) => {
  const tag = url.searchParams.get('tag');
  if (!tag || tag === 'null') {
    return createProblemDetailsResponse(
      undefined,
      'Missing tag parameter',
      400,
      'The tag query parameter is required (e.g. ?tag=RD_DATA)',
      '/api/workflows'
    );
  }

  return safeServiceCall('assetOrchestrator', 'getWorkflows', tag, cookies.get('token')?.value);
};
