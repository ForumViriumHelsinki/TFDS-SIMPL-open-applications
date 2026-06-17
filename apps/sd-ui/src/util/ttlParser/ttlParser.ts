import type { Quad, Stream } from '@rdfjs/types';
import type { JSONSchema4 } from 'json-schema';
import {
  handleDatatypeProperty,
  handleDescriptionProperty,
  handleInProperty,
  handleMaxCountProperty,
  handleMaxInclusiveProperty,
  handleMaxLengthProperty,
  handleMinCountProperty,
  handleMinInclusiveProperty,
  handleMinLengthProperty,
  handleNameProperty,
  handlePatternProperty,
  handleSimplConfigureProperty,
} from './handlers';
import {
  isDataTypeQuad,
  isDescriptionQuad,
  isInQuad,
  isMaxCountQuad,
  isMaxInclusiveQuad,
  isMaxLengthQuad,
  isMinCountQuad,
  isMinInclusiveQuad,
  isMinLengthQuad,
  isNameQuad,
  isNodeShape,
  isPathProperty,
  isPatternQuad,
  isProperty,
  isReferenceNode,
  isSimplConfigureQuad,
} from './matchers';
import { getShapePropertyNameWithoutPath, toCompactURI } from './util';
import type { SimplSDSchemaUIVariant } from '@/types/ttlParser';

/**
 *
 * Parse data stream into quads and prefixes
 */
const parseQuads = (
  stream: Stream
): Promise<{
  quads: Quad[];
  prefixes: Record<string, string>;
}> => {
  const quads: Quad[] = [];
  const prefixes: Record<string, string> = {};

  return new Promise((resolve, reject) => {
    stream.on('prefix', (prefix, ns) => {
      prefixes[prefix] = ns.value;
    });

    stream.on('data', (quad) => {
      quads.push(quad);
    });

    stream.on('end', () => {
      resolve({ quads, prefixes });
    });

    stream.on('error', (error) => {
      reject(error);
    });
  });
};

const handleValidationConstraints = (
  propertyDetailQuads: Quad[],
  quads: Quad[],
  shape: JSONSchema4,
  propertyName: string
) => {
  const nameQuad = propertyDetailQuads.find(isNameQuad);
  if (nameQuad) {
    handleNameProperty(quads, nameQuad, shape, propertyName);
  }

  const descriptionQuad = propertyDetailQuads.find(isDescriptionQuad);
  if (descriptionQuad) {
    handleDescriptionProperty(quads, descriptionQuad, shape, propertyName);
  }

  const inQuad = propertyDetailQuads.find(isInQuad);
  if (inQuad) {
    handleInProperty(quads, inQuad, shape, propertyName);
  }

  const patternQuad = propertyDetailQuads.find(isPatternQuad);
  if (patternQuad) {
    handlePatternProperty(quads, patternQuad, shape, propertyName);
  }

  const minLengthQuad = propertyDetailQuads.find(isMinLengthQuad);
  if (minLengthQuad) {
    handleMinLengthProperty(quads, minLengthQuad, shape, propertyName);
  }

  const maxLengthQuad = propertyDetailQuads.find(isMaxLengthQuad);
  if (maxLengthQuad) {
    handleMaxLengthProperty(quads, maxLengthQuad, shape, propertyName);
  }

  const minInclusiveQuad = propertyDetailQuads.find(isMinInclusiveQuad);
  if (minInclusiveQuad) {
    handleMinInclusiveProperty(quads, minInclusiveQuad, shape, propertyName);
  }

  const maxInclusiveQuad = propertyDetailQuads.find(isMaxInclusiveQuad);
  if (maxInclusiveQuad) {
    handleMaxInclusiveProperty(quads, maxInclusiveQuad, shape, propertyName);
  }
};

