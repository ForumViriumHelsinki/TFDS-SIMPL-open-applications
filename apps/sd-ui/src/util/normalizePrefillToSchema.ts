type JsonSchemaLike = {
  type?: string;
  properties?: Record<string, JsonSchemaLike>;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const localName = (key: string): string => {
  const hashSplit = key.split('#');
  const lastHashPart = hashSplit[hashSplit.length - 1] ?? key;
  const slashSplit = lastHashPart.split('/');
  const lastSlashPart = slashSplit[slashSplit.length - 1] ?? lastHashPart;
  const colonSplit = lastSlashPart.split(':');
  return colonSplit[colonSplit.length - 1] ?? lastSlashPart;
};

const findMatchingSourceKey = (
  source: Record<string, unknown>,
  targetKey: string
): string | undefined => {
  if (Object.prototype.hasOwnProperty.call(source, targetKey)) {
    return targetKey;
  }

  const targetLocalName = localName(targetKey);

  return Object.keys(source).find((sourceKey) => localName(sourceKey) === targetLocalName);
};

const mapObjectToSchema = (
  value: Record<string, unknown>,
  schema: JsonSchemaLike
): Record<string, unknown> => {
  if (!schema.properties || Object.keys(schema.properties).length === 0) {
    return value;
  }

  const mapped: Record<string, unknown> = {};

  for (const [schemaKey, propertySchema] of Object.entries(schema.properties)) {
    const sourceKey = findMatchingSourceKey(value, schemaKey);
    if (!sourceKey) {
      continue;
    }

    const sourceValue = value[sourceKey];

    if (
      propertySchema.type === 'object' &&
      propertySchema.properties &&
      isPlainObject(sourceValue)
    ) {
      mapped[schemaKey] = mapObjectToSchema(sourceValue, propertySchema);
      continue;
    }

    mapped[schemaKey] = sourceValue;
  }

  return Object.keys(mapped).length > 0 ? mapped : value;
};

export const normalizePrefillToSchema = (
  prefillData: Record<string, unknown>,
  schema: JsonSchemaLike | undefined
): Record<string, unknown> => {
  if (!schema || !schema.properties || Object.keys(schema.properties).length === 0) {
    return prefillData;
  }

  const mappedTopLevel = mapObjectToSchema(prefillData, schema);
  const schemaKeys = Object.keys(schema.properties);
  const hasAnyTopLevelMatch = schemaKeys.some((schemaKey) =>
    Object.prototype.hasOwnProperty.call(mappedTopLevel, schemaKey)
  );

  if (hasAnyTopLevelMatch) {
    return mappedTopLevel;
  }

  if (schemaKeys.length !== 1) {
    return mappedTopLevel;
  }

  const onlyKey = schemaKeys[0];
  if (!onlyKey) {
    return mappedTopLevel;
  }
  const nestedSchema = schema.properties[onlyKey];
  if (!nestedSchema || nestedSchema.type !== 'object' || !nestedSchema.properties) {
    return mappedTopLevel;
  }

  const nestedMapped = mapObjectToSchema(prefillData, nestedSchema);
  const hasNestedMatches = Object.keys(nestedSchema.properties).some((nestedKey) =>
    Object.prototype.hasOwnProperty.call(nestedMapped, nestedKey)
  );

  if (!hasNestedMatches) {
    return mappedTopLevel;
  }

  return {
    [onlyKey]: nestedMapped,
  };
};
