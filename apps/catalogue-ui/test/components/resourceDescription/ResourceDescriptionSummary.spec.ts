import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import ResourceDescriptionSummary from '@/components/resourceDescription/ResourceDescriptionSummary.vue';

// Mock external dependencies
vi.mock('@simpl/vue-components', () => ({
  SIcon: {
    template: '<span class="mocked-icon" :name="name">Icon</span>',
    props: ['name'],
  },
  getResourceDescriptionSummaryFromDocument: vi.fn(() => ({
    title: 'Test Document Title',
    name: 'Test Document Name',
    description: 'Test document description',
    providedBy: 'Test Provider',
    format: 'JSON',
    offeringType: 'data',
  })),
  getResourceDescriptionSummaryFromResult: vi.fn(() => ({
    title: 'Test Result Title',
    name: 'Test Result Name',
    description: 'Test result description',
    providedBy: 'Test Provider',
    format: 'CSV',
    offeringType: 'service',
  })),
  getResourceTypeIcon: vi.fn(() => 'document'),
}));

// Mock lodash
vi.mock('lodash', () => ({
  default: {
    capitalize: vi.fn((str) => str.charAt(0).toUpperCase() + str.slice(1)),
  },
}));

import * as resourceDescriptionsUtil from '@simpl/vue-components';
import type { SearchAPIResult, SearchAPISelfDescriptionDocument } from 'types/searchApi';

describe('ResourceDescriptionSummary.vue', () => {
  const mockSearchResult: SearchAPIResult = {
    claimsGraphUri: ['test-uri'],
    title: 'Test Result',
    description: 'Test Description',
    offeringType: 'data',
  } as any;

  const mockDocument: SearchAPISelfDescriptionDocument = {
    '@context': [],
    issuanceDate: '2023-01-01',
    issuer: 'test-issuer',
    proof: {},
    type: ['VerifiableCredential'],
    credentialSubject: {
      title: 'Test Document',
      description: 'Test Document Description',
    },
  } as any;

  it('renders with search result prop', () => {
    const wrapper = mount(ResourceDescriptionSummary, {
      props: {
        searchResult: mockSearchResult,
      },
    });

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.text()).toContain('Test Result Title');
    expect(wrapper.text()).toContain('Test result description');
  });

  it('renders with resource description document prop', () => {
    const wrapper = mount(ResourceDescriptionSummary, {
      props: {
        resourceDescriptionDocument: mockDocument,
      },
    });

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.text()).toContain('Test Document Title');
    expect(wrapper.text()).toContain('Test document description');
  });

  it('renders icon based on resource type', () => {
    const wrapper = mount(ResourceDescriptionSummary, {
      props: {
        searchResult: mockSearchResult,
      },
    });

    const icon = wrapper.find('.mocked-icon');
    expect(icon.exists()).toBe(true);
    expect(icon.attributes('name')).toBe('document');
  });

  it('displays resource type with correct capitalization', () => {
    const wrapper = mount(ResourceDescriptionSummary, {
      props: {
        searchResult: mockSearchResult,
      },
    });

    expect(wrapper.text()).toContain('Service'); // Capitalized from offering type
  });

  it('displays format when available', () => {
    const wrapper = mount(ResourceDescriptionSummary, {
      props: {
        searchResult: mockSearchResult,
      },
    });

    expect(wrapper.text()).toContain('CSV');
  });

  it('displays provider when available', () => {
    const wrapper = mount(ResourceDescriptionSummary, {
      props: {
        searchResult: mockSearchResult,
      },
    });

    expect(wrapper.text()).toContain('Test Provider');
  });

  it('applies large styles when isLarge is true', () => {
    const wrapper = mount(ResourceDescriptionSummary, {
      props: {
        searchResult: mockSearchResult,
        isLarge: true,
      },
    });

    const title = wrapper.find('.result-title');
    expect(title.classes()).toContain('text-2xl');
    expect(title.classes()).toContain('text-secondary');
  });

  it('applies normal styles when isLarge is false', () => {
    const wrapper = mount(ResourceDescriptionSummary, {
      props: {
        searchResult: mockSearchResult,
        isLarge: false,
      },
    });

    const title = wrapper.find('.result-title');
    expect(title.classes()).toContain('text-xl');
    expect(title.classes()).not.toContain('text-2xl');
    expect(title.classes()).not.toContain('text-secondary');
  });

  it('prioritizes title over name in display', () => {
    const wrapper = mount(ResourceDescriptionSummary, {
      props: {
        searchResult: mockSearchResult,
      },
    });

    // Should display title (Test Result Title) instead of name
    expect(wrapper.text()).toContain('Test Result Title');
  });

  it('shows format dot separator when format is present', () => {
    const wrapper = mount(ResourceDescriptionSummary, {
      props: {
        searchResult: mockSearchResult,
      },
    });

    const formatDot = wrapper.find('.bg-secondary.h-1.w-1');
    expect(formatDot.exists()).toBe(true);
  });

  it('does not show format or separator when format is missing', () => {
    // Mock to return no format
    vi.mocked(resourceDescriptionsUtil.getResourceDescriptionSummaryFromResult).mockReturnValueOnce(
      {
        title: 'Test Result Title',
        description: 'Test result description',
        providedBy: 'Test Provider',
        offeringType: 'service',
        // format is undefined
      }
    );

    const wrapper = mount(ResourceDescriptionSummary, {
      props: {
        searchResult: mockSearchResult,
      },
    });

    const formatElement = wrapper.find('.resource-format');
    const formatDot = wrapper.find('.bg-secondary.h-1.w-1');

    expect(formatElement.exists()).toBe(false);
    expect(formatDot.exists()).toBe(false);
  });

  it('handles when no props are provided', () => {
    const wrapper = mount(ResourceDescriptionSummary, {
      props: {},
    });

    // Should not crash when no data is available
    expect(wrapper.exists()).toBe(true);
  });
});
