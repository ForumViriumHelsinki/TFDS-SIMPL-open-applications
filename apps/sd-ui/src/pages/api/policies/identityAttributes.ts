import { safeServiceCall } from '@/services/util/apiErrorHandler';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ cookies }) => {
  const useMock = process.env.USE_MOCK_IDENTITY_ATTRIBUTES;
  if (useMock) {
    return new Response(
      JSON.stringify([
        { identifier: 'Consumer', code: 'CONSUMER' },
        { identifier: 'Data Provider', code: 'DATA_PROVIDER' },
        { identifier: 'Publisher', code: 'PUBLISHER' },
      ]),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  return safeServiceCall('sdtooling', 'getIdentityAttributes', cookies.get('token')?.value);
};
