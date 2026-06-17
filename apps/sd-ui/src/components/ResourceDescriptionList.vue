<template>
  <div class="flex flex-col gap-4">
    <SStatusMessage
      id="resource-description-list-status-message"
      v-for="displayedStatus in displayedStatuses"
      :key="displayedStatus.title"
      :variant="displayedStatus.variant"
      :title="displayedStatus.title"
    >
      {{ displayedStatus.description }}
    </SStatusMessage>
  </div>
  <h1 class="mt-10 mb-12">Resource Descriptions</h1>
  <div v-if="!schemasError" class="search-bar-container mb-10 flex flex-row justify-end gap-4">
    <SDropdown
      v-if="newSchemaOptions"
      id="create-new-resource-description"
      button-label="Create new"
      button-severity="primary"
      position="bottom"
      :items="newSchemaOptions"
      @item-click="handleCreateNewDropdownClick"
    />
  </div>
  <div v-if="!resourceDescriptionsError && resourceDescriptionsData">
    <div class="sort-bar mb-6 flex flex-row items-center gap-4">
      <div>{{ resourceDescriptionsData.totalCount }} results</div>
      <div class="flex flex-row items-center gap-1">
        Sort by: <SSelect id="sort-by" v-model="sortBy" :options="sortOptions" />
      </div>
    </div>

    <div class="resource-descriptions">
      <div
        v-if="resourceDescriptionsData?.items?.length"
        class="flex flex-col gap-x-4 gap-y-6 md:grid md:grid-cols-2"
      >
        <ResourceDescriptionCard
          v-for="item in resourceDescriptionsData.items"
          :key="item.claimsGraphUri?.[0] || item.title || item.name"
          :search-result="item"
          :show-more-details="true"
          :card-button="getCardButton(item)"
          :previous-versions-button="getPreviousVersionsButton(item)"
        />
      </div>
      <div v-else>No resource descriptions found</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useResourceDescriptionListStore } from '@/store/resourceDescriptionList';
import { SDropdown, SSelect, ResourceDescriptionCard, SStatusMessage } from '@simpl/vue-components';

const clearNewResourceDescriptionIdParam = () => {
  const url = new URL(window.location.href);
  url.searchParams.delete('newResourceDescriptionId');
  window.history.replaceState({}, '', url);
};

clearNewResourceDescriptionIdParam();

const resourceDescriptionListStore = useResourceDescriptionListStore();
const {
  resourceDescriptionsData,
  resourceDescriptionsError,
  newSchemaOptions,
  displayedStatuses,
  schemasError,
  sortOptions,
  sortBy,
} = storeToRefs(resourceDescriptionListStore);
const {
  getCardButton,
  getPreviousVersionsButton,
  handleCreateNewDropdownClick,
  initializeListView,
} = resourceDescriptionListStore;

initializeListView();
</script>
