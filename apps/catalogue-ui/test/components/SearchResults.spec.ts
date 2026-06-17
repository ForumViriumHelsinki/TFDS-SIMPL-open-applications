import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import SearchResults from '@/components/search/SearchResults.vue';
import { ResourceDescriptionCard } from '@simpl/vue-components';

// Mock ResourceDescriptionCard component
vi.mock('@simpl/vue-components', () => ({
  ResourceDescriptionCard: {
    template:
      '<div class="resource-description-card" data-testid="resource-card"></div>',
    props: ['searchResult', 'showMoreDetails', 'cardButton'],
    inheritAttrs: false,
  },
}));

describe('SearchResults.vue', () => {
  it('renders the correct number of results', () => {
    const result = [
      {
        title: 'Result 1',
        offeringType: 'data',
        description: 'Description 1',
        claimsGraphUri: ['http://example.com'] as [string],
      },
      {
        title: 'Result 2',
        offeringType: 'data',
        description: 'Description 2',
        claimsGraphUri: ['http://example.com'] as [string],
      },
    ];

    const wrapper = mount(SearchResults, {
      props: {
        result,
        resultsNumberSuffix: 'found',
      },
    });

    expect(wrapper.text()).toContain('2 results found');
    expect(wrapper.findAll('[data-testid="resource-card"]').length).toBe(2);
  });

  it('renders "1 result" when there is only one result', () => {
    const result = [
      {
        title: 'Result 1',
        offeringType: 'data',
        description: 'Description 1',
        claimsGraphUri: ['http://example.com'] as [string],
      },
    ];

    const wrapper = mount(SearchResults, {
      props: {
        result,
        resultsNumberSuffix: 'found',
      },
    });

    expect(wrapper.text()).toContain('1 result found');
    expect(wrapper.findAll('[data-testid="resource-card"]').length).toBe(1);
  });

  it('renders no results when result is empty', () => {
    const wrapper = mount(SearchResults, {
      props: {
        result: [],
        resultsNumberSuffix: 'found',
      },
    });

    expect(wrapper.text()).toContain('0 results found');
    expect(wrapper.findAll('[data-testid="resource-card"]').length).toBe(0);
  });

  it('renders no results when result is null', () => {
    const wrapper = mount(SearchResults, {
      props: {
        result: null,
        resultsNumberSuffix: 'found',
      },
    });

    // When result is null, result?.length will be undefined, which renders as empty string
    expect(wrapper.text()).toContain('results found'); // No number before "results"
    expect(wrapper.findAll('[data-testid="resource-card"]').length).toBe(0);
  });

  it('passes the correct props to ResourceDescriptionCard', async () => {
    const result = [
      {
        title: 'Result 1',
        offeringType: 'data',
        description: 'Description 1',
        claimsGraphUri: ['http://example.com'] as [string],
      },
    ];

    const wrapper = mount(SearchResults, {
      props: {
        result,
        showJson: true,
      },
    });

    const resourceCard = wrapper.findComponent(ResourceDescriptionCard);
    await wrapper.vm.$nextTick();
    expect(resourceCard.exists()).toBe(true);
    expect(resourceCard.props('searchResult')).toEqual(result[0]);
    expect(resourceCard.props('showMoreDetails')).toBe(true);
  });

  it('renders results without resultsNumberSuffix', () => {
    const result = [
      {
        title: 'Result 1',
        offeringType: 'data',
        description: 'Description 1',
        claimsGraphUri: ['http://example.com'] as [string],
      },
    ];

    const wrapper = mount(SearchResults, {
      props: {
        result,
      },
    });

    expect(wrapper.text()).toContain('1 result');
    // Should not contain any suffix
    expect(wrapper.text()).not.toContain('found');
  });

  it('renders slot content in details section', () => {
    const result = [
      {
        title: 'Result 1',
        offeringType: 'data',
        description: 'Description 1',
        claimsGraphUri: ['http://example.com'] as [string],
      },
    ];

    const wrapper = mount(SearchResults, {
      props: {
        result,
        resultsNumberSuffix: 'found',
      },
      slots: {
        details: '<div class="custom-details">Custom search details</div>',
      },
    });

    expect(wrapper.find('.custom-details').exists()).toBe(true);
    expect(wrapper.text()).toContain('Custom search details');
  });

  it('handles showJson prop correctly', () => {
    const result = [
      {
        title: 'Result 1',
        offeringType: 'data',
        description: 'Description 1',
        claimsGraphUri: ['http://example.com'] as [string],
      },
    ];

    const wrapper = mount(SearchResults, {
      props: {
        result,
        showJson: false,
      },
    });

    // Even though showJson is passed to the component, it's not actually used in the template
    // but we can verify the prop is accepted
    expect(wrapper.props('showJson')).toBe(false);
  });

  it('applies correct CSS classes', () => {
    const result = [
      {
        title: 'Result 1',
        offeringType: 'data',
        description: 'Description 1',
        claimsGraphUri: ['http://example.com'] as [string],
      },
    ];

    const wrapper = mount(SearchResults, {
      props: {
        result,
      },
    });

    // Check main container classes
    expect(wrapper.find('.border-t').exists()).toBe(true);

    // Check details section classes (check each class individually)
    expect(wrapper.find('.search-results-details').exists()).toBe(true);
    expect(wrapper.find('.mb-10').exists()).toBe(true);
    expect(wrapper.find('.pt-3').exists()).toBe(true);

    // Check results container classes (check each class individually)
    expect(wrapper.find('.search-results').exists()).toBe(true);
    expect(wrapper.find('.flex').exists()).toBe(true);
    expect(wrapper.find('.flex-col').exists()).toBe(true);
    expect(wrapper.find('.gap-4').exists()).toBe(true);

    // Check results number span
    expect(wrapper.find('.number-of-results').exists()).toBe(true);
  });

  it('handles result items with different key properties', () => {
    const result = [
      {
        title: 'Result 1',
        offeringType: 'data',
        description: 'Description 1',
        claimsGraphUri: ['http://example.com'] as [string],
      },
      {
        title: 'Result 2',
        offeringType: 'application',
        description: 'Description 2',
        claimsGraphUri: ['http://example2.com'] as [string],
      },
    ];

    const wrapper = mount(SearchResults, {
      props: {
        result,
      },
    });

    const resourceCards = wrapper.findAllComponents(ResourceDescriptionCard);
    expect(resourceCards).toHaveLength(2);

    expect(resourceCards[0].props('searchResult')).toEqual(result[0]);
    expect(resourceCards[1].props('searchResult')).toEqual(result[1]);

    // Each card should have showMoreDetails prop set to true
    resourceCards.forEach((card) => {
      expect(card.props('showMoreDetails')).toBe(true);
    });
  });

  it('handles large numbers of results', () => {
    const result = Array.from({ length: 100 }, (_, i) => ({
      title: `Result ${i + 1}`,
      offeringType: 'data',
      description: `Description ${i + 1}`,
      claimsGraphUri: [`http://example${i + 1}.com`] as [string],
    }));

    const wrapper = mount(SearchResults, {
      props: {
        result,
        resultsNumberSuffix: 'found',
      },
    });

    expect(wrapper.text()).toContain('100 results found');
    expect(wrapper.findAllComponents(ResourceDescriptionCard)).toHaveLength(100);
  });

  it('displays correct text for various result counts', () => {
    // Test 0 results
    let wrapper = mount(SearchResults, {
      props: { result: [], resultsNumberSuffix: 'found' },
    });
    expect(wrapper.text()).toContain('0 results found');

    // Test 1 result (singular)
    wrapper = mount(SearchResults, {
      props: {
        result: [
          {
            title: 'Single Result',
            offeringType: 'data',
            description: 'Description',
            claimsGraphUri: ['http://example.com'] as [string],
          },
        ],
        resultsNumberSuffix: 'found',
      },
    });
    expect(wrapper.text()).toContain('1 result found');

    // Test multiple results (plural)
    wrapper = mount(SearchResults, {
      props: {
        result: [
          {
            title: 'Result 1',
            offeringType: 'data',
            description: 'Description 1',
            claimsGraphUri: ['http://example1.com'] as [string],
          },
          {
            title: 'Result 2',
            offeringType: 'data',
            description: 'Description 2',
            claimsGraphUri: ['http://example2.com'] as [string],
          },
        ],
        resultsNumberSuffix: 'found',
      },
    });
    expect(wrapper.text()).toContain('2 results found');

    // Test null result
    wrapper = mount(SearchResults, {
      props: { result: null, resultsNumberSuffix: 'found' },
    });
    // When result is null, result?.length is undefined, which renders as empty string
    expect(wrapper.text()).toContain(' results found'); // Note the space
  });
});
