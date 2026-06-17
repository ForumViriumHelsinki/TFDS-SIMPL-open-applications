import { ref, computed, watch, toRaw } from 'vue';
import { useResourceDescriptions } from '@/services/composables/useResourceDescriptions';
import { defineStore, storeToRefs } from 'pinia';
import { useSchemasStore } from './schemas';
import {
  getResourceDescriptionSummaryFromResult,
  type DropdownItem,
  type ExtendedSearchAPIResult,
  type SSelectOptions,
  type PossibleUIError,
} from '@simpl/vue-components';
import { useTemporarySuccessMessageStore } from './temporarySuccessMessage';

export const useResourceDescriptionListStore = defineStore('resourceDescriptionList', () => {
  const schemaStore = useSchemasStore();
  const { schemas, schemasError } = storeToRefs(schemaStore);

  const temporarySuccessMessageStore = useTemporarySuccessMessageStore();
  const { clearSuccessDetails } = temporarySuccessMessageStore;

  const localSuccessMessage = ref({
    id: null as string | null,
    offeringName: null as string | null,
    action: null as 'published' | 'revoked' | null,
    show: false as boolean,
  });

  const setLocalSuccessMessage = () => {
    if (
      temporarySuccessMessageStore.showSuccessMessage &&
      temporarySuccessMessageStore.successId &&
      temporarySuccessMessageStore.successOfferingName
    ) {
      localSuccessMessage.value = {
        id: toRaw(temporarySuccessMessageStore.successId),
        offeringName: toRaw(temporarySuccessMessageStore.successOfferingName),
        action: toRaw(temporarySuccessMessageStore.successAction) as 'published' | 'revoked' | null,
        show: toRaw(temporarySuccessMessageStore.showSuccessMessage),
      };
    }
  };

  const initializeListView = () => {
    setLocalSuccessMessage();
    clearSuccessDetails();
  };

  const resourceDescriptionsData = ref(null);
  const resourceDescriptionsError = ref<PossibleUIError>(null);

  const newSchemaOptions = computed<DropdownItem[]>(() =>
    schemas.value.map((schema: SSelectOptions) => ({
      id: schema.value,
      label: schema.label,
    }))
  );

  const handleCreateNewDropdownClick = (item: DropdownItem) => {
    window.location.assign(`/resourceDescriptions/${item.id}/new`);
  };

  const { getResourceDescriptions } = useResourceDescriptions();

  const getCardButton = (item: ExtendedSearchAPIResult) => ({
    href: `/resourceDescriptions/${getResourceDescriptionSummaryFromResult(item).id}`,
  });

  const getPreviousVersionsButton = (item: ExtendedSearchAPIResult) => {
    const summary = getResourceDescriptionSummaryFromResult(item);
    const params = new URLSearchParams();
    if (summary.title) params.set('name', summary.title);
    return {
      href: `/resourceDescriptions/${summary.id}/versions?${params.toString()}`,
    };
  };

  const sortOptions = ref([
    {
      label: 'Publication Date',
      value: 'publicationDate',
    },
    {
      label: 'Resource Type',
      value: 'resourceType',
    },
  ]);

  const sortBy = ref(sortOptions.value[0].value);

  const displayedStatuses = computed(() => {
    const statusList = [];
    if (schemasError.value) {
      statusList.push({
        variant: 'danger',
        title: schemasError.value.title,
        description: schemasError.value.description,
        show: true,
      });
    }

    if (resourceDescriptionsError.value) {
      statusList.push({
        variant: 'danger',
        title: resourceDescriptionsError.value.title,
        description: resourceDescriptionsError.value.description,
        show: true,
      });
    }

    if (localSuccessMessage.value.show) {
      if (localSuccessMessage.value.action === 'revoked') {
        statusList.push({
          variant: 'success',
          title: 'Resource description revoked',
          description: `${localSuccessMessage.value.offeringName} has been successfully revoked.`,
          show: true,
        });
      } else {
        statusList.push({
          variant: 'success',
          title: `Resource description published`,
          description: `Your ${localSuccessMessage.value.offeringName} resource description has been successfully published with ID ${localSuccessMessage.value.id}`,
          show: true,
        });
      }
    }
    return statusList;
  });

  watch(
    sortBy,
    async () => {
      const { data, error } = await getResourceDescriptions(sortBy.value);
      if (error.value) {
        resourceDescriptionsError.value = error.value;
      }
      if (data.value) {
        resourceDescriptionsData.value = data.value;
      }
    },
    { immediate: true }
  );

  return {
    resourceDescriptionsData,
    resourceDescriptionsError,
    newSchemaOptions,
    handleCreateNewDropdownClick,
    getCardButton,
    getPreviousVersionsButton,
    sortOptions,
    sortBy,
    displayedStatuses,
    schemasError,
    setLocalSuccessMessage,
    clearSuccessDetails,
    initializeListView,
  };
});
