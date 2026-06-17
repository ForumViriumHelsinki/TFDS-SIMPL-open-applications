import { ref, shallowRef, type Ref } from 'vue';
import {
  createCustomUIError,
  isAnyError,
  transformAnyErrorToUIError,
  type UIError,
} from './errors';

export interface LocalEndpointData<ReturnType, DefaultDataType = null> {
  data: Ref<ReturnType | DefaultDataType>;
  error: Ref<UIError | null>;
  isLoading: Ref<boolean>;
}

/**
 * @param url url with special pattern to replace any param
 * example: '/api/resourceAddress/{sharingMethod}/template?offeringType={offeringType}
 * @param params a collections of params, where the key is equal to one of the params in the url pattern
 * @throws Error if any required parameter is missing from params
 */
export const buildEndpointUrl = (url: string, params: Record<string, string>) => {
  // Extract all parameter names from the URL
  const urlParams = url.match(/\{([^}]+)\}/g)?.map((match) => match.slice(1, -1)) || [];

  // Check for missing parameters
  const missingParams = urlParams.filter(
    (param) => params[param] === undefined || params[param] === null || params[param] === ''
  );

  if (missingParams.length > 0) {
    throw new Error(`Missing required URL parameters: ${missingParams.join(', ')}`);
  }

  // Replace parameters with URL-encoded values
  return url.replace(/\{([^}]+)\}/g, (match, paramName) => {
    return encodeURIComponent(params[paramName]);
  });
};

const retrieveData = async (response: Response): Promise<any> => {
  let data;
  try {
    data = await response.json();
  } catch (e) {
    if (!response.bodyUsed) {
      data = await response.text();
    }
  }
  return data;
};

export async function fetchLocalEndpoint<
  ReturnType,
  ResponseType = ReturnType,
  DefaultDataType = ReturnType | null,
  RequestBodyType = any,
>(
  endpoint: string,
  {
    method,
    errorIdentifier,
    apiName,
    body,
    defaultData = null as DefaultDataType,
  }: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    errorIdentifier: string;
    apiName: string;
    body?: RequestBodyType;
    defaultData?: DefaultDataType;
  },
  dataTransformCallback?: (data: ResponseType) => ReturnType
): Promise<LocalEndpointData<ReturnType, DefaultDataType>> {
  const data = shallowRef<DefaultDataType>(defaultData);
  const error = ref<UIError | null>(null);
  const isLoading = ref<boolean>(false);

  isLoading.value = true;

  try {
    const response = await fetch(endpoint, {
      body: body ? JSON.stringify(body) : undefined,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const rawData = await retrieveData(response);

    if (isAnyError(response, rawData)) {
      error.value = transformAnyErrorToUIError(rawData, apiName, errorIdentifier, response);
      data.value = defaultData;
    } else {
      data.value = dataTransformCallback ? dataTransformCallback(rawData) : rawData;
      error.value = null;
    }
  } catch (err) {
    error.value = createCustomUIError(
      'An error occurred while fetching data',
      err instanceof Error ? err.message : String(err),
      apiName,
      errorIdentifier
    );

    data.value = defaultData;
  } finally {
    isLoading.value = false;
  }

  return {
    data,
    error,
    isLoading,
  };
}
