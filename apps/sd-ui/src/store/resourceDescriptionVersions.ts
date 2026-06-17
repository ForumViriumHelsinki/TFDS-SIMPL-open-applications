import { ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { useResourceDescriptions } from '@/services/composables/useResourceDescriptions';
import {
  getResourceDescriptionSummaryFromResult,
  type ExtendedSearchAPIResult,
  type PossibleUIError,
} from '@simpl/vue-components';

export const useResourceDescriptionVersionsStore = defineStore(
  'resourceDescriptionVersions',
  () => {
    const resourceDescriptionId = ref<string | null>(null);
    const versionsData = ref<{ totalCount: number; items: ExtendedSearchAPIResult[] } | null>(null);
    const versionsError = ref<PossibleUIError>(null);
    const currentPage = ref(1);
    const pageSize = ref(10);

    const { getResourceDescriptionVersions } = useResourceDescriptions();

    const getCardButton = (item: ExtendedSearchAPIResult) => ({
      href: `/resourceDescriptions/${getResourceDescriptionSummaryFromResult(item).id}?hideActions=true&returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`,
    });

    const initialize = (id: string) => {
      resourceDescriptionId.value = id;
    };

    const fetchVersions = async () => {
      const id = resourceDescriptionId.value;
      if (!id) return;
      const { data, error } = await getResourceDescriptionVersions(
        id,
        currentPage.value,
        pageSize.value
      );
      versionsError.value = error.value;
      if (data.value) {
        versionsData.value = data.value as { totalCount: number; items: ExtendedSearchAPIResult[] };
      }
    };

    watch(resourceDescriptionId, (id) => {
      if (!id) return;
      currentPage.value = 1;
      fetchVersions();
    });

    watch([currentPage, pageSize], () => {
      fetchVersions();
    });

    const setPage = (page: number) => {
      currentPage.value = page;
    };

    const setPageSize = (size: number) => {
      currentPage.value = 1;
      pageSize.value = size;
    };

    return {
      versionsData,
      versionsError,
      currentPage,
      pageSize,
      getCardButton,
      initialize,
      setPage,
      setPageSize,
    };
  }
);
