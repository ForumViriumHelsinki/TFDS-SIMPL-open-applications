import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import PageHeader from '@/components/PageHeader.vue';

describe('PageHeader.vue', () => {
  it('renders the title prop', () => {
    const wrapper = mount(PageHeader, {
      props: { title: 'Test Title' },
    });
    expect(wrapper.text()).toContain('Test Title');
    expect(wrapper.find('h1').exists()).toBe(true);
    expect(wrapper.find('h1').classes()).toContain('text-3xl');
  });
});
