import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useResourceDescriptionStore } from '@/stores/resourceDescription';
import type { SearchAPISelfDescriptionDocument } from 'types/searchApi';

// Mock the utility functions - they are already well tested
vi.mock('@simpl/vue-components', () => ({
  getResourceDescriptionSummaryFromDocument: vi.fn(),
  getResourceDescriptionOfferingType: vi.fn(),
  getResourceDescriptionSharingMethod: vi.fn(),
}));

// Import the mocked functions after the mock
import * as resourceDescriptionsUtil from '@simpl/vue-components';
const mockGetResourceDescriptionSummaryFromDocument = vi.mocked(
  resourceDescriptionsUtil.getResourceDescriptionSummaryFromDocument
);
const mockGetResourceDescriptionOfferingType = vi.mocked(
  resourceDescriptionsUtil.getResourceDescriptionOfferingType
);
const mockGetResourceDescriptionSharingMethod = vi.mocked(
  resourceDescriptionsUtil.getResourceDescriptionSharingMethod
);

describe('resourceDescriptionStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  const mockDocument: SearchAPISelfDescriptionDocument = {
    '@context': ['context'],
    credentialSubject: {
      '@id': 'test-id-123',
    },
    issuanceDate: '2024-01-01',
    issuer: 'test-issuer',
    proof: {
      created: '2024-01-01',
      jws: 'test-jws',
      proofPurpose: 'test-purpose',
      type: 'test-type',
      verificationMethod: 'test-method',
    },
    type: 'test-type',
  };

  const mockSummary = {
    id: 'test-id-123',
    title: 'Test Resource',
    name: 'Test Resource',
    description: 'Test Description',
    providedBy: 'Test Provider',
    format: 'JSON',
  };

  describe('initial state', () => {
    it('should initialize with null resourceDescriptionDocument', () => {
      const store = useResourceDescriptionStore();
      expect(store.resourceDescriptionDocument).toBeNull();
    });

    it('should initialize with null resourceDescriptionSummary when document is null', () => {
      const store = useResourceDescriptionStore();
      expect(store.resourceDescriptionSummary).toBeNull();
    });

    it('should initialize computed properties as undefined when document is null', () => {
      const store = useResourceDescriptionStore();
      expect(store.resourceDescriptionOfferingType).toBeUndefined();
      expect(store.resourceDescriptionSharingMethodId).toBeUndefined();
    });
  });

  describe('setResourceDescriptionDocument', () => {
    it('should set the resource description document', () => {
      const store = useResourceDescriptionStore();

      store.setResourceDescriptionDocument(mockDocument);

      expect(store.resourceDescriptionDocument).toEqual(mockDocument);
    });

    it('should update the document when called multiple times', () => {
      const store = useResourceDescriptionStore();
      const secondDocument = {
        ...mockDocument,
        credentialSubject: {
          ...mockDocument.credentialSubject,
          '@id': 'different-id',
        },
      };

      store.setResourceDescriptionDocument(mockDocument);
      expect(store.resourceDescriptionDocument).toEqual(mockDocument);

      store.setResourceDescriptionDocument(secondDocument);
      expect(store.resourceDescriptionDocument).toEqual(secondDocument);
    });
  });

  describe('resourceDescriptionSummary computed property', () => {
    it('should return null when document is null', () => {
      const store = useResourceDescriptionStore();
      expect(store.resourceDescriptionSummary).toBeNull();
    });

    it('should call getResourceDescriptionSummaryFromDocument and return its result when document is set', () => {
      const store = useResourceDescriptionStore();
      mockGetResourceDescriptionSummaryFromDocument.mockReturnValue(mockSummary);

      store.setResourceDescriptionDocument(mockDocument);

      // Access the computed property to trigger evaluation
      const summary = store.resourceDescriptionSummary;

      expect(mockGetResourceDescriptionSummaryFromDocument).toHaveBeenCalledWith(mockDocument);
      expect(summary).toEqual(mockSummary);
    });

    it('should update when document changes', () => {
      const store = useResourceDescriptionStore();

      const firstSummary = { ...mockSummary, id: 'first-id' };
      const secondSummary = { ...mockSummary, id: 'second-id' };

      mockGetResourceDescriptionSummaryFromDocument.mockReturnValueOnce(firstSummary);
      store.setResourceDescriptionDocument(mockDocument);
      expect(store.resourceDescriptionSummary).toEqual(firstSummary);

      const secondDocument = {
        ...mockDocument,
        credentialSubject: { ...mockDocument.credentialSubject, '@id': 'second-id' },
      };

      mockGetResourceDescriptionSummaryFromDocument.mockReturnValueOnce(secondSummary);
      store.setResourceDescriptionDocument(secondDocument);
      expect(store.resourceDescriptionSummary).toEqual(secondSummary);
    });
  });

  describe('resourceDescriptionOfferingType computed property', () => {
    it('should return undefined when document is null', () => {
      const store = useResourceDescriptionStore();
      expect(store.resourceDescriptionOfferingType).toBeUndefined();
    });

    it('should call getResourceDescriptionOfferingType and return its result when document is set', () => {
      const store = useResourceDescriptionStore();
      mockGetResourceDescriptionOfferingType.mockReturnValue('data-offering');

      store.setResourceDescriptionDocument(mockDocument);

      // Access the computed property to trigger evaluation
      const offeringType = store.resourceDescriptionOfferingType;

      expect(mockGetResourceDescriptionOfferingType).toHaveBeenCalledWith(mockDocument);
      expect(offeringType).toBe('data-offering');
    });

    it('should update when document changes', () => {
      const store = useResourceDescriptionStore();

      mockGetResourceDescriptionOfferingType.mockReturnValueOnce('data-offering');
      store.setResourceDescriptionDocument(mockDocument);
      expect(store.resourceDescriptionOfferingType).toBe('data-offering');

      const secondDocument = { ...mockDocument };
      mockGetResourceDescriptionOfferingType.mockReturnValueOnce('service-offering');
      store.setResourceDescriptionDocument(secondDocument);
      expect(store.resourceDescriptionOfferingType).toBe('service-offering');
    });

    it('should handle when getResourceDescriptionOfferingType returns undefined', () => {
      const store = useResourceDescriptionStore();
      mockGetResourceDescriptionOfferingType.mockReturnValue(undefined);

      store.setResourceDescriptionDocument(mockDocument);

      expect(store.resourceDescriptionOfferingType).toBeUndefined();
    });
  });

  describe('resourceDescriptionSharingMethodId computed property', () => {
    it('should return undefined when document is null', () => {
      const store = useResourceDescriptionStore();
      expect(store.resourceDescriptionSharingMethodId).toBeUndefined();
    });

    it('should call getResourceDescriptionSharingMethod and return its result when document is set', () => {
      const store = useResourceDescriptionStore();
      mockGetResourceDescriptionSharingMethod.mockReturnValue('api-access');

      store.setResourceDescriptionDocument(mockDocument);

      // Access the computed property to trigger evaluation
      const sharingMethodId = store.resourceDescriptionSharingMethodId;

      expect(mockGetResourceDescriptionSharingMethod).toHaveBeenCalledWith(mockDocument);
      expect(sharingMethodId).toBe('api-access');
    });

    it('should update when document changes', () => {
      const store = useResourceDescriptionStore();

      mockGetResourceDescriptionSharingMethod.mockReturnValueOnce('api-access');
      store.setResourceDescriptionDocument(mockDocument);
      expect(store.resourceDescriptionSharingMethodId).toBe('api-access');

      const secondDocument = { ...mockDocument };
      mockGetResourceDescriptionSharingMethod.mockReturnValueOnce('direct-download');
      store.setResourceDescriptionDocument(secondDocument);
      expect(store.resourceDescriptionSharingMethodId).toBe('direct-download');
    });

    it('should handle when getResourceDescriptionSharingMethod returns undefined', () => {
      const store = useResourceDescriptionStore();
      mockGetResourceDescriptionSharingMethod.mockReturnValue(undefined);

      store.setResourceDescriptionDocument(mockDocument);

      expect(store.resourceDescriptionSharingMethodId).toBeUndefined();
    });
  });

  describe('reactive behavior', () => {
    it('should have all computed properties react to document changes', () => {
      const store = useResourceDescriptionStore();

      // Initial state - all should be null/undefined
      expect(store.resourceDescriptionSummary).toBeNull();
      expect(store.resourceDescriptionOfferingType).toBeUndefined();
      expect(store.resourceDescriptionSharingMethodId).toBeUndefined();

      // Set up mocks
      mockGetResourceDescriptionSummaryFromDocument.mockReturnValue(mockSummary);
      mockGetResourceDescriptionOfferingType.mockReturnValue('data-offering');
      mockGetResourceDescriptionSharingMethod.mockReturnValue('api-access');

      // Set document
      store.setResourceDescriptionDocument(mockDocument);

      // All computed properties should be updated
      expect(store.resourceDescriptionSummary).toEqual(mockSummary);
      expect(store.resourceDescriptionOfferingType).toBe('data-offering');
      expect(store.resourceDescriptionSharingMethodId).toBe('api-access');
    });

    it('should handle setting document to null after having a document', () => {
      const store = useResourceDescriptionStore();

      // Set up mocks and document
      mockGetResourceDescriptionSummaryFromDocument.mockReturnValue(mockSummary);
      mockGetResourceDescriptionOfferingType.mockReturnValue('data-offering');
      mockGetResourceDescriptionSharingMethod.mockReturnValue('api-access');

      store.setResourceDescriptionDocument(mockDocument);

      // Verify document is set by accessing computed properties
      expect(store.resourceDescriptionDocument).toEqual(mockDocument);
      expect(store.resourceDescriptionSummary).toEqual(mockSummary);

      // Reset mocks for null case
      mockGetResourceDescriptionOfferingType.mockReturnValue(undefined);
      mockGetResourceDescriptionSharingMethod.mockReturnValue(undefined);

      // Set document to null (simulating clearing the store)
      store.setResourceDescriptionDocument(null as any);

      // All computed properties should reset
      expect(store.resourceDescriptionDocument).toBeNull();
      expect(store.resourceDescriptionSummary).toBeNull();
      expect(store.resourceDescriptionOfferingType).toBeUndefined();
      expect(store.resourceDescriptionSharingMethodId).toBeUndefined();
    });
  });

  describe('store interface', () => {
    it('should return all expected properties and methods', () => {
      const store = useResourceDescriptionStore();

      expect(store).toHaveProperty('resourceDescriptionDocument');
      expect(store).toHaveProperty('resourceDescriptionSummary');
      expect(store).toHaveProperty('resourceDescriptionOfferingType');
      expect(store).toHaveProperty('resourceDescriptionSharingMethodId');
      expect(store).toHaveProperty('setResourceDescriptionDocument');
      expect(typeof store.setResourceDescriptionDocument).toBe('function');
    });
  });

  describe('Pinia store behavior', () => {
    it('should maintain singleton behavior across multiple store instances', () => {
      const store1 = useResourceDescriptionStore();
      const store2 = useResourceDescriptionStore();

      // Both stores should reference the same instance (Pinia singleton behavior)
      expect(store1).toBe(store2);

      // Set document in one instance
      store1.setResourceDescriptionDocument(mockDocument);

      // Both should reflect the change
      expect(store1.resourceDescriptionDocument).toEqual(mockDocument);
      expect(store2.resourceDescriptionDocument).toEqual(mockDocument);
    });
  });
});
