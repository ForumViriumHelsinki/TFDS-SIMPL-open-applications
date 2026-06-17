import type { JSONSchema4 } from 'json-schema';

export const filterRootToOfferingShape = (
  root: Record<string, JSONSchema4>
): Record<string, JSONSchema4> => {
  const rootEntries = Object.entries(root);
  const offeringShape = rootEntries.find(([key]) => key.endsWith('OfferingShape'));
  return offeringShape ? { [offeringShape[0]]: offeringShape[1] } : root;
};
