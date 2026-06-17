import { v4 as uuidv4 } from 'uuid';
import type { JsonSchema4 } from '@jsonforms/core';
import jsonld from 'jsonld';

type FormDataType =
  | string
  | number
  | Record<string, string | object | number | Array<FormDataType>>
  | Array<FormDataType>;

export interface ExtendedJsonSchema4 extends JsonSchema4 {
  rdfType?: string;
  properties?: Record<string, ExtendedJsonSchema4>;
}

const isStringOrNumberProperty = (schema: ExtendedJsonSchema4) => {
  return schema.rdfType === 'xsd:string' || schema.rdfType === 'xsd:number';
};

const parseDataProperty = (
  data: Record<string, FormDataType> | Record<string, FormDataType>[],
  schema: ExtendedJsonSchema4,
  context: Record<string, string>
) => {
  if (schema.type === 'object') {
    const formattedData: Record<string, unknown> = {
      'rdf:type': {
        '@id': schema.rdfType,
      },
    };
    Object.keys(data).forEach((propertyKey) => {
      const propertyValue = data[propertyKey];
      if (!schema.properties?.[propertyKey]) {
        throw new Error(`${propertyKey} property not found in schema`);
      }
      formattedData[propertyKey] = parseDataProperty(
        propertyValue as Record<string, FormDataType>,
        schema.properties[propertyKey],
        context
      );
    });
    return formattedData;
  }
  if (schema.type === 'array' && Array.isArray(data)) {
    const formattedData: Array<unknown> = [];

    data.forEach((element, index) => {
      if (!schema.items) {
        throw new Error('Items not defined in schema');
      }

      // TODO: items can be array in very rare ocasion when values are 'fixed'
      formattedData.push(parseDataProperty(element, schema.items as ExtendedJsonSchema4, context));
    });
    return formattedData;
  } else {
    const _ = true; // Semi useful statement to fix SonarQube

    if (isStringOrNumberProperty(schema)) {
      return data;
    } else {
      return {
        '@value': data,
        '@type': schema.rdfType,
      };
    }
  }
};

// currently going at it manual, can maybe do it with n3 or rdfjs

export const formatDataToJsonLd = async (
  data: Record<string, unknown>,
  schema: ExtendedJsonSchema4,
  context: Record<string, string>
) => {
  const typeWithoutPrefix = schema.rdfType?.split(':')[1];

  // should be done by the backend
  const uuid = uuidv4();

  const jsonFormattedData: Record<string, unknown> = {
    '@context': context,
    '@id': `did:web:registry.gaia-x.eu:${typeWithoutPrefix}:${uuid}`,
    'rdf:type': {
      '@id': schema.rdfType,
    },
  };

  for (const propertyKey of Object.keys(data)) {
    const propertyValue = data[propertyKey];
    if (!schema.properties?.[propertyKey]) {
      throw new Error(`${propertyKey} property not found in schema`);
    }
    jsonFormattedData[propertyKey] = parseDataProperty(
      propertyValue as Record<string, FormDataType>,
      schema.properties[propertyKey],
      context
    );
  }

  const formattedJson = jsonld.compact(jsonFormattedData, context);
  return formattedJson;
};
