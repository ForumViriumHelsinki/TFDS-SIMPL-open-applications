<template>
  <form action="/" method="get" class="mb-4 flex flex-row justify-start gap-4 pt-4">
    <SInput
      id="quick-search-inpage"
      class="w-full max-w-screen-md flex-grow"
      name="search"
      type="text"
      placeholder="Quick search"
      v-model="localSearchValue"
    />
    <SButton
      id="quick-search-submit-button"
      class="quick-search-button"
      label="Search"
      icon="search"
      iconPos="right"
      severity="primary"
      type="submit"
    />
  </form>
  <div>
    <SLoadingSpinner id="quick-search-loading" v-if="isLoading" />
    <div v-else-if="search?.length">
      <SStatusMessage
        id="quick-search-error"
        v-if="errorDetails"
        class="quick-search-error"
        :title="errorDetails.title"
        variant="error"
      >
        {{ errorDetails.description }}
      </SStatusMessage>
      <div v-else>
        <SearchResults :result="result">
          <template #details> <strong>for the search string:</strong> {{ props.search }} </template>
        </SearchResults>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { SLoadingSpinner, SStatusMessage, SInput, SButton, type PossibleUIError } from '@simpl/vue-components';
import SearchResults from '@/components/search/SearchResults.vue';
import { useQuickSearch } from '@/services/composables/useQuickSearch';
import type { SearchAPIResult } from 'types/searchApi';

const result = ref<SearchAPIResult[]>([]);
const errorDetails = ref<PossibleUIError>(null);
const isLoading = ref(false);

const props = defineProps<{
  search: string;
}>();

const localSearchValue = ref(props.search);

const performSearch = async () => {
  if (!props.search) {
    return;
  }

  isLoading.value = true;
  const { data, error } = await useQuickSearch(props.search);
  if (error.value) {
    errorDetails.value = error.value;
  } else if (data.value) {
    result.value = data.value;
  }
  isLoading.value = false;
};

onMounted(performSearch);
</script>
