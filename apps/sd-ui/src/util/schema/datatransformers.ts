import type { AccessPolicyPermission, UsagePolicyPermission } from '@/types/accessPolicy';
import { getAccessPolicyJsonLd, getUsagePolicyJsonLd } from '@/services/sdtooling';

const transformAccessPolicyData = async (
  servicePolicyData: Record<string, unknown>,
  id: string,
  token: string
) => {
  if (!servicePolicyData['simpl:access-policy']) {
    return;
  }

  const policyBody = {
    resourceUri: id,
    permissions: JSON.parse(
      servicePolicyData['simpl:access-policy'] as string
    ) as AccessPolicyPermission[],
  };

  const odrlPolicyResponse = await getAccessPolicyJsonLd(policyBody, token);

  if (!odrlPolicyResponse.ok) {
    const errorData = await odrlPolicyResponse.json();
    throw new Error(errorData.errorTitle || 'Failed to fetch access policy', {
      cause: errorData.errorMessage || 'An error occurred while fetching the access policy.',
    });
  }
  servicePolicyData['simpl:access-policy'] = JSON.stringify(await odrlPolicyResponse.json());
};

const transformUsagePolicyData = async (
  servicePolicyData: Record<string, unknown>,
  id: string,
  token: string
) => {
  if (!servicePolicyData['simpl:usage-policy']) {
    return;
  }

  const policyBody = {
    resourceUri: id,
    permissions: JSON.parse(
      servicePolicyData['simpl:usage-policy'] as string
    ) as UsagePolicyPermission[],
  };

  const odrlPolicyResponse = await getUsagePolicyJsonLd(policyBody, token);
  if (!odrlPolicyResponse.ok) {
    const errorData = await odrlPolicyResponse.json();
    throw new Error(errorData.errorTitle || 'Failed to fetch usage policy', {
      cause: errorData.errorMessage || 'An error occurred while fetching the usage policy.',
    });
  }
  servicePolicyData['simpl:usage-policy'] = JSON.stringify(await odrlPolicyResponse.json());
};

export const transformData = async (
  schemaData: Record<string, unknown>,
  id: string,
  token: string
): Promise<Record<string, unknown>> => {
  const data = JSON.parse(JSON.stringify(schemaData));
  if (data['simpl:servicePolicy']) {
    await transformAccessPolicyData(data['simpl:servicePolicy'], id, token);
    await transformUsagePolicyData(data['simpl:servicePolicy'], id, token);
  }

  return data;
};
