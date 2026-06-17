import { safeServiceCall } from '@/services/apiErrorHandler';
import { createProblemDetailsResponse } from '@simpl/vue-components';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ cookies, params }) => {
  if (!params.transferProcessId) {
    return createProblemDetailsResponse(
      'urn:problem-type:simpl:transfer:missing-parameter',
      'Missing Transfer Process ID',
      400,
      'Transfer process ID is required in request'
    );
  }
  return safeServiceCall(
    'transferProcess',
    'getTransferProcessStatus',
    params.transferProcessId,
    cookies.get('token')?.value
  );
};
