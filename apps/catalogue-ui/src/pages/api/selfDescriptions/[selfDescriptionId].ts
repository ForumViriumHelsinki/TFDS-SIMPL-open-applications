import { safeServiceCall } from '@/services/apiErrorHandler';
import { createProblemDetailsResponse } from '@simpl/vue-components';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ cookies, params }) => {
  if (!params.selfDescriptionId) {
    return createProblemDetailsResponse(
      'urn:problem-type:simpl:catalogue:missing-parameter',
      'Missing Self Description ID',
      400,
      'Self description ID is required in request'
    );
  }
  return safeServiceCall(
    'search',
    'getSelfDescriptionById',
    params.selfDescriptionId,
    cookies.get('token')?.value
  );
};
