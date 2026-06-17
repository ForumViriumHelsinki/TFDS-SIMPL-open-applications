import type { Quad } from '@rdfjs/types';
import type { JSONSchema4, JSONSchema4TypeName } from 'json-schema';
import { toCompactURI } from './util';
import type { SimplConfigurePropertyValue, SimplSDSchemaUIVariant } from '@/types/ttlParser';
import { capitalizeFirstLetter } from '@simpl/vue-components';

export const mapXsdTypetoJSONSchema = (
  xsdType: string
): { type: JSONSchema4TypeName; format?: string } => {
  switch (xsdType) {
    case 'http://www.w3.org/2001/XMLSchema#string':
      return { type: 'string' };
    case 'http://www.w3.org/2001/XMLSchema#integer':
      return { type: 'integer' };
    case 'http://www.w3.org/2001/XMLSchema#boolean':
      return { type: 'boolean' };
    case 'http://www.w3.org/2001/XMLSchema#number':
      return { type: 'number' };
    case 'http://www.w3.org/2001/XMLSchema#decimal':
      return { type: 'number' };
    case 'http://www.w3.org/2001/XMLSchema#anyURI':
      return { type: 'string', format: 'uri' };
    case 'http://www.w3.org/2001/XMLSchema#dateTime':
      return { type: 'string', format: 'date-time' };
    case 'http://www.w3.org/2001/XMLSchema#date':
      return { type: 'string', format: 'date' };
    case 'http://www.w3.org/2001/XMLSchema#time':
      return { type: 'string', format: 'time' };
    default:
      return { type: 'string' };
  }
};

export const handleMinLengthProperty = (
  quads: Quad[],
  node: Quad,
  shapeObject: JSONSchema4,
  propertyName: string
) => {
  if (!shapeObject.properties) {
    throw new Error('properties not defined on jsonSchema object');
  }

  const value = parseInt(node.object.value, 10);

  if (shapeObject.properties[propertyName].type === 'array') {
    shapeObject.properties[propertyName].items ??= {};
    if (!Array.isArray(shapeObject.properties[propertyName].items)) {
      const items = shapeObject.properties[propertyName].items;
      items.minLength = value;
    }
  } else {
    shapeObject.properties[propertyName].minLength = value;
  }
};

export const handleDatatypeProperty = (
  _quads: Quad[],
  node: Quad,
  shapeObject: JSONSchema4,
  propertyName: string,
  prefixes: Record<string, string>
) => {
  // we only handle XSD vocabulary atm and only values that we can map to JSONSchema4

  let { type, format } = mapXsdTypetoJSONSchema(node.object.value);
  const rdfType = toCompactURI(node.object.value, prefixes);

  if (!shapeObject.properties) {
    throw new Error('properties not defined on jsonSchema object');
  }

  if (shapeObject.properties[propertyName].type === 'array') {
    shapeObject.properties[propertyName].items ??= {};
    if (!Array.isArray(shapeObject.properties[propertyName].items)) {
      const items = shapeObject.properties[propertyName].items;
      items.type = type;
      items.rdfType = rdfType;
      if (format) {
        items.format = format;
      }
    }
  } else {
    if (!shapeObject.properties) {
      throw new Error('properties not defined on jsonSchema object');
    }
    shapeObject.properties[propertyName].type = type;
    shapeObject.properties[propertyName].rdfType = rdfType;
    if (format) {
      shapeObject.properties[propertyName].format = format;
    }
  }
};

export const handleMinInclusiveProperty = (
  _quads: Quad[],
  node: Quad,
  shapeObject: JSONSchema4,
  propertyName: string
) => {
  if (!shapeObject.properties) {
    throw new Error('properties not defined on jsonSchema object');
  }

  const value = parseFloat(node.object.value);
  shapeObject.properties[propertyName].minimum = value;
};

export const handleMaxInclusiveProperty = (
  _quads: Quad[],
  node: Quad,
  shapeObject: JSONSchema4,
  propertyName: string
) => {
  if (!shapeObject.properties) {
    throw new Error('properties not defined on jsonSchema object');
  }
  const value = parseFloat(node.object.value);
  shapeObject.properties[propertyName].maximum = value;
};

const parseList = (quads: Quad[], node: Quad, list: string[]) => {
  const subjNodes = quads.filter((quad) => quad.subject.value === node.object.value);
  let restNodes: Quad[] = [];

  const first = subjNodes.find(
    (quad) => quad.predicate.value === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#first'
  );
  if (!first) {
    throw new Error('No enum values found for SHACL in property');
  }
  list.push(first.object.value);

  const rest = subjNodes.find(
    (quad) => quad.predicate.value === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#rest'
  );
  if (rest && rest.object.value !== 'http://www.w3.org/1999/02/22-rdf-syntax-ns#nil') {
    restNodes = quads.filter((quad) => quad.subject.value === rest.object.value);
    parseRest(restNodes, quads, rest, list);
  }
};

const parseRest = (rest: Quad[], quads: Quad[], node: Quad, list: string[]) => {
  const first = rest.find(
    (quad) => quad.predicate.value === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#first'
  );
  if (!first) {
    throw new Error('No enum values found for SHACL in property');
  }
  list.push(first.object.value);

  const restNode = rest.find(
    (quad) => quad.predicate.value === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#rest'
  );
  if (restNode && restNode.object.value !== 'http://www.w3.org/1999/02/22-rdf-syntax-ns#nil') {
    const restNodes = quads.filter((quad) => quad.subject.value === restNode.object.value);
    parseRest(restNodes, quads, restNode, list);
  }
};

