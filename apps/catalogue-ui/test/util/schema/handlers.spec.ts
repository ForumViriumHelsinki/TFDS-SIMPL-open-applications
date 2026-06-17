import { describe, it, expect, vi } from 'vitest';
import {
  handleInProperty,
  handleMinLengthProperty,
  handleDatatypeProperty,
  handleMaxLengthProperty,
  handleDescriptionProperty,
  handlePatternProperty,
  handleMinCountProperty,
  handleMaxCountProperty,
  addRequiredProperty,
  mapXsdTypetoJSONSchema,
  handleMinInclusiveProperty,
  handleMaxInclusiveProperty,
} from '@/util/schema/handlers';
import type { Quad } from '@rdfjs/types';
import type { JSONSchema4 } from 'json-schema';

describe('handlers.ts', () => {
  describe('mapXsdTypetoJSONSchema', () => {
    it('maps XSD types to JSON Schema types and formats', () => {
      const xsdTypes = [
        'http://www.w3.org/2001/XMLSchema#string',
        'http://www.w3.org/2001/XMLSchema#integer',
        'http://www.w3.org/2001/XMLSchema#decimal',
        'http://www.w3.org/2001/XMLSchema#boolean',
        'http://www.w3.org/2001/XMLSchema#number',
        'http://www.w3.org/2001/XMLSchema#dateTime',
        'http://www.w3.org/2001/XMLSchema#date',
        'http://www.w3.org/2001/XMLSchema#time',
      ];
      const expectedResults = [
        { type: 'string' },
        { type: 'integer' },
        { type: 'number' },
        { type: 'boolean' },
        { type: 'number' },
        { type: 'string', format: 'date-time' },
        { type: 'string', format: 'date' },
        { type: 'string', format: 'time' },
      ];

      xsdTypes.forEach((xsdType, index) => {
        const result = mapXsdTypetoJSONSchema(xsdType);
        expect(result).toEqual(expectedResults[index]);
      });
    });
    it('returns an empty object for unsupported XSD types', () => {
      const unsupportedXsdType = 'http://www.w3.org/2001/XMLSchema#unsupportedType';
      const result = mapXsdTypetoJSONSchema(unsupportedXsdType);
      expect(result).toEqual({ type: 'string' });
    });
  });

  describe('handleInProperty', () => {
    it('parses enum values correctly from SHACL quads', () => {
      const quads: Quad[] = [
        {
          subject: { value: 'node1' },
          predicate: { value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#first' },
          object: { value: 'value1' },
        },
        {
          subject: { value: 'node1' },
          predicate: { value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#rest' },
          object: { value: 'node2' },
        },
        {
          subject: { value: 'node2' },
          predicate: { value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#first' },
          object: { value: 'value2' },
        },
        {
          subject: { value: 'node2' },
          predicate: { value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#rest' },
          object: { value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#nil' },
        },
      ];

      const node: Quad = {
        subject: { value: 'shapeNode' },
        predicate: { value: 'http://www.w3.org/ns/shacl#in' },
        object: { value: 'node1' },
      };

      const shapeObject: JSONSchema4 = {
        properties: {
          testProperty: {},
        },
      };

      const result = handleInProperty(quads, node, shapeObject, 'testProperty');

      expect(result).toEqual(['value1', 'value2']);
      expect(shapeObject.properties?.testProperty?.enum).toEqual(['value1', 'value2']);
    });
  });

  describe('handleMinLengthProperty', () => {
    it('sets the minLength property for a string field', () => {
      const quads: Quad[] = [];
      const node: Quad = {
        subject: { value: 'shapeNode' },
        predicate: { value: 'http://www.w3.org/ns/shacl#minLength' },
        object: { value: '5' },
      };

      const shapeObject: JSONSchema4 = {
        properties: {
          testProperty: { type: 'string' },
        },
      };

      handleMinLengthProperty(quads, node, shapeObject, 'testProperty');

      expect(shapeObject.properties?.testProperty?.minLength).toBe(5);
    });

    it('sets the minLength property for an array field', () => {
      const quads: Quad[] = [];
      const node: Quad = {
        subject: { value: 'shapeNode' },
        predicate: { value: 'http://www.w3.org/ns/shacl#minLength' },
        object: { value: '3' },
      };

      const shapeObject: JSONSchema4 = {
        properties: {
          testProperty: { type: 'array', items: {} },
        },
      };

      handleMinLengthProperty(quads, node, shapeObject, 'testProperty');

      expect((shapeObject.properties?.testProperty?.items as JSONSchema4)?.minLength).toBe(3);
    });

    it('throws an error if there are no properties', () => {
      const quads: Quad[] = [];
      const node: Quad = {
        subject: { value: 'shapeNode' },
        predicate: { value: 'http://www.w3.org/ns/shacl#minLength' },
        object: { value: '5' },
      };

      const shapeObject: JSONSchema4 = {};

      expect(() => {
        handleMinLengthProperty(quads, node, shapeObject, 'testProperty');
      }).toThrow('properties not defined on jsonSchema object');
    });
  });

  describe('handleDatatypeProperty', () => {
    it('maps XSD datatype to JSON Schema type and format', () => {
      const quads: Quad[] = [];
      const node: Quad = {
        subject: { value: 'shapeNode' },
        predicate: { value: 'http://www.w3.org/ns/shacl#datatype' },
        object: { value: 'http://www.w3.org/2001/XMLSchema#dateTime' },
      };

      const shapeObject: JSONSchema4 = {
        properties: {
          testProperty: {},
        },
      };

      const prefixes = {
        xsd: 'http://www.w3.org/2001/XMLSchema#',
      };

      handleDatatypeProperty(quads, node, shapeObject, 'testProperty', prefixes);

      expect(shapeObject.properties?.testProperty?.type).toBe('string');
      expect(shapeObject.properties?.testProperty?.format).toBe('date-time');
      expect(shapeObject.properties?.testProperty?.rdfType).toBe('xsd:dateTime');
    });

    it('throws an error if there are no properties', () => {
      const quads: Quad[] = [];
      const node: Quad = {
        subject: { value: 'shapeNode' },
        predicate: { value: 'http://www.w3.org/ns/shacl#datatype' },
        object: { value: 'http://www.w3.org/2001/XMLSchema#string' },
      };

      const shapeObject: JSONSchema4 = {};

      expect(() => {
        handleDatatypeProperty(quads, node, shapeObject, 'testProperty', {});
      }).toThrow('properties not defined on jsonSchema object');
    });

    it('handles array types correctly', () => {
      const quads: Quad[] = [];
      const node: Quad = {
        subject: { value: 'shapeNode' },
        predicate: { value: 'http://www.w3.org/ns/shacl#datatype' },
        object: { value: 'http://www.w3.org/2001/XMLSchema#string' },
      };

      const shapeObject: JSONSchema4 = {
        properties: {
          testProperty: {
            type: 'array',
            items: {},
          },
        },
      };

      handleDatatypeProperty(quads, node, shapeObject, 'testProperty', {});

      expect(shapeObject.properties?.testProperty?.items?.type).toBe('string');
    });
  });

  describe('handleMaxLengthProperty', () => {
    it('sets the maxLength property for a string field', () => {
      const quads: Quad[] = [];
      const node: Quad = {
        subject: { value: 'shapeNode' },
        predicate: { value: 'http://www.w3.org/ns/shacl#maxLength' },
        object: { value: '10' },
      };

      const shapeObject: JSONSchema4 = {
        properties: {
          testProperty: { type: 'string' },
        },
      };

      handleMaxLengthProperty(quads, node, shapeObject, 'testProperty');

      expect(shapeObject.properties?.testProperty?.maxLength).toBe(10);
    });
  });

  describe('handleDescriptionProperty', () => {
    it('sets the description property for a field', () => {
      const quads: Quad[] = [];
      const node: Quad = {
        subject: { value: 'shapeNode' },
        predicate: { value: 'http://www.w3.org/ns/shacl#description' },
        object: { value: 'This is a test description' },
      };

      const shapeObject: JSONSchema4 = {
        properties: {
          testProperty: {},
        },
      };

      handleDescriptionProperty(quads, node, shapeObject, 'testProperty');

      expect(shapeObject.properties?.testProperty?.description).toBe('This is a test description');
    });
  });

  describe('handlePatternProperty', () => {
    it('sets the pattern property for a field', () => {
      const quads: Quad[] = [];
      const node: Quad = {
        subject: { value: 'shapeNode' },
        predicate: { value: 'http://www.w3.org/ns/shacl#pattern' },
        object: { value: '\\d+' },
      };

      const shapeObject: JSONSchema4 = {
        properties: {
          testProperty: {},
        },
      };

      handlePatternProperty(quads, node, shapeObject, 'testProperty');

      expect(shapeObject.properties?.testProperty?.pattern).toBe('\\d+');
    });

    it('warns when an invalid regex pattern is provided', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const quads: Quad[] = [];
      const node: Quad = {
        subject: { value: 'shapeNode' },
        predicate: { value: 'http://www.w3.org/ns/shacl#pattern' },
        object: { value: '\\d+(' },
      };

      const shapeObject: JSONSchema4 = {
        properties: {
          testProperty: {},
        },
      };

      handlePatternProperty(quads, node, shapeObject, 'testProperty');

      expect(consoleWarnSpy).toHaveBeenCalledWith('Invalid regex pattern for testProperty: \\d+(');

      consoleWarnSpy.mockRestore();
    });
  });

  describe('handleMinCountProperty', () => {
    it('returns the original if mincount is 0', () => {
      const quads: Quad[] = [];
      const node: Quad = {
        subject: { value: 'shapeNode' },
        predicate: { value: 'http://www.w3.org/ns/shacl#minCount' },
        object: { value: '0' },
      };
      const shapeObject: JSONSchema4 = {
        properties: {
          testProperty: {},
        },
      };
      const result = handleMinCountProperty(quads, node, shapeObject, 'testProperty');
      expect(result).toEqual(shapeObject);
    });

    it('adds the property to required when minCount is 1', () => {
      const quads: Quad[] = [];
      const node: Quad = {
        subject: { value: 'shapeNode' },
        predicate: { value: 'http://www.w3.org/ns/shacl#minCount' },
        object: { value: '1' },
      };

      const shapeObject: JSONSchema4 = {
        properties: {
          testProperty: {},
        },
      };

      handleMinCountProperty(quads, node, shapeObject, 'testProperty');

      expect(shapeObject.required).toContain('testProperty');
    });

    it('handles the property when mincount is greater than 1', () => {
      const quads: Quad[] = [];
      const node: Quad = {
        subject: { value: 'shapeNode' },
        predicate: { value: 'http://www.w3.org/ns/shacl#minCount' },
        object: { value: '2' },
      };

      const shapeObject: JSONSchema4 = {
        properties: {
          testProperty: {},
        },
      };

      handleMinCountProperty(quads, node, shapeObject, 'testProperty');
      expect(shapeObject.minItems).toBe(2);
      expect(shapeObject.type).toBe('array');
    });
  });

  describe('handleMaxCountProperty', () => {
    it('sets the maxItems property for an array field', () => {
      const quads: Quad[] = [];
      const node: Quad = {
        subject: { value: 'shapeNode' },
        predicate: { value: 'http://www.w3.org/ns/shacl#maxCount' },
        object: { value: '5' },
      };

      const shapeObject: JSONSchema4 = {
        properties: {
          testProperty: { type: 'array', items: {} },
        },
      };

      handleMaxCountProperty(quads, node, shapeObject, 'testProperty');

      expect(shapeObject.properties?.testProperty?.maxItems).toBe(5);
    });
  });

  describe('addRequiredProperty', () => {
    it('adds a property to the required array', () => {
      const shapeObject: JSONSchema4 = {
        properties: {
          testProperty: {},
        },
      };

      addRequiredProperty(shapeObject, 'testProperty');

      expect(shapeObject.required).toContain('testProperty');
    });

    it('does not add a property to the required array if it already exists', () => {
      const shapeObject: JSONSchema4 = {
        properties: {
          testProperty: {},
        },
        required: ['testProperty'],
      };

      addRequiredProperty(shapeObject, 'testProperty');

      expect(shapeObject.required?.length).toBe(1);
    });
  });

  describe('throwing errors', () => {
    it('if properties are not defined', () => {
      const quads: Quad[] = [];
      const node: Quad = {
        subject: { value: 'shapeNode' },
        predicate: { value: 'http://www.w3.org/ns/shacl#minCount' },
        object: { value: '1' },
      };

      const shapeObject: JSONSchema4 = {};

      expect(() => {
        handleMinInclusiveProperty(quads, node, shapeObject, 'testProperty');
      }).toThrow('properties not defined on jsonSchema object');

      expect(() => {
        handleMaxInclusiveProperty(quads, node, shapeObject, 'testProperty');
      }).toThrow('properties not defined on jsonSchema object');

      expect(() => {
        handleMaxLengthProperty(quads, node, shapeObject, 'testProperty');
      }).toThrow('properties not defined on jsonSchema object');

      expect(() => {
        handleMinLengthProperty(quads, node, shapeObject, 'testProperty');
      }).toThrow('properties not defined on jsonSchema object');

      expect(() => {
        handleDescriptionProperty(quads, node, shapeObject, 'testProperty');
      }).toThrow('properties not defined on jsonSchema object');

      expect(() => {
        handlePatternProperty(quads, node, shapeObject, 'testProperty');
      }).toThrow('properties not defined on jsonSchema object');
    });

    it('if enum values are missing', () => {
      const quads: Quad[] = [];
      const node: Quad = {
        subject: { value: 'shapeNode' },
        predicate: { value: 'http://www.w3.org/ns/shacl#in' },
        object: { value: 'node1' },
      };

      const shapeObject: JSONSchema4 = {
        properties: {
          testProperty: {},
        },
      };

      expect(() => {
        handleInProperty(quads, node, shapeObject, 'testProperty');
      }).toThrow('No enum values found for SHACL in property');
    });
  });
});
