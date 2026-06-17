/**
 * Converts a credentialSubject from the Search API response back to
 * JSON Forms data format, reversing the `formatDataToJsonLd` transformation.
 *
 * Forward (formatDataToJsonLd):
 *   - Adds `rdf:type` to each object
 *   - Wraps non-string/number values as `{ "@value": v, "@type": t }`
 *   - Adds `@context`, `@id` at root
 *
 * Reverse (this function):
 *   - Strips `rdf:type`, `@context`, `@id`, `@type` from objects
 *   - Unwraps `{ "@value": v }` → v
 *   - Preserves `simpl:` prefixed keys as JSON Forms expects
 */

const KEYS_TO_STRIP = new Set(['@context', '@id', '@type', 'rdf:type']);

const isValueWrapper = (obj: Record<string, unknown>): boolean => {
  return '@value' in obj;
};

const convertProperty = (value: unknown): unknown => {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => convertProperty(item));
  }

  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;

    // Unwrap { "@value": x } or { "@value": x, "@type": t }
    if (isValueWrapper(obj)) {
      return obj['@value'];
    }

    // Recurse into object, stripping metadata keys
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj)) {
      if (KEYS_TO_STRIP.has(key)) {
        continue;
      }
      result[key] = convertProperty(val);
    }
    return result;
  }

  // Primitive values (string, number, boolean) pass through
  return value;
};

/**
 * Converts a credentialSubject from the API response to JSON Forms data format.
 *
 * @param credentialSubject - The credentialSubject from a SearchAPISelfDescriptionDocument
 * @returns Data in JSON Forms format suitable for pre-filling the creation wizard
 */
export const credentialSubjectToFormData = (
  credentialSubject: Record<string, unknown>
): Record<string, unknown> => {
  return convertProperty(credentialSubject) as Record<string, unknown>;
};
