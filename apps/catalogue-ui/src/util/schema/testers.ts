import { rankWith, scopeEndsWith } from '@jsonforms/core';
import { accessPolicyFieldName, usagePolicyFieldName } from './renderers';

export const accessPolicyTester = rankWith(
  3, //increase rank as needed
  scopeEndsWith(accessPolicyFieldName)
);

export const usagePolicyTester = rankWith(
  3, //increase rank as needed
  scopeEndsWith(usagePolicyFieldName)
);
