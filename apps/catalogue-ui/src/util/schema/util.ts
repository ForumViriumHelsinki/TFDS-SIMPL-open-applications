import type { Quad } from '@rdfjs/types';

export const toCompactURI = (uri: string, prefixes: Record<string, string>) => {
  const uriMatch = `${uri.split('#')[0]}#`;
  const postFix = uri.split('#')[1];

  const prefix = Object.keys(prefixes).find((key) => {
    const value = prefixes[key];
    return value === uriMatch;
  });
  if (prefix) {
    const compactUri = `${prefix}:${postFix}`;
    return compactUri;
  }
  return uri;
};

export const getShapePropertyNameWithoutPath = (shapeQuad: Quad) => {
  return shapeQuad.subject.value.split('#').pop();
};
