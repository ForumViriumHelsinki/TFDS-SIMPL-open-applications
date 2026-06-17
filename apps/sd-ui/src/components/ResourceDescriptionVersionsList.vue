<template>
  <SOverlay
    id="resource-description-versions-overlay"
    v-model="isOpen"
    title="Previous versions for:"
    class="h-full"
    @hide="closeOverlay"
  >
    <div class="mx-auto max-w-screen-xl px-8 2xl:max-w-screen-2xl">
      <div class="mb-6">
        <p v-if="props.resourceDescriptionName" class="resource-description-versions-name text-h5 mt-1">
          {{ props.resourceDescriptionName }}
        </p>
        <p class="resource-description-versions-id text-text-light text-sm mt-1 break-all">
          {{ resourceDescriptionId }}
        </p>
      </div>
      <div v-if="versionsError" class="mb-6">
        <SStatusMessage
          id="resource-description-versions-error"
          variant="danger"
          :title="versionsError.title"
        >
          {{ versionsError.description }}
        </SStatusMessage>
      </div>
      <div v-if="!versionsError && versionsData">
        <div class="resource-description-versions">
          <div
            v-if="versionsData?.items?.length"
            class="flex flex-col gap-x-4 gap-y-6 md:grid md:grid-cols-2"
          >
            <ResourceDescriptionCard
              v-for="item in versionsData.items"
              :key="item.claimsGraphUri?.[0] || item.title || item.name"
              :search-result="item"
              :show-more-details="true"
              :card-button="getCardButton(item)"
            />
          </div>
          <div v-else>No versions found</div>
        </div>
        <SPaginator
          v-if="versionsData.totalCount > 0"
          id="resource-description-versions-paginator"
          class="mt-6"
          :total-records="versionsData.totalCount"
          :current-page="currentPage"
          :rows-per-page="pageSize"
          @update:current-page="setPage"
          @update:rows-per-page="setPageSize"
        />
      </div>
    </div>
  </SOverlay>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useResourceDescriptionVersionsStore } from '@/store/resourceDescriptionVersions';
import { ResourceDescriptionCard, SStatusMessage, SPaginator, SOverlay } from '@simpl/vue-components';

const props = defineProps<{
  resourceDescriptionId: string;
  resourceDescriptionName?: string;
}>();

const isOpen = ref(true);

const closeOverlay = () => {
  window.location.assign('/');
};

const versionsStore = useResourceDescriptionVersionsStore();
const { versionsData, versionsError, currentPage, pageSize } = storeToRefs(versionsStore);
const { getCardButton, initialize, setPage, setPageSize } = versionsStore;

onMounted(() => {
  initialize(props.resourceDescriptionId);
});
</script>
