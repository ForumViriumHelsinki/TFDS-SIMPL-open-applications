import { safeServiceCall } from '@/services/util/apiErrorHandler';
import { createProblemDetailsResponse } from '@/util/errors';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url, cookies }) => {
  const repositoryName = url.searchParams.get('repositoryName');
  const codeLocation = url.searchParams.get('codeLocation');
  const jobName = url.searchParams.get('jobName');

  const missing = ['repositoryName', 'codeLocation', 'jobName'].filter(
    (p) => !url.searchParams.get(p) || url.searchParams.get(p) === 'null'
  );

  if (missing.length > 0) {
    return createProblemDetailsResponse(
      undefined,
      'Missing required query parameters',
      400,
      `The following query parameters are required: ${missing.join(', ')}`,
      '/api/workflowsConfiguration'
    );
  }

  return safeServiceCall(
    'assetOrchestrator',
    'getWorkflowsConfiguration',
    repositoryName,
    codeLocation,
    jobName,
    cookies.get('token')?.value
  );
};
