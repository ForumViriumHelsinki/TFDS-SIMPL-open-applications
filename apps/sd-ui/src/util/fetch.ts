/**
 * Enhanced fetch function that adds custom headers to track request origins.
 *
 * This wrapper around the native fetch API automatically adds an 'X-Original-URL'
 * header to the response, allowing tracking of the actual URL that
 * was called server-side.
 */

/**
 * Creates an enhanced response proxy that adds custom headers
 */
function createEnhancedResponse(response: Response, originalUrl: string): Response {
  const customHeaders = new Headers(response.headers);
  customHeaders.set('X-Original-URL', originalUrl);

  return new Proxy(response, {
    get(target, prop) {
      if (prop === 'headers') {
        return customHeaders;
      }

      // Handle clone method specially to preserve enhanced headers
      if (prop === 'clone') {
        return () => {
          const clonedResponse = target.clone();
          return createEnhancedResponse(clonedResponse, originalUrl);
        };
      }

      const value = target[prop as keyof Response];

      // Bind methods to the original response to maintain context
      if (typeof value === 'function') {
        return value.bind(target);
      }

      return value;
    },
  });
}

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

  return createEnhancedResponse(response, originalUrl);
};