export const handleInProperty = (
  quads: Quad[],
  node: Quad,
  shapeObject: JSONSchema4,
  propertyName: string
) => {
  let enumValues: string[] = [];
  parseList(quads, node, enumValues);

  if (!shapeObject.properties) {
    throw new Error('properties not defined on jsonSchema object');
  }
  shapeObject.properties[propertyName].enum = [...enumValues];

  return enumValues;
};

export const handleMaxLengthProperty = (
  quads: Quad[],
  node: Quad,
  shapeObject: JSONSchema4,
  propertyName: string
) => {
  if (!shapeObject.properties) {
    throw new Error('properties not defined on jsonSchema object');
  }

  const value = parseInt(node.object.value, 10);

  if (shapeObject.properties[propertyName].type === 'array') {
    shapeObject.properties[propertyName].items ??= {};
    if (Array.isArray(shapeObject.properties[propertyName].items)) {
      const items = shapeObject.properties[propertyName].items as JSONSchema4;
      items.maxLength = value;
    }
  } else {
    shapeObject.properties[propertyName].maxLength = value;
  }
};

export const handleDescriptionProperty = (
  quads: Quad[],
  node: Quad,
  shapeObject: JSONSchema4,
  propertyName: string
) => {
  if (!shapeObject.properties) {
    throw new Error('properties not defined on jsonSchema object');
  }
  shapeObject.properties[propertyName].description = node.object.value;
};

export const handleNameProperty = (
  quads: Quad[],
  node: Quad,
  shapeObject: JSONSchema4,
  propertyName: string
) => {
  if (!shapeObject.properties) {
    throw new Error('properties not defined on jsonSchema object');
  }
  shapeObject.properties[propertyName].title = capitalizeFirstLetter(node.object.value);
};

function parseEscapeChars(input: string) {
  // Replace all double backslashes with a single backslash
  return input.replace(/\\\\/g, '\\');
}

export const handlePatternProperty = (
  quads: Quad[],
  node: Quad,
  shapeObject: JSONSchema4,
  propertyName: string
) => {
  if (!shapeObject.properties) {
    throw new Error('properties not defined on jsonSchema object');
  }

  const rawPattern = node.object.value;
  // for some reason the regex pattern is escaped in the TTL schemas, we need to remove the escaping
  const removedEscapedChars = parseEscapeChars(rawPattern);

  try {
    // Test if the pattern is valid
    new RegExp(removedEscapedChars, 'u');

    // If valid, assign the pattern without flags
    shapeObject.properties[propertyName].pattern = removedEscapedChars;
  } catch (error) {
    console.warn(`Invalid regex pattern for ${propertyName}: ${rawPattern}`);
  }
};

export const addRequiredProperty = (shapeObject: JSONSchema4, propertyName: string) => {
  shapeObject.required ??= [];
  if (Array.isArray(shapeObject.required)) {
    const hasPropertyAleady = shapeObject.required.find((prop) => prop === propertyName);
    if (!hasPropertyAleady) {
      shapeObject.required.push(propertyName);
    }
  }
  return shapeObject;
};

export const handleMinCountProperty = (
  quads: Quad[],
  node: Quad,
  shapeObject: JSONSchema4,
  propertyName: string
) => {
  const value = parseInt(node.object.value, 10);
  if (value === 0) {
    return shapeObject;
  }
  if (value === 1) {
    addRequiredProperty(shapeObject, propertyName);
    return shapeObject;
  }
  // we assume value is now > 1 and we implement minItems and make the property into an array
  shapeObject.type = 'array';
  shapeObject.minItems = value;

  return shapeObject;
};

export const handleMaxCountProperty = (
  quads: Quad[],
  node: Quad,
  shapeObject: JSONSchema4,
  propertyName: string
) => {
  const value = parseInt(node.object.value, 10);

  if (value === 1) {
    return shapeObject;
  }

  if (shapeObject.minItems && value < shapeObject.minItems) {
    throw new Error('maxCount cannot be less than minCount');
  }

  if (shapeObject.properties) {
    shapeObject.properties[propertyName].type = 'array';
    shapeObject.properties[propertyName].maxItems = value;
    shapeObject.properties[propertyName].items = {
      title: 'Item',
    };
  } else {
    shapeObject.type = 'array';
    shapeObject.maxItems = value;
    shapeObject.items = {};
  }
  // we assume value is now > 1 and we implement maxItems
};

// returns false if the field should be deleted
export const handleSimplConfigureProperty = (
  quads: Quad[],
  node: Quad,
  shapeObject: JSONSchema4,
  propertyName: string,
  schemaUIType: SimplSDSchemaUIVariant = 'default'
): JSONSchema4 | false => {
  let enumValues: SimplConfigurePropertyValue[] = [];
  parseList(quads, node, enumValues);

  if (!shapeObject.properties) {
    throw new Error('properties not defined on jsonSchema object');
  }

  if (schemaUIType === 'sdCreation' && enumValues.includes('requiredOnFrontendOnly')) {
    addRequiredProperty(shapeObject, propertyName);
  }

  // advanced search should only display fields that specifically have its setting
  // we don't want sections to be displayed in advanced search that are not meant to be used for it
  // but sections are not necessarily marked with the setting
  // so we only delete children, and let deleteNodesWithEmptyProperties deal with the rest
  if (
    schemaUIType === 'advancedSearch' &&
    !enumValues.includes('useForAdvancedSearch') &&
    shapeObject.child
  ) {
    return false;
  }

  // sd creation should not have fields that are hidden in frontend, and they must not be required
  if (schemaUIType === 'sdCreation' && enumValues.includes('hiddenInFrontend')) {
    if (Array.isArray(shapeObject.required) && shapeObject.required.includes(propertyName)) {
      shapeObject.required = shapeObject.required.filter((prop) => prop !== propertyName);
    }
    return false;
  }

  return shapeObject;
};
