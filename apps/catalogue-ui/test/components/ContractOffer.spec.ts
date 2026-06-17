import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import ContractOffer from '@/components/contracts/ContractOffer.vue';
import PolicyConstraints from '@/components/contracts/PolicyConstraints.vue';
import PrimeVue from 'primevue/config';

describe('ContractOffer.vue', () => {
  it('renders the contract offer wrapper', () => {
    const offer = {
      providerParticipantId: 'provider123',
      providerEndpointUrl: 'http://example.com',
      assetId: 'asset123',
      offerId: 'offer123',
      policy: {
        policyConstraints: [
          {
            condition: 'deletion' as 'deletion',
            conditionOperator: 'equals',
            conditionValue: 'true',
          },
        ],
      },
    };

    const wrapper = mount(ContractOffer, {
      props: {
        offer,
      },
      global: {
        plugins: [PrimeVue],
      },
    });

    expect(wrapper.find('.contract-offer').exists()).toBe(true);
  });

  it('renders the PolicyConstraints component with the correct props', () => {
    const offer = {
      providerParticipantId: 'provider123',
      providerEndpointUrl: 'http://example.com',
      assetId: 'asset123',
      offerId: 'offer123',
      policy: {
        policyConstraints: [
          {
            condition: 'deletion' as 'deletion',
            conditionOperator: 'equals',
            conditionValue: 'true',
          },
        ],
      },
    };

    const wrapper = mount(ContractOffer, {
      props: {
        offer,
      },
      global: {
        plugins: [PrimeVue],
      },
    });

    // Check if the PolicyConstraints component is rendered
    const policyConstraints = wrapper.findComponent(PolicyConstraints);
    expect(policyConstraints.exists()).toBe(true);

    // Check if the correct props are passed to the PolicyConstraints component
    expect(policyConstraints.props('constraints')).toEqual(offer.policy.policyConstraints);
  });
});
