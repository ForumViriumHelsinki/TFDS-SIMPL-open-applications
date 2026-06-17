export interface AccessPolicyPermission {
  assignee: string;
  action: string;
  fromDatetime?: string;
  toDatetime?: string;
}

export interface AccessPoliciesDTO {
  resourceUri: string;
  permissions: AccessPolicyPermission[];
}

export interface AccessPoliciesODRL {
  profile: string;
  target: string;
  assigner: {
    uid: string;
    role: string;
  };
  '@uid': string;
  '@context': string;
  '@type': string;
  permission: {
    target: string;
    assignee: {
      uid: string;
      role: string;
    };
    action: {
      name: string;
    }[];
    constraint: {
      leftOperand: string;
      operator: string;
      rightOperand: string;
    }[];
  }[];
}

export interface ServicePolicy {
  'simpl:access-policy': string;
  'simpl:usage-policy': string;
  'simpl:dataProtectionRegime': string;
}

export interface FromAndToDateTime {
  fromDate: string;
  fromTime: string;
  toDate: string;
  toTime: string;
}

export type UsagePolicyType = 'Deletion' | 'RestrictedDuration' | 'RestrictedNumber';

export interface UsagePolicyConstraint {
  type: UsagePolicyType;
  assignee: string;
}

export interface DeletionUsagePolicyConstraint extends UsagePolicyConstraint {
  afterUse: boolean;
}

export interface RestrictedDurationUsagePolicyConstraint extends UsagePolicyConstraint {
  fromDatetime: string;
  toDatetime: string;
}

export interface RestrictedNumberUsagePolicyConstraint extends UsagePolicyConstraint {
  maxCount: number;
}

export interface UsagePoliciesDTO {
  resourceUri: string;
  permissions: UsagePolicyPermission[];
}

export interface UsagePolicyPermission {
  assignee: string;
  action: string;
  constraints: UsagePolicyConstraint[];
}

export interface PolicyIdentityAttribute {
  identifier: string;
  code: string;
}
