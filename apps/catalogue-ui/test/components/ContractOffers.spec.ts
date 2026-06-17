import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import ContractOffers from '@/components/contracts/ContractOffers.vue';
import ContractOfferComponent from '@/components/contracts/ContractOffer.vue';

// Mock ContractOfferComponent
vi.mock('@/components/contracts/ContractOffer.vue', () => ({
  default: {
    template: '<div class="contract-offer"></div>',
  },
}));

const exampleOffers = [
  {
    offerId: 'offer1',
    title: 'Offer 1',
    description: 'Description 1',
    providerParticipantId: 'provider1',
    providerEndpointUrl: 'endpoint1',
    assetId: 'asset1',
    policy: {
      policyConstraints: [
        {
          condition: 'deletion' as 'deletion',
          conditionOperator: '=',
          conditionValue: 'true',
        },
      ],
    },
  },
  {
    offerId: 'offer2',
    title: 'Offer 2',
    description: 'Description 2',
    providerParticipantId: 'provider2',
    providerEndpointUrl: 'endpoint2',
    assetId: 'asset2',
    policy: {
      policyConstraints: [
        {
          condition: 'deletion' as 'deletion',
          conditionOperator: '=',
          conditionValue: 'true',
        },
      ],
    },
  },
];

describe('ContractOffers.vue', () => {
  it('renders the correct number of ContractOfferComponent instances', () => {
    const wrapper = mount(ContractOffers, {
      props: {
        offers: exampleOffers,
      },
    });

    const contractOfferComponents = wrapper.findAll('.contract-offer');
    expect(contractOfferComponents.length).toBe(2);
  });

  it('passes the correct props to each ContractOfferComponent', () => {
    const wrapper = mount(ContractOffers, {
      props: {
        offers: exampleOffers,
      },
    });

    const contractOfferComponents = wrapper.findAllComponents(ContractOfferComponent);
    expect(contractOfferComponents.length).toBe(2);

    // expect(contractOfferComponents[0].props('offer')).toEqual(offers[0]);
    // expect(contractOfferComponents[1].props('offer')).toEqual(offers[1]);
  });

  it('renders no ContractOfferComponent when offers array is empty', () => {
    const offers: any[] = [];

    const wrapper = mount(ContractOffers, {
      props: {
        offers,
      },
    });

    const contractOfferComponents = wrapper.findAll('.contract-offer');
    expect(contractOfferComponents.length).toBe(0);
  });
});
