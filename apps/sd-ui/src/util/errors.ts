import { capitalizeFirstLetter } from '@/util/string';

export interface APIErrorDetails {
  errorTitle: string;
  errorDescription: string;
}

export interface APIErrorResponse {
  keyErrorMessage: string;
  response: APIErrorDetails;
}

export interface CatalogueError {
  timestamp: string;
  path: string;
  status: number;
  error: string;
  requestId: string;
}

export interface ProblemDetailsResponse {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  [key: string]: unknown;
}

export interface UIError {
  title: string;
  description: string;
  [key: string]: unknown;
}

export type PossibleUIError = UIError | null;

export const PROBLEM_DETAILS_CONTENT_TYPE = 'application/problem+json';

export function isProblemDetails(obj: unknown): obj is ProblemDetailsResponse {
  if (!obj || typeof obj !== 'object') return false;
  const problem = obj as Record<string, unknown>;

  return (
    (problem.type === undefined || typeof problem.type === 'string') &&
    (problem.title === undefined || typeof problem.title === 'string') &&
    (problem.status === undefined || typeof problem.status === 'number') &&
    (problem.detail === undefined || typeof problem.detail === 'string') &&
    (problem.instance === undefined || typeof problem.instance === 'string')
  );
}

export function isProblemDetailsResponse(response: Response): boolean {
  const contentType = response.headers.get('content-type');
  return contentType?.includes(PROBLEM_DETAILS_CONTENT_TYPE) ?? false;
}

export const isAPIError = (data: unknown): data is APIErrorResponse => {
  const possibleError: APIErrorResponse = data as APIErrorResponse;
  return (
    possibleError?.keyErrorMessage !== undefined &&
    possibleError?.response?.errorTitle !== undefined &&
    possibleError?.response?.errorDescription !== undefined
  );
};

export const createAPIError = (
  keyErrorMessage: string,
  title: string,
  description: string
): APIErrorResponse => ({
  keyErrorMessage: keyErrorMessage,
  response: { errorTitle: title, errorDescription: description },
});

export const isAnyError = (response: Response, data?: any): boolean => {
  return !response.ok || isProblemDetailsResponse(response) || isAPIError(data);
};

const formatErrorTitle = (title: string, apiName?: string): string => {
  return apiName ? `${capitalizeFirstLetter(apiName)} API: ${title}` : title;
};

const formatErrorDescription = (description: string, errorIdentifier?: string): string => {
  return errorIdentifier ? `${description} (${errorIdentifier})` : description;
};

export const createCustomUIError = (
  title: string,
  description: string,
  apiName?: string,
  errorIdentifier?: string,
  status?: number
): UIError => ({
  title: formatErrorTitle(title, apiName),
  description: formatErrorDescription(description, errorIdentifier),
  ...(status !== undefined && { status }),
});

export const transformSearchAPIErrorToUIError = (
  error: APIErrorResponse,
  apiName?: string,
  errorIdentifier?: string
): UIError => ({
  title: formatErrorTitle(error.response.errorTitle, apiName),
  description: formatErrorDescription(error.response.errorDescription, errorIdentifier),
});

export const transformProblemDetailsToUIError = (
  error: ProblemDetailsResponse,
  apiName?: string,
  errorIdentifier?: string
): UIError => {
  const title = error.title || 'An error occurred';
  const issues = error.issues as Array<{ detail?: string }> | undefined;
  const issueDetails = issues?.map((issue) => issue.detail).filter(Boolean).join('; ');
  const description = issueDetails || error.detail || 'Error details are not available';

  return {
    title: formatErrorTitle(title, apiName),
    description: formatErrorDescription(description, errorIdentifier),
    ...(error.status && { status: error.status }),
  };
};

export const transformAnyErrorToUIError = (
  error: APIErrorResponse | ProblemDetailsResponse | string,
  apiName?: string,
  errorIdentifier?: string,
  response?: Response
): UIError => {
  if (isAPIError(error)) {
    return transformSearchAPIErrorToUIError(error, apiName, errorIdentifier);
  } else if (isProblemDetails(error)) {
    return transformProblemDetailsToUIError(error, apiName, errorIdentifier);
  } else if (response?.status === 401 || response?.status === 403) {
    return createCustomUIError(
      'Unauthorized',
      'You are not authorized to access this resource.',
      apiName,
      errorIdentifier,
      response.status
    );
  } else if (typeof error === 'string') {
    return createCustomUIError('Error', error, apiName, errorIdentifier, response?.status);
  }
  return createCustomUIError(
    'Unknown Error',
    'An unknown error occurred while processing your request.',
    apiName,
    errorIdentifier
  );
};

export const createProblemDetailsError = (
  type = 'about:blank',
  title?: string,
  status?: number,
  detail?: string,
  instance?: string
): ProblemDetailsResponse => ({
  type,
  ...(title !== undefined && { title }),
  ...(status !== undefined && { status }),
  ...(detail !== undefined && { detail }),
  ...(instance !== undefined && { instance }),
});

export const createProblemDetailsResponse = (
  type?: string,
  title?: string,
  status?: number,
  detail?: string,
  instance?: string
): Response => {
  const problemDetails = createProblemDetailsError(type, title, status, detail, instance);

  return new Response(JSON.stringify(problemDetails), {
    status: status || 500,
    headers: {
      'Content-Type': PROBLEM_DETAILS_CONTENT_TYPE,
    },
  });
};

export const consoleLogError = (context: string, uiError: UIError) => {
  console.group(`🚨 ${context}`);
  console.error('Title:', uiError.title);
  console.error('Description:', uiError.description);
  console.error('Status:', uiError.status);
  console.error('Timestamp:', new Date().toISOString());
  console.groupEnd();
};
