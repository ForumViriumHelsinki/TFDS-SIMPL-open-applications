/**
 * Enhanced fetch function that adds custom headers to track request origins.
 *
 * This wrapper around the native fetch API automatically adds an 'X-Original-URL'
 * header to the response, allowing tracking of the actual URL that
 * was called server-side.
 */

export const enhancedFetch = async (
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> => {
  const response = await fetch(input, init);

  let originalUrl: string;
  if (typeof input === 'string') {
    originalUrl = input;
  } else if (input instanceof URL) {
    originalUrl = input.toString();
  } else {
    originalUrl = input.url;
  }

  const newHeaders = new Headers(response.headers);
  newHeaders.set('X-Original-URL', originalUrl);

  const hasNullBodyStatus = [101, 204, 205, 304].includes(response.status);
  return new Response(hasNullBodyStatus ? null : response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
};
