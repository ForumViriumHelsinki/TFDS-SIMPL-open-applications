import { ref } from 'vue';
import type { SchemasResponse, SchemaMetadata } from '@/types/schemas';
import { type SSelectOptions } from '@simpl/vue-components';
import type { PossibleUIError } from '@simpl/vue-components';
import { fetchLocalEndpoint } from '@/util/services';
import { filterSchemas } from '@/util/schemas';

export function useSchemas() {
  const schemas = ref<SSelectOptions>([]);
  const schemasMetadata = ref<SchemaMetadata[]>([]);
  const schemasError = ref<PossibleUIError>(null);
  const schemasLoading = ref(false);

  const fetchSchemas = async () => {
    schemasLoading.value = true;
    const { data, error } = await fetchLocalEndpoint<
      SchemasResponse,
      SchemasResponse,
      SchemasResponse
    >('/api/schemas', {
      method: 'GET',
      errorIdentifier: 'SCHEMA_FETCH_ERROR',
      apiName: 'SD Tooling',
      defaultData: { schemas: [] },
    });
    if (data.value) {
      schemasMetadata.value = data.value.schemas || [];
      schemas.value = filterSchemas(data.value);
    }
    schemasError.value = error.value;
    schemasLoading.value = false;
  };

  return {
    schemas,
    schemasMetadata,
    schemasError,
    schemasLoading,
    fetchSchemas,
  };
}
