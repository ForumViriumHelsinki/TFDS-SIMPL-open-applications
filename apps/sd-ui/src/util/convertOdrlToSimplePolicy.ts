/**
 * Converts ODRL-formatted policy strings (as stored by the catalogue API)
 * back to the simple format expected by the AccessPolicyRenderer and
 * UsagePolicyRenderer form controls.
 *
 * During publish, the server transforms simple policy data → ODRL JSON-LD
 * (via transformAccessPolicyData / transformUsagePolicyData in datatransformers.ts).
 * This module reverses that transformation so that prefill data from
 * "Create New Version" flows correctly into the form renderers.
 */

interface OdrlConstraint {
  leftOperand: string;
  operator: string;
  rightOperand: string;
}

interface OdrlPermission {
  assignee: { uid: string };
  action: string[];
  constraint?: OdrlConstraint[];
}

interface OdrlPolicy {
  permission?: OdrlPermission[];
  [key: string]: unknown;
}

const uriEndsWith = (uri: string, segment: string): boolean =>
  uri === segment || uri.endsWith(`/${segment}`) || uri.endsWith(`#${segment}`);

/** Converts a camelCase or lowercase action name to UPPER_SNAKE_CASE. */
const toUpperSnakeCase = (s: string): string => s.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase();

/** Extracts the short action name from a possibly full URI and uppercases it. */
const normalizeAction = (action: string): string => {
  const short = action.includes('/') ? action.split('/').pop() || action : action;
  return toUpperSnakeCase(short);
};

/** Normalises action URIs in an already-simple-format array (returns original string if unchanged). */
const normalizeSimpleFormatActions = (parsed: Record<string, unknown>[], policyString: string): string => {
  let changed = false;
  const normalised = parsed.map((entry) => {
    if (typeof entry.action === 'string') {
      const norm = normalizeAction(entry.action);
      if (norm !== entry.action) {
        changed = true;
        return { ...entry, action: norm };
      }
    }
    return entry;
  });
  return changed ? JSON.stringify(normalised) : policyString;
};

/**
 * Converts an ODRL access-policy string to the simple
 * AccessPolicyPermission[] format that the form renderer expects.
 *
 * Returns the original string unchanged if it is already in simple format
 * (i.e. parses as an array) or is not recognisable ODRL.
 */
export const convertOdrlAccessPolicy = (policyString: string): string => {
  try {
    const parsed = JSON.parse(policyString);

    // Already in simple format – normalise action URIs
    if (Array.isArray(parsed)) return normalizeSimpleFormatActions(parsed, policyString);

    // Not an ODRL structure
    if (typeof parsed !== 'object' || !parsed.permission) return policyString;

    const odrl = parsed as OdrlPolicy;
    const permissions = odrl.permission ?? [];

    const simple = permissions.map((perm) => {
      const fullAction = perm.action?.[0] ?? '';
      const result: Record<string, unknown> = {
        assignee: perm.assignee?.uid ?? '',
        action: normalizeAction(fullAction),
      };

      if (perm.constraint) {
        const fromConstraint = perm.constraint.find(
          (c) => uriEndsWith(c.leftOperand, 'dateTime') && uriEndsWith(c.operator, 'gteq')
        );
        const toConstraint = perm.constraint.find(
          (c) => uriEndsWith(c.leftOperand, 'dateTime') && uriEndsWith(c.operator, 'lteq')
        );

        if (fromConstraint) result.fromDatetime = fromConstraint.rightOperand;
        if (toConstraint) result.toDatetime = toConstraint.rightOperand;
      }

      return result;
    });

    return JSON.stringify(simple);
  } catch {
    return policyString;
  }
};

/**
 * Converts an ODRL usage-policy string to the simple
 * UsagePolicyPermission[] format that the form renderer expects.
 *
 * Returns the original string unchanged if it is already in simple format
 * (i.e. parses as an array) or is not recognisable ODRL.
 */
export const convertOdrlUsagePolicy = (policyString: string): string => {
  try {
    const parsed = JSON.parse(policyString);

    // Already in simple format – normalise action URIs
    if (Array.isArray(parsed)) return normalizeSimpleFormatActions(parsed, policyString);

    // Not an ODRL structure
    if (typeof parsed !== 'object' || !parsed.permission) return policyString;

    const odrl = parsed as OdrlPolicy;
    const permissions = odrl.permission ?? [];

    const simple = permissions.map((perm) => {
      const assignee = perm.assignee?.uid ?? '';
      const action = perm.action?.[0] ?? '';
      const constraints: Record<string, unknown>[] = [];

      if (perm.constraint) {
        const countConstraint = perm.constraint.find((c) => uriEndsWith(c.leftOperand, 'count'));
        if (countConstraint) {
          constraints.push({
            type: 'RestrictedNumber',
            assignee,
            maxCount: parseInt(countConstraint.rightOperand, 10) || 1,
          });
        }

        const deletionConstraint = perm.constraint.find((c) =>
          uriEndsWith(c.leftOperand, 'deletion')
        );
        if (deletionConstraint) {
          constraints.push({
            type: 'Deletion',
            assignee,
            afterUse: true,
          });
        }

        const fromConstraint = perm.constraint.find(
          (c) => uriEndsWith(c.leftOperand, 'dateTime') && uriEndsWith(c.operator, 'gteq')
        );
        const toConstraint = perm.constraint.find(
          (c) => uriEndsWith(c.leftOperand, 'dateTime') && uriEndsWith(c.operator, 'lteq')
        );
        if (fromConstraint || toConstraint) {
          const duration: Record<string, unknown> = {
            type: 'RestrictedDuration',
            assignee,
          };
          if (fromConstraint) duration.fromDatetime = fromConstraint.rightOperand;
          if (toConstraint) duration.toDatetime = toConstraint.rightOperand;
          constraints.push(duration);
        }
      }

      return { assignee, action: normalizeAction(action), constraints };
    });

    return JSON.stringify(simple);
  } catch {
    return policyString;
  }
};

/**
 * Walks the prefill data and converts any ODRL-formatted access/usage
 * policy strings inside `simpl:servicePolicy` back to the simple format
 * expected by the creation wizard's form renderers.
 *
 * Safe to call on data that is already in simple format (no-op).
 */
export const convertServicePolicyOdrlToSimpleFormat = (
  formData: Record<string, unknown>
): Record<string, unknown> => {
  const servicePolicy = formData['simpl:servicePolicy'];
  if (!servicePolicy || typeof servicePolicy !== 'object' || Array.isArray(servicePolicy)) {
    return formData;
  }

  const sp = servicePolicy as Record<string, unknown>;
  const updatedSp = { ...sp };
  let changed = false;

  if (typeof sp['simpl:access-policy'] === 'string') {
    const converted = convertOdrlAccessPolicy(sp['simpl:access-policy']);
    if (converted !== sp['simpl:access-policy']) {
      updatedSp['simpl:access-policy'] = converted;
      changed = true;
    }
  }

  if (typeof sp['simpl:usage-policy'] === 'string') {
    const converted = convertOdrlUsagePolicy(sp['simpl:usage-policy']);
    if (converted !== sp['simpl:usage-policy']) {
      updatedSp['simpl:usage-policy'] = converted;
      changed = true;
    }
  }

  if (!changed) return formData;

  return { ...formData, 'simpl:servicePolicy': updatedSp };
};