const buildJsonObject = (
  quads: Quad[],
  shapeQuad: Quad,
  prefixes: Record<string, string>,
  root: JSONSchema4,
  child: boolean = false,
  schemaUIType: SimplSDSchemaUIVariant = 'default'
) => {
  // we extract the shape name from the subject, we make the assumption that they're all on the same domain
  // "http://w3id.org/gaia-x/validation#ApplicationOfferingShape" -> "ApplicationOfferingShape"

  // go through quads

  // keep an object with reference to shape by shape name - getShapePropertyNameWithoutPath
  // iterate through shapes and put them all on the object with the shape name as key
  // for each shape, iterate through the properties and build the object
  // if it's a node we put it on the root with key as shape name
  // if it's a datatype we put it on the property object with key as property name

  const propertyName = getShapePropertyNameWithoutPath(shapeQuad);
  if (!propertyName) {
    throw new Error('Malformed property name');
  }
  // Exception forced by backend department: AssetProperties node must never be removed
  // during cleanup, even if its properties are empty — the backend depends on it being present.
  const isAssetShape = propertyName.includes('AssetPropertiesShape');
  //ends
  if (root[propertyName]) {
    const shape = {
      ...root[propertyName],
    };
    return shape;
  }

  const targetClass = quads.find(
    (quad) =>
      quad.subject.value === shapeQuad.subject.value &&
      quad.predicate.value === 'http://www.w3.org/ns/shacl#targetClass'
  );

  if (!targetClass) {
    throw new Error('No target class found for shape');
  }

  const rdfType = toCompactURI(targetClass.object.value, prefixes);

  root[propertyName] = {
    ...root[propertyName],
    type: 'object',
    properties: {},
    child,
    rdfType,
  };

  const shape = root[propertyName];

  const propertyNodes = quads.filter(
    (quad) => quad.subject.value === shapeQuad.subject.value && isProperty(quad)
  );

  propertyNodes.forEach((propertyNode) => {
    const propertyDetailQuads = quads.filter(
      (quad) => quad.subject.value === propertyNode.object.value
    );

    const pathQuad = propertyDetailQuads.find(isPathProperty);
    if (!pathQuad) {
      throw new Error('No path defined for property');
    }
    const propertyName = toCompactURI(pathQuad.object.value, prefixes);

    if (!shape.properties) {
      throw new Error('properties not defined on jsonSchema object');
    }

    if (!propertyName) {
      throw new Error('Malformed property name or no path defined for property');
    }

    shape.properties[propertyName] = {};

    /**
     * let's go through property quads and handle them
     * we handle them in specific order instead of iterating because they can affect how different properties are handled based on what properties are present
     */

    // handle simpl
    const simplConfigureQuad = propertyDetailQuads.find(isSimplConfigureQuad);
    if (simplConfigureQuad) {
      const result = handleSimplConfigureProperty(
        quads,
        simplConfigureQuad,
        shape,
        propertyName,
        schemaUIType
      );
      if (result === false) {
        // Exception forced by backend department: never delete properties from AssetPropertiesShape,
        // even when marked as hiddenInFrontend — the backend depends on them being present.
        if (!isAssetShape) {
          delete shape.properties[propertyName];
          return;
        } //ends
      }
    }

    const nameQuad = propertyDetailQuads.find(isNameQuad);
    if (nameQuad) {
      handleNameProperty(quads, nameQuad, shape, propertyName);
    }

    // handle min max

    const minCountQuad = propertyDetailQuads.find(isMinCountQuad);
    if (minCountQuad) {
      handleMinCountProperty(quads, minCountQuad, shape, propertyName);
    }
    const maxCountQuad = propertyDetailQuads.find(isMaxCountQuad);
    if (maxCountQuad) {
      handleMaxCountProperty(quads, maxCountQuad, shape, propertyName);
    }

    // handle datatype || node
    // we assume they are mutually exclusive outside the context of sh:or

    const datatypeQuad = propertyDetailQuads.find(isDataTypeQuad);
    if (datatypeQuad) {
      handleDatatypeProperty(quads, datatypeQuad, shape, propertyName, prefixes);
    }

    const nodeQuad = propertyDetailQuads.find(isReferenceNode);

    if (nodeQuad) {
      handleNodeProperty(quads, nodeQuad, shape, propertyName, prefixes, root, schemaUIType);
    }

    handleValidationConstraints(propertyDetailQuads, quads, shape, propertyName);
  });

  return shape;
};

