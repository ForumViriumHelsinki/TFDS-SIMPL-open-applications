import { safeServiceCall } from '@/services/apiErrorHandler';
import { createProblemDetailsResponse } from '@simpl/vue-components';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ cookies, params }) => {
  if (!params.negotiationId) {
    return createProblemDetailsResponse(
      'urn:problem-type:simpl:contract-negotiation:missing-parameter',
      'Missing Negotiation ID',
      400,
      'Negotiation ID is required in request'
    );
  }
  return safeServiceCall(
    'contractConsumption',
    'getContractNegotiationStatus',
    params.negotiationId,
    cookies.get('token')?.value
  );
};
