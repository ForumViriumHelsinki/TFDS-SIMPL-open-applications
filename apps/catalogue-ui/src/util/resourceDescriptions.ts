import type { SearchAPIResult, SearchAPISelfDescriptionDocument } from 'types/searchApi';
import type {
  ResourceDescriptionSummary,
  filterOurRdfTypes,
  removePrefix,
  removePrefixFromAllKeys,
} from '@simpl/vue-components';

export type ResourceDescriptionInput = Record<string, object | string | number> | string | number;

export const getResourceTypeIcon = (resourceType: string): string => {
  if (resourceType.toLowerCase().includes('data')) {
    return 'document';
  } else if (resourceType.toLowerCase().includes('application')) {
    return 'apps';
  } else if (resourceType.toLowerCase().includes('infrastructure')) {
    return 'server';
  }
  return 'document';
};

export const getResourceDescriptionSummaryFromDocument = (
  resourceDescriptionDocument: SearchAPISelfDescriptionDocument
): ResourceDescriptionSummary => {
  const dataProperties = resourceDescriptionDocument.credentialSubject?.[
    'simpl:dataProperties'
  ] as Record<string, any>;
  const providerInformation = resourceDescriptionDocument.credentialSubject?.[
    'simpl:providerInformation'
  ] as Record<string, any>;
  const generalProperties = resourceDescriptionDocument.credentialSubject?.[
    'simpl:generalServiceProperties'
  ] as Record<string, any>;

  const cleanedGeneralProperties = generalProperties
    ? removePrefixFromAllKeys(filterOurRdfTypes(generalProperties))
    : null;

  return {
    id: resourceDescriptionDocument.credentialSubject['@id'] as string,
    ...cleanedGeneralProperties,
    title: cleanedGeneralProperties?.title || cleanedGeneralProperties?.name,
    description: cleanedGeneralProperties?.description,
    offeringType: cleanedGeneralProperties?.offeringType,
    providedBy: providerInformation?.['simpl:providedBy'],
    format: dataProperties?.['simpl:format'],
  };
};

export const getResourceDescriptionSummaryFromResult = (
  searchResult: SearchAPIResult
): ResourceDescriptionSummary => {
  const cleanedSearchSummary: Record<string, string> = Object.keys(searchResult)
    .filter((key) => key !== 'claimsGraphUri')
    .reduce(
      (acc, key) => {
        acc[key] = searchResult[key] as string;
        return acc;
      },
      {} as Record<string, string>
    );

  return {
    id: searchResult.claimsGraphUri?.[0],
    ...cleanedSearchSummary,
    title: cleanedSearchSummary.title || cleanedSearchSummary.name,
    description: cleanedSearchSummary.description,
  };
};

export const getResourceDescriptionOfferDetails = (
  resourceDescriptionDocument: SearchAPISelfDescriptionDocument
): Record<string, any> => {
  if (!resourceDescriptionDocument) {
    return {};
  }

  const offeringPrice = resourceDescriptionDocument.credentialSubject?.[
    'simpl:offeringPrice'
  ] as Record<string, any>;
  const priceValue = offeringPrice?.['simpl:price']?.['@value'];
  const currency = offeringPrice?.['simpl:currency'];
  const priceType = offeringPrice?.['simpl:priceType'];

  const formattedPrice = priceValue && currency ? `${priceValue} ${currency}` : '';

  return {
    credentialSubject: {
      offerDetails: {
        price: formattedPrice,
        priceType: priceType,
      },
    },
  };
};

export const getResourceDescriptionContractTemplate = (
  resourceDescriptionDocument: SearchAPISelfDescriptionDocument
): Record<string, any> => {
  if (!resourceDescriptionDocument) {
    return {};
  }
  const contractTemplate = resourceDescriptionDocument.credentialSubject?.[
    'simpl:contractTemplate'
  ] as any;
  if (!contractTemplate) {
    return {};
  }

  const document = contractTemplate?.['simpl:contractTemplateDocument'];
  const url = contractTemplate?.['simpl:contractTemplateURL'];

  return {
    credentialSubject: {
      contractTemplate: {
        document,
        url,
      },
    },
  };
};

export const getResourceDescriptionSharingMethod = (
  resourceDescriptionDocument: SearchAPISelfDescriptionDocument | null
): string | undefined => {
  if (!resourceDescriptionDocument) {
    return undefined;
  }

  const generalProperties = resourceDescriptionDocument.credentialSubject?.[
    'simpl:generalServiceProperties'
  ] as Record<string, any>;
  const sharingMethod = generalProperties?.['simpl:sharingMethodId'];
  return sharingMethod ? removePrefix(sharingMethod) : undefined;
};

export const getResourceDescriptionOfferingType = (
  resourceDescriptionDocument: SearchAPISelfDescriptionDocument | null
): string | undefined => {
  if (!resourceDescriptionDocument) {
    return undefined;
  }

  const generalProperties = resourceDescriptionDocument.credentialSubject?.[
    'simpl:generalServiceProperties'
  ] as Record<string, any>;
  const offeringType = generalProperties?.['simpl:offeringType'];
  return offeringType ? removePrefix(offeringType) : undefined;
};
