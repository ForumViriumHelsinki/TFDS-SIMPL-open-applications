import { safeServiceCall } from '@/services/util/apiErrorHandler';
import { createProblemDetailsResponse, type ProblemDetailsResponse } from '@/util/errors';
import { transformData } from '@/util/schema/datatransformers';
import type { APIRoute } from 'astro';
import type { NodeObject } from 'jsonld';

export const POST: APIRoute = async ({ request, cookies }) => {
  const token = cookies.get('token')?.value;

  let data;
  try {
    data = (await request.json()) as {
      selectedSchema?: string;
      templateId?: string;
      selfDescription?: NodeObject;
    };
  } catch {
    return createProblemDetailsResponse(
      'invalid_request',
      'Invalid JSON',
      400,
      'The request body must be a valid JSON object'
    );
  }

  if (!data || typeof data !== 'object') {
    return createProblemDetailsResponse(
      'invalid_request',
      'Invalid request body',
      400,
      'Request body must be a valid JSON object'
    );
  }

  if (!data.selectedSchema || !data.templateId || !data.selfDescription) {
    return createProblemDetailsResponse(
      'invalid_request',
      'Missing required fields',
      400,
      'selectedSchema, templateId, and selfDescription are required fields'
    );
  }

  if (typeof data.selfDescription !== 'object' || !data.selfDescription['@id']) {
    return createProblemDetailsResponse(
      'invalid_request',
      'Invalid selfDescription',
      400,
      'selfDescription must be an object containing a valid @id property'
    );
  }

  try {
    const transformedData = await transformData(
      data.selfDescription,
      data.selfDescription['@id'] as string,
      token!
    );

    const finalizeResponse = await safeServiceCall(
      'sdtooling',
      'finalizeSelfDescription',
      data.selectedSchema,
      data.templateId,
      transformedData,
      token
    );

    const finalized = await finalizeResponse.json();

    if (!finalizeResponse.ok) {
      console.error('Failed to finalize self-description:', JSON.stringify(finalized));
      return new Response(JSON.stringify(finalized), {
        status: finalizeResponse.status,
        headers: { 'Content-Type': 'application/problem+json' },
      });
    }

    const publishResponse = await safeServiceCall(
      'sdtooling',
      'publishSelfDescriptionToCatalogue',
      finalized,
      token
    );
    const published = await publishResponse.json();

    if (!publishResponse.ok) {
      console.error('Failed to publish self-description:', JSON.stringify(published));
      return new Response(JSON.stringify(published), {
        status: publishResponse.status,
        headers: { 'Content-Type': 'application/problem+json' },
      });
    }

    return new Response(JSON.stringify(published), { status: publishResponse.status });
  } catch (error) {
    return createProblemDetailsResponse(
      'unknown_error',
      'Unknown error',
      500,
      error instanceof Error ? error.message : 'An unknown error occurred'
    );
  }
};
