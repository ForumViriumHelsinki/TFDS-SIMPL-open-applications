import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import PolicyConstraint from '@/components/contracts/PolicyConstraint.vue';
import type { ContractAccessPolicyConstraint } from 'types/contracts';

describe('PolicyConstraint.vue', () => {
  describe('Deletion constraint', () => {
    it('renders deletion constraint message when condition is deletion and value is after_use', () => {
      const constraint: ContractAccessPolicyConstraint = {
        condition: 'deletion',
        conditionOperator: 'equals',
        conditionValue: 'after_use',
      };

      const wrapper = mount(PolicyConstraint, {
        props: { constraint },
      });

      expect(wrapper.text()).toContain('The data will have to be deleted after usage');
      expect(wrapper.find('li').classes()).toContain('policy-constraint');
      expect(wrapper.find('li').classes()).toContain('list-item');
      expect(wrapper.find('li').classes()).toContain('gap-4');
    });

    it('does not render deletion constraint message when condition is deletion but value is not after_use', () => {
      const constraint: ContractAccessPolicyConstraint = {
        condition: 'deletion',
        conditionOperator: 'equals',
        conditionValue: 'never',
      };

      const wrapper = mount(PolicyConstraint, {
        props: { constraint },
      });

      expect(wrapper.text()).not.toContain('The data will have to be deleted after usage');
    });
  });

  describe('Count constraint', () => {
    it('renders count constraint message with correct usage limit', () => {
      const constraint: ContractAccessPolicyConstraint = {
        condition: 'count',
        conditionOperator: 'less than or equal to',
        conditionValue: '5',
      };

      const wrapper = mount(PolicyConstraint, {
        props: { constraint },
      });

      expect(wrapper.text()).toContain('The data can be used a maximum of 5 times');
    });

    it('renders count constraint with different numeric values', () => {
      const constraint: ContractAccessPolicyConstraint = {
        condition: 'count',
        conditionOperator: 'less than or equal to',
        conditionValue: '100',
      };

      const wrapper = mount(PolicyConstraint, {
        props: { constraint },
      });

      expect(wrapper.text()).toContain('The data can be used a maximum of 100 times');
    });
  });

  describe('DateTime constraint', () => {
    it('renders dateTime constraint with "from" when operator is greater than or equal to', () => {
      const testDate = '2024-01-15T10:30:00Z';
      const constraint: ContractAccessPolicyConstraint = {
        condition: 'dateTime',
        conditionOperator: 'greater than or equal to',
        conditionValue: testDate,
      };

      const wrapper = mount(PolicyConstraint, {
        props: { constraint },
      });

      const expectedDateString = new Date(testDate).toLocaleString();
      expect(wrapper.text()).toContain(`The data can be used from ${expectedDateString}`);
    });

    it('renders dateTime constraint with "until" when operator is less than or equal to', () => {
      const testDate = '2024-12-31T23:59:59Z';
      const constraint: ContractAccessPolicyConstraint = {
        condition: 'dateTime',
        conditionOperator: 'less than or equal to',
        conditionValue: testDate,
      };

      const wrapper = mount(PolicyConstraint, {
        props: { constraint },
      });

      const expectedDateString = new Date(testDate).toLocaleString();
      expect(wrapper.text()).toContain(`The data can be used until ${expectedDateString}`);
    });

    it('renders dateTime constraint with "at" when operator is equal to', () => {
      const testDate = '2024-06-15T14:30:00Z';
      const constraint: ContractAccessPolicyConstraint = {
        condition: 'dateTime',
        conditionOperator: 'equal to',
        conditionValue: testDate,
      };

      const wrapper = mount(PolicyConstraint, {
        props: { constraint },
      });

      const expectedDateString = new Date(testDate).toLocaleString();
      expect(wrapper.text()).toContain(`The data can be used at ${expectedDateString}`);
    });

    it('handles undefined return from getConstraintOperatorPhrase gracefully', () => {
      const testDate = '2024-06-15T14:30:00Z';
      const constraint: ContractAccessPolicyConstraint = {
        condition: 'dateTime',
        conditionOperator: 'unknown operator',
        conditionValue: testDate,
      };

      const wrapper = mount(PolicyConstraint, {
        props: { constraint },
      });

      const expectedDateString = new Date(testDate).toLocaleString();
      // When getConstraintOperatorPhrase returns undefined, it shows as an empty string in the template
      expect(wrapper.text()).toContain(`The data can be used  ${expectedDateString}`);
    });

    it('handles invalid date strings gracefully', () => {
      const constraint: ContractAccessPolicyConstraint = {
        condition: 'dateTime',
        conditionOperator: 'greater than or equal to',
        conditionValue: 'invalid-date',
      };

      const wrapper = mount(PolicyConstraint, {
        props: { constraint },
      });

      // Invalid dates should still be processed through Date constructor
      const expectedDateString = new Date('invalid-date').toLocaleString();
      expect(wrapper.text()).toContain(`The data can be used from ${expectedDateString}`);
    });
  });

  describe('Other conditions', () => {
    it('renders empty content when constraint condition does not match any known patterns', () => {
      const constraint: ContractAccessPolicyConstraint = {
        condition: 'unknown' as any,
        conditionOperator: 'equals',
        conditionValue: 'some value',
      };

      const wrapper = mount(PolicyConstraint, {
        props: { constraint },
      });

      // Should still render the li element but with no visible text content
      expect(wrapper.find('li').exists()).toBe(true);
      expect(wrapper.find('span').exists()).toBe(false);
    });
  });

  describe('Component structure', () => {
    it('always renders as a list item with correct CSS classes', () => {
      const constraint: ContractAccessPolicyConstraint = {
        condition: 'count',
        conditionOperator: 'less than or equal to',
        conditionValue: '3',
      };

      const wrapper = mount(PolicyConstraint, {
        props: { constraint },
      });

      const listItem = wrapper.find('li');
      expect(listItem.exists()).toBe(true);
      expect(listItem.classes()).toContain('policy-constraint');
      expect(listItem.classes()).toContain('list-item');
      expect(listItem.classes()).toContain('gap-4');
    });

    it('contains a span element for content when condition matches', () => {
      const constraint: ContractAccessPolicyConstraint = {
        condition: 'deletion',
        conditionOperator: 'equals',
        conditionValue: 'after_use',
      };

      const wrapper = mount(PolicyConstraint, {
        props: { constraint },
      });

      expect(wrapper.find('span').exists()).toBe(true);
    });
  });

  describe('Props validation', () => {
    it('accepts valid constraint prop', () => {
      const constraint: ContractAccessPolicyConstraint = {
        condition: 'count',
        conditionOperator: 'less than or equal to',
        conditionValue: '10',
      };

      expect(() => {
        mount(PolicyConstraint, {
          props: { constraint },
        });
      }).not.toThrow();
    });
  });
});
