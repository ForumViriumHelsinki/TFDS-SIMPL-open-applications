<template>
  <Panel header="Transfer Details">
    <div class="mb-4">
      Provide the necessary information about the location to which you want the resource to be
      transferred.
    </div>
    <div class="max-w-screen-md">
      <ResourceSharingMethod />
    </div>
  </Panel>
</template>

<script setup lang="ts">
import Panel from 'primevue/panel';
import ResourceSharingMethod from './ResourceSharingMethod.vue';
</script>
