import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import PageHeader from '@/components/PageHeader.vue';

describe('PageHeader.vue', () => {
  it('renders the title', () => {
    const wrapper = mount(PageHeader, {
      props: {
        title: 'Test Title',
      },
    });
    const title = wrapper.find('h1.page-title');
    expect(title.exists()).toBe(true);
    expect(title.text()).toBe('Test Title');
  });

  it('renders the subtitle if provided and not empty', () => {
    const wrapper = mount(PageHeader, {
      props: {
        title: 'Test Title',
        subtitle: 'Test Subtitle',
      },
    });
    const subtitle = wrapper.find('p.page-subtitle');
    expect(subtitle.exists()).toBe(true);
    expect(subtitle.text()).toBe('Test Subtitle');
  });

  it('does not render the subtitle if not provided', () => {
    const wrapper = mount(PageHeader, {
      props: {
        title: 'Test Title',
      },
    });
    const subtitle = wrapper.find('p.page-subtitle');
    expect(subtitle.exists()).toBe(false);
  });

  it('does not render the subtitle if empty', () => {
    const wrapper = mount(PageHeader, {
      props: {
        title: 'Test Title',
        subtitle: '',
      },
    });
    const subtitle = wrapper.find('p.page-subtitle');
    expect(subtitle.exists()).toBe(false);
  });
});
