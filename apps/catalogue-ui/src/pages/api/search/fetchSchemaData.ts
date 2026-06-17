import { safeServiceCall } from '@/services/apiErrorHandler';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url, cookies }) => {
  if (!url.searchParams.has('name')) {
    return new Response(
      JSON.stringify({
        keyErrorMessage: 'MISSING_SHAPE_NAME',
        response: {
          errorTitle: 'Missing shape name',
          errorDescription: 'The shape name is required to fetch the schema data',
        },
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
  const shapeName = url.searchParams.get('name')!;
  return safeServiceCall(
    'advancedSearch',
    'fetchSchemaData',
    shapeName,
    cookies.get('token')?.value
  );
};
