import { defineStore } from 'pinia';
import { computed } from 'vue';
import { useSchemas } from '@/services/composables/useSchemas';
import type { SchemaMetadata } from '@/types/schemas';

export const useSchemasStore = defineStore('schemas', () => {
  const { schemas, schemasMetadata, schemasError, schemasLoading, fetchSchemas } = useSchemas();

  const hasSchemas = computed(() => Boolean(schemas.value && schemas.value.length > 0));

  const isLoading = computed(() => schemasLoading.value);

  const getSchemaById = (schemaId: string | undefined): SchemaMetadata | undefined => {
    if (!schemaId) return undefined;
    return schemasMetadata.value.find((s) => s.id === schemaId);
  };

  const getResourceTypeById = (schemaId: string | undefined): string | null => {
    const schema = getSchemaById(schemaId);
    return schema?.resourceType ?? null;
  };

  const getSchemaIdByResourceType = (resourceType: string): string | undefined => {
    const schema = schemasMetadata.value.find(
      (s) => s.resourceType.toLowerCase() === resourceType.toLowerCase()
    );
    return schema?.id;
  };

  return {
    schemas,
    schemasMetadata,
    schemasError,
    schemasLoading,
    hasSchemas,
    isLoading,
    fetchSchemas,
    getSchemaById,
    getResourceTypeById,
    getSchemaIdByResourceType,
  };
});
