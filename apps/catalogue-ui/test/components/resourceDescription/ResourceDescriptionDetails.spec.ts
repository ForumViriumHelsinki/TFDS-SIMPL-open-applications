import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import ResourceDescriptionDetails from '@/components/resourceDescription/ResourceDescriptionDetails.vue';

// Mock all external dependencies to avoid store issues
vi.mock('@/components/resourceDescription/OfferDetails.vue', () => ({
  default: {
    name: 'OfferDetails',
    template: '<div class="mocked-offer-details">Offer Details</div>',
    props: ['document'],
  },
}));

vi.mock('@simpl/vue-components', () => ({
  ResourceDescriptionRendererHost: {
    name: 'ResourceDescriptionRendererHost',
    template: '<div class="mocked-renderer-host">Resource Description Renderer</div>',
    props: ['input'],
  },
  filterToReadableSdDocument: vi.fn(() => ({ filtered: 'data' })),
}));

vi.mock('@/util/getEnv', () => ({
  isConsumerEnvironment: vi.fn(() => true),
}));

import type { SearchAPISelfDescriptionDocument } from 'types/searchApi';

describe('ResourceDescriptionDetails.vue', () => {
  const mockDocument: SearchAPISelfDescriptionDocument = {
    '@context': [],
    issuanceDate: '2023-01-01',
    issuer: 'test-issuer',
    proof: {},
    type: ['VerifiableCredential'],
    credentialSubject: {
      title: 'Test Resource',
      description: 'Test Description',
    },
  } as any;

  it('renders the component', () => {
    const wrapper = mount(ResourceDescriptionDetails, {
      props: {
        document: mockDocument,
      },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('renders ResourceDescriptionRendererHost', () => {
    const wrapper = mount(ResourceDescriptionDetails, {
      props: {
        document: mockDocument,
      },
    });

    const rendererHost = wrapper.find('.mocked-renderer-host');
    expect(rendererHost.exists()).toBe(true);
  });
});
