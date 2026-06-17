import { useSessionStorage } from '@vueuse/core';
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useTemporarySuccessMessageStore = defineStore('temporarySuccessMessage', () => {
  const successId = useSessionStorage('temporarySuccessId', null as string | null);
  const successOfferingName = useSessionStorage(
    'temporarySuccessOfferingName',
    null as string | null
  );
  const successAction = useSessionStorage<'published' | 'revoked' | null>(
    'temporarySuccessAction',
    null
  );
  const showSuccessMessage = ref<boolean>(!!successId.value && !!successOfferingName.value);

  const setSuccessDetails = (id: string, offeringName?: string, action: 'published' | 'revoked' = 'published') => {
    successId.value = id;
    successOfferingName.value = offeringName ?? '';
    successAction.value = action;
    showSuccessMessage.value = true;
  };

  const clearSuccessDetails = () => {
    successId.value = null;
    successOfferingName.value = null;
    successAction.value = null;
    showSuccessMessage.value = false;
  };

  return {
    successId,
    successOfferingName,
    successAction,
    showSuccessMessage,
    setSuccessDetails,
    clearSuccessDetails,
  };
});