/**
 * Handle node properties (properties that reference another shape) recursively
 */
export const handleNodeProperty = (
  quads: Quad[],
  node: Quad,
  shape: JSONSchema4,
  propertyName: string,
  prefixes: Record<string, string>,
  root: Record<string, JSONSchema4>,
  schemaUIType: SimplSDSchemaUIVariant = 'default'
) => {
  const nodeReference = quads.find((quad) => quad.subject.value === node.object.value);
  if (!nodeReference) {
    throw new Error('Node reference not found');
  }
  if (!shape.properties) {
    throw new Error('properties not defined on jsonSchema object');
  }

  shape.properties[propertyName] = buildJsonObject(
    quads,
    nodeReference,
    prefixes,
    root,
    true,
    schemaUIType
  );
};

// we handle SH properties only ATM

/**
 * start with the stream, parse it into quads and prefixes, then build the json schema object for each shape
 */
export const parseStream = async (
  stream: Stream,
  schemaUIType: SimplSDSchemaUIVariant = 'default'
) => {
  const { quads, prefixes } = await parseQuads(stream);

  const root: Record<string, JSONSchema4> = {};

  const shapes: Quad[] = [];

  quads.forEach((q) => {
    if (isNodeShape(q)) {
      shapes.push(q);
    }
  });

  // let's build the shape tree
  shapes.forEach((shapeQuad) => {
    // recursively build the form and put it on the jsonSchema object
    buildJsonObject(quads, shapeQuad, prefixes, root, false, schemaUIType);
  });

  // we remove the top level shapes that are found as child nodes on the tree, mutating the root object
  deleteChildNodes(root);
  deleteNodesWithEmptyProperties(root);
  if (schemaUIType === 'advancedSearch') {
    deleteAllRequiredProperties(root);
  }

  return { root, prefixes };
};

const deleteChildNodes = (root: Record<string, JSONSchema4>) => {
  Object.keys(root).forEach((key) => {
    if (root[key].child) {
      delete root[key];
    } else {
      delete root[key].child;
    }
  });
};

const deleteNodesWithEmptyProperties = (
  root: Record<string, JSONSchema4>,
  deletedKeys: string[] = []
) => {
  if (Object.keys(root).length === 0) {
    return deletedKeys;
  }
  Object.keys(root).forEach((key) => {
    if (root[key].properties) {
      deletedKeys = [
        ...deletedKeys,
        ...deleteNodesWithEmptyProperties(root[key].properties, deletedKeys),
      ];
    }

    if (root[key].properties && Object.keys(root[key].properties).length === 0) {
      // Exception forced by backend department: AssetProperties node must never be removed
      // during cleanup, even if its properties are empty — the backend depends on it being present.
      if (root[key].rdfType === 'simpl:AssetProperties') {
        return;
      } // ends
      delete root[key];
      deletedKeys.push(key);
    }

    if (
      Array.isArray(root[key]?.required) &&
      root[key].required.some((r) => deletedKeys.includes(r))
    ) {
      root[key].required = root[key].required.filter((r) => !deletedKeys.includes(r));
    }
  });

  return deletedKeys;
};

const deleteAllRequiredProperties = (root: Record<string, JSONSchema4>) => {
  if (Object.keys(root).length === 0) {
    return;
  }

  Object.keys(root).forEach((key) => {
    if (root[key].properties) {
      deleteAllRequiredProperties(root[key].properties);
    }

    if (root[key].required) {
      delete root[key].required;
    }
  });
};
