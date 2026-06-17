import { ref, shallowRef, type Ref } from 'vue';
import {
  createCustomUIError,
  isAnyError,
  transformAnyErrorToUIError,
  type UIError,
} from '@simpl/vue-components';

interface LocalEndpointData<ReturnType, DefaultDataType = null> {
  data: Ref<ReturnType | DefaultDataType>;
  error: Ref<UIError | null>;
  isLoading: Ref<boolean>;
}

const retrieveData = async (response: Response): Promise<any> => {
  let data;
  try {
    data = await response.json();
  } catch (e) {
    data = await response.text();
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
