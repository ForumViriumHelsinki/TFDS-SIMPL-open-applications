import type { PolicyIdentityAttribute } from '@/types/accessPolicy';
import type { PossibleUIError } from '@/util/errors';
import { fetchLocalEndpoint } from '@/util/services';
import { ref } from 'vue';

export const useIdentityAttributes = () => {
  const identityAttributes = ref<PolicyIdentityAttribute[]>([]);
  const fetchError = ref<PossibleUIError>(null);
  const fetchLoading = ref(false);

  const getIdentityAttributes = async () => {
    const { data, error, isLoading } = await fetchLocalEndpoint<
      PolicyIdentityAttribute[],
      Record<string, PolicyIdentityAttribute[]>,
      PolicyIdentityAttribute[]
    >('/api/policies/identityAttributes', {
      method: 'GET',
      errorIdentifier: 'IDENTITY_ATTRIBUTES_FETCH_ERROR',
      apiName: 'identity attributes fetch',
      defaultData: [],
    });
    fetchLoading.value = isLoading.value;
    identityAttributes.value = data.value;
    fetchError.value = error.value;
  };

  getIdentityAttributes();

  return { identityAttributes, error: fetchError, isLoading: fetchLoading };
};
