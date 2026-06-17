import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import SearchedProperties from '@/components/search/SearchedProperties.vue';
import FormattedNumberRangeValue from '@/components/search/FormattedNumberRangeValue.vue';

vi.mock('@/components/search/FormattedNumberRangeValue.vue', () => ({
  default: {
    template: '<div class="formatted-number-range-value"></div>',
  },
}));

describe('SearchedProperties.vue', () => {
  it('renders nested properties correctly', () => {
    const input = {
      property1: 'value1',
      property2: {
        nestedProperty1: 'nestedValue1',
        nestedProperty2: 'nestedValue2',
      },
    };

    const wrapper = mount(SearchedProperties, {
      props: { input, level: 0 },
    });

    expect(wrapper.text()).toContain('Property1: value1');
    expect(wrapper.text()).toContain('Nested Property1: nestedValue1');
    expect(wrapper.text()).toContain('Nested Property2: nestedValue2');
  });

  it('renders FormattedNumberRangeValue when input is an AdvancedSearchNumberRangeValue', () => {
    const input = {
      priceRange: {
        op1: '>=',
        value1: 10,
        op2: '<=',
        value2: 50,
      },
    };

    const wrapper = mount(SearchedProperties, {
      props: { input, level: 0 },
    });

    expect(wrapper.findComponent(FormattedNumberRangeValue).exists()).toBe(true);
  });

  it('filters out @type keys from the input', () => {
    const input = {
      '@type': 'SomeType',
      property1: 'value1',
    };

    const wrapper = mount(SearchedProperties, {
      props: { input, level: 0 },
    });

    expect(wrapper.text()).not.toContain('@type');
    expect(wrapper.text()).toContain('Property1: value1');
  });

  it('applies correct margin based on the level prop', () => {
    const input = {
      property1: 'value1',
    };

    const wrapper = mount(SearchedProperties, {
      props: { input, level: 2 },
    });

    const div = wrapper.find('.search-parameter');
    expect(div.attributes('style')).toContain('margin-left: 2rem;');
  });

  it('renders string input directly', () => {
    const input = 'simple string';

    const wrapper = mount(SearchedProperties, {
      props: { input, level: 0 },
    });

    expect(wrapper.text()).toBe('simple string');
  });
});
