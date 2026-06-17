import { ref } from 'vue';
import { fetchLocalEndpoint } from '@/util/services';
import type { PossibleUIError } from '@/util/errors';

export const useAccessPolicyActions = () => {
  const accessPolicyActions = ref<{ label: string; value: string }[]>([]);
  const fetchError = ref<PossibleUIError>(null);
  const isLoading = ref(false);

  const fetchLocalAccessPolicyActions = async () => {
    const {
      data,
      error: apiError,
      isLoading: loading,
    } = await fetchLocalEndpoint<
      { label: string; value: string }[],
      Record<string, string[]>,
      { label: string; value: string }[]
    >('/api/policies/actions', {
      method: 'GET',
      errorIdentifier: 'ACCESS_POLICY_ACTIONS_FETCH_ERROR',
      apiName: 'access policy actions fetch',
      defaultData: [],
    });
    accessPolicyActions.value = data.value;
    fetchError.value = apiError.value;
    isLoading.value = loading.value;
  };

  fetchLocalAccessPolicyActions();

  return {
    accessPolicyActions,
    error: fetchError,
    isLoading,
  };
};
