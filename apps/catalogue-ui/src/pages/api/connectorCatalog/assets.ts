import { safeServiceCall } from '@/services/apiErrorHandler';
import type { APIRoute } from 'astro';
import type { ContractNegotiationRequestData } from 'types/contracts';

export const POST: APIRoute = async ({ request, cookies }) => {
  const body = (await request.json()) as ContractNegotiationRequestData;
  return safeServiceCall(
    'contractConsumption',
    'getCatalogueOffers',
    body,
    cookies.get('token')?.value
  );
};
