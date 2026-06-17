import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import SearchedPropertiesTree from '@/components/search/SearchedPropertiesTree.vue';

vi.mock('@/components/search/SearchedProperties.vue', () => ({
  default: {
    name: 'SearchedProperties',
    template: '<div class="mock-searched-properties" />',
    props: ['input', 'level'],
  },
}));

describe('SearchedPropertiesTree.vue', () => {
  it('renders SearchedProperties and passes inputProperties as input prop', () => {
    const inputProperties = 'test-string-1';
    const wrapper = mount(SearchedPropertiesTree, {
      props: {
        inputProperties,
      },
    });
    const searchedProps = wrapper.findComponent({ name: 'SearchedProperties' });
    expect(searchedProps.exists()).toBe(true);
    expect(searchedProps.props('input')).toBe(inputProperties);
    expect(searchedProps.props('level')).toBe(0);
  });

  it('renders SearchedProperties with string inputProperties', () => {
    const inputProperties = 'test-string-2';
    const wrapper = mount(SearchedPropertiesTree, {
      props: {
        inputProperties,
      },
    });
    const searchedProps = wrapper.findComponent({ name: 'SearchedProperties' });
    expect(searchedProps.exists()).toBe(true);
    expect(searchedProps.props('input')).toBe('test-string-2');
    expect(searchedProps.props('level')).toBe(0);
  });
});
