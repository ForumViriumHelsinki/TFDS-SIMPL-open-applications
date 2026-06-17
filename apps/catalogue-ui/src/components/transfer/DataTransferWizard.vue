<template>
  <SStepper id="data-transfer-stepper" :value="step" orientation="horizontal" linear>
    <SStepList>
      <SStep
        id="step-contract-negotiation"
        value="contractNegotiation"
        :label="steps['contractNegotiation'].title"
      >
        1
      </SStep>
      <SStep
        id="step-transfer-details"
        value="transferDetails"
        :label="steps['transferDetails'].title"
        >2</SStep
      >
      <SStep
        id="step-transfer-process"
        value="transferProcess"
        :label="steps['transferProcess'].title"
        >3</SStep
      >
    </SStepList>
    <StepPanels>
      <StepPanel value="contractNegotiation">
        <ContractNegotiationStep />
      </StepPanel>
      <StepPanel value="transferDetails">
        <TransferDetailsStep />
      </StepPanel>
      <StepPanel value="transferProcess">
        <TransferProcessStep />
      </StepPanel>
    </StepPanels>
  </SStepper>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { StepPanel, StepPanels } from 'primevue';
import { useDataTransferWizardStore } from '@/stores';
import { SStepper, SStepList, SStep } from '@simpl/vue-components';
import ContractNegotiationStep from './ContractNegotiationStep.vue';
import TransferDetailsStep from './TransferDetailsStep.vue';
import TransferProcessStep from './TransferProcessStep.vue';

const dataTransferStore = useDataTransferWizardStore();
const { step, steps } = storeToRefs(dataTransferStore);
</script>
