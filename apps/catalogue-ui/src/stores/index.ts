import { createPinia } from 'pinia';

// Create the pinia instance
export const pinia = createPinia();

// Export all stores for easy importing
export { useDataTransferWizardStore } from './dataTransferWizard';
export { useResourceSharingMethodStore } from './resourceSharingMethod';
export { useResourceDescriptionStore } from './resourceDescription';
export { useContractNegotiationStore } from './contractNegotiation';
export { useTransferProcessStore } from './transferProcess';
export { useSchemasStore } from './schemas';
