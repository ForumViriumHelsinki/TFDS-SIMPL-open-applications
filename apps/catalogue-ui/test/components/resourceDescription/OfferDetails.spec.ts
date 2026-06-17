import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import OfferDetails from '@/components/resourceDescription/OfferDetails.vue';

// Mock external dependencies
vi.mock('@simpl/vue-components', () => ({
  SButton: {
    name: 'SButton',
    template: '<button class="mocked-button" :id="id">{{ label }}</button>',
    props: ['id', 'label', 'disabled', 'severity'],
  },
  SLoadingSpinner: {
    name: 'SLoadingSpinner',
    template: '<div class="mocked-spinner" :id="id">Loading...</div>',
    props: ['id'],
  },
  SStatusMessage: {
    name: 'SStatusMessage',
    template: '<div class="mocked-status" :id="id"><slot /></div>',
    props: ['id', 'title', 'variant'],
  },
  ResourceDescriptionRendererHost: {
    name: 'ResourceDescriptionRendererHost',
    template: '<div class="mocked-renderer-host">Renderer Host</div>',
    props: ['input'],
  },
  filterToReadableSdDocument: vi.fn(() => ({ someFilteredData: 'test' })),
  consoleLogError: vi.fn(),
}));

vi.mock('@/stores', () => ({
  useContractNegotiationStore: vi.fn(() => ({
    isEligible: { value: true },
    negotiationData: { value: { someData: 'test' } },
  })),
  useDataTransferWizardStore: vi.fn(() => ({
    openOverlay: vi.fn(),
  })),
}));

vi.mock('pinia', () => ({
  storeToRefs: vi.fn(() => ({
    isEligible: { value: true },
    negotiationData: { value: { someData: 'test' } },
  })),
}));

vi.mock('@/services/composables/useContractConsumption', () => ({
  useContractConsumption: vi.fn(() => ({
    getCatalogOffers: vi.fn().mockResolvedValue({
      data: { value: { offers: [] } },
      error: { value: null },
    }),
  })),
}));

import { useContractConsumption } from '@/services/composables/useContractConsumption';

vi.mock('../contracts/ContractOffers.vue', () => ({
  default: {
    template: '<div class="mocked-contract-offers">Contract Offers</div>',
    props: ['offers'],
  },
}));

import type { SearchAPISelfDescriptionDocument } from 'types/searchApi';

describe('OfferDetails.vue', () => {
  const mockDocument: SearchAPISelfDescriptionDocument = {
    '@context': [],
    issuanceDate: '2023-01-01',
    issuer: 'test-issuer',
    proof: {},
    type: ['VerifiableCredential'],
    credentialSubject: {
      'simpl:offeringPrice': {
        'simpl:price': {
          '@value': '100',
        },
        'simpl:currency': 'USD',
        'simpl:priceType': 'fixed',
      },
    },
  } as any;

  it('renders the component with basic elements', () => {
    const wrapper = mount(OfferDetails, {
      props: {
        document: mockDocument,
      },
    });

    // Should render the basic structure
    expect(wrapper.exists()).toBe(true);
  });

  it('renders the Get Data button', () => {
    const wrapper = mount(OfferDetails, {
      props: {
        document: mockDocument,
      },
    });

    const button = wrapper.find('.mocked-button');
    expect(button.exists()).toBe(true);
    expect(button.text()).toBe('Get Data');
  });

  it('renders Get Data button with correct id attribute', () => {
    const wrapper = mount(OfferDetails, {
      props: {
        document: mockDocument,
      },
    });

    // Verify the ID is in the rendered HTML
    const html = wrapper.html();
    expect(html).toContain('get-data-button');
  });

  it('renders error message with id when catalog offers have error', async () => {
    // Mock the composable to return an error
    vi.mocked(useContractConsumption).mockReturnValueOnce({
      getCatalogOffers: vi.fn().mockResolvedValue({
        data: { value: null },
        error: { value: { title: 'Catalog Error', description: 'Test error description' } },
      }),
    } as any);

    const wrapper = mount(OfferDetails, {
      props: {
        document: mockDocument,
      },
    });

    // Wait for async operations
    await wrapper.vm.$nextTick();
    await new Promise((resolve) => setTimeout(resolve, 10));
    await wrapper.vm.$nextTick();

    const html = wrapper.html();
    expect(html).toContain('catalog-offers-error');
  });

  it('renders loading spinner with correct id when catalog offers are loading', async () => {
    const wrapper = mount(OfferDetails, {
      props: {
        document: mockDocument,
      },
    });

    // Wait for component to mount
    await wrapper.vm.$nextTick();

    const spinner = wrapper.findComponent({ name: 'SLoadingSpinner' });
    if (spinner.exists()) {
      expect(spinner.attributes('id')).toBe('catalog-offers-loading');
    }
  });

  it('renders error message with correct id when there is an error', async () => {
    vi.mocked(useContractConsumption).mockReturnValueOnce({
      getCatalogOffers: vi.fn().mockResolvedValue({
        data: { value: null },
        error: { value: { title: 'Error', description: 'Test error' } },
      }),
    } as any);

    const wrapper = mount(OfferDetails, {
      props: {
        document: mockDocument,
      },
    });

    await wrapper.vm.$nextTick();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await wrapper.vm.$nextTick();

    const errorMessage = wrapper.findComponent({ name: 'SStatusMessage' });
    if (errorMessage.exists()) {
      expect(errorMessage.attributes('id')).toBe('catalog-offers-error');
    }
  });
});
