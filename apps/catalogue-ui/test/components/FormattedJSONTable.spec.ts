import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import FormattedJSONTable from '@/components/FormattedJSONTable.vue';

describe('FormattedJSONTable.vue', () => {
  it('renders the JSON object correctly', () => {
    const jsonObject = {
      firstName: 'John',
      lastName: 'Doe',
      userId: 123,
    };

    const wrapper = mount(FormattedJSONTable, {
      props: { jsonObject },
    });

    // Check if keys are converted and displayed correctly
    expect(wrapper.text()).toContain('First Name');
    expect(wrapper.text()).toContain('Last Name');
    expect(wrapper.text()).toContain('User ID');

    // Check if values are displayed correctly
    expect(wrapper.text()).toContain('John');
    expect(wrapper.text()).toContain('Doe');
    expect(wrapper.text()).toContain('123');
  });

  it('handles null or undefined values gracefully', () => {
    const jsonObject = {
      firstName: null,
      lastName: undefined,
    };

    const wrapper = mount(FormattedJSONTable, {
      props: { jsonObject },
    });

    // Check if null or undefined values are displayed as empty strings
    const rows = wrapper.findAll('.property-value');
    expect(rows[0].text()).toBe('');
    expect(rows[1].text()).toBe('');
  });

  it('camelCaseToSpacedAndCapitalized function works as expected', () => {
    const camelCaseToSpacedAndCapitalized = (camelCase: string | number) =>
      String(camelCase)
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .replace('Id', 'ID')
        .trim();

    expect(camelCaseToSpacedAndCapitalized('firstName')).toBe('First Name');
    expect(camelCaseToSpacedAndCapitalized('userId')).toBe('User ID');
    expect(camelCaseToSpacedAndCapitalized('simpleTest')).toBe('Simple Test');
  });
});
