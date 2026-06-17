import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref, type Ref } from 'vue';
import { useTemporarySuccessMessageStore } from '@/store/temporarySuccessMessage';

// Create refs for mocking session storage
let sessionStorageRefs: Record<string, Ref<any>> = {};

// Mock @vueuse/core
vi.mock('@vueuse/core', () => ({
  useSessionStorage: (key: string, initialValue: any) => {
    // Create or reuse a ref for this key
    if (!sessionStorageRefs[key]) {
      sessionStorageRefs[key] = ref(initialValue);
    }
    return sessionStorageRefs[key];
  },
}));

describe('temporarySuccessMessageStore', () => {
  beforeEach(() => {
    // Reset all session storage refs to their initial values
    sessionStorageRefs = {};

    // Create a fresh pinia instance before each test
    setActivePinia(createPinia());
  });
  describe('initialization', () => {
    it('should initialize with null values when no session storage exists', () => {
      const store = useTemporarySuccessMessageStore();

      expect(store.successId).toBeNull();
      expect(store.successOfferingName).toBeNull();
      expect(store.successAction).toBeNull();
      expect(store.showSuccessMessage).toBe(false);
    });
    it('should initialize showSuccessMessage as true when session storage has values', () => {
      // Pre-populate session storage
      sessionStorageRefs['temporarySuccessId'] = ref('test-id-123');
      sessionStorageRefs['temporarySuccessOfferingName'] = ref('Test Offering');

      const store = useTemporarySuccessMessageStore();

      expect(store.showSuccessMessage).toBe(true);
    });
  });

  describe('setSuccessDetails', () => {
    it('should set success id and offering name', () => {
      const store = useTemporarySuccessMessageStore();
      const testId = 'offering-123';
      const testName = 'My Test Offering';

      store.setSuccessDetails(testId, testName);

      expect(store.successId).toBe(testId);
      expect(store.successOfferingName).toBe(testName);
    });

    it('should default action to published when not specified', () => {
      const store = useTemporarySuccessMessageStore();

      store.setSuccessDetails('test-id', 'test-name');

      expect(store.successAction).toBe('published');
    });

    it('should set action to revoked when specified', () => {
      const store = useTemporarySuccessMessageStore();

      store.setSuccessDetails('test-id', 'test-name', 'revoked');

      expect(store.successAction).toBe('revoked');
    });

    it('should set action to published when explicitly specified', () => {
      const store = useTemporarySuccessMessageStore();

      store.setSuccessDetails('test-id', 'test-name', 'published');

      expect(store.successAction).toBe('published');
    });

    it('should set showSuccessMessage to true', () => {
      const store = useTemporarySuccessMessageStore();

      expect(store.showSuccessMessage).toBe(false);

      store.setSuccessDetails('test-id', 'test-name');

      expect(store.showSuccessMessage).toBe(true);
    });

    it('should update existing values when called multiple times', () => {
      const store = useTemporarySuccessMessageStore();

      store.setSuccessDetails('first-id', 'First Offering');
      expect(store.successId).toBe('first-id');
      expect(store.successOfferingName).toBe('First Offering');

      store.setSuccessDetails('second-id', 'Second Offering');
      expect(store.successId).toBe('second-id');
      expect(store.successOfferingName).toBe('Second Offering');
      expect(store.showSuccessMessage).toBe(true);
    });

    it('should handle empty strings', () => {
      const store = useTemporarySuccessMessageStore();

      store.setSuccessDetails('', '');

      expect(store.successId).toBe('');
      expect(store.successOfferingName).toBe('');
      expect(store.showSuccessMessage).toBe(true);
    });

    it('should handle special characters in values', () => {
      const store = useTemporarySuccessMessageStore();
      const specialId = 'id-with-special-chars-!@#$%';
      const specialName = 'Offering with special chars: <>&"\'';

      store.setSuccessDetails(specialId, specialName);

      expect(store.successId).toBe(specialId);
      expect(store.successOfferingName).toBe(specialName);
      expect(store.showSuccessMessage).toBe(true);
    });
  });

  describe('clearSuccessDetails', () => {
    it('should clear success id and offering name', () => {
      const store = useTemporarySuccessMessageStore();

      // First set some values
      store.setSuccessDetails('test-id', 'test-name', 'revoked');
      expect(store.successId).toBe('test-id');
      expect(store.successOfferingName).toBe('test-name');
      expect(store.successAction).toBe('revoked');

      // Then clear them
      store.clearSuccessDetails();

      expect(store.successId).toBeNull();
      expect(store.successOfferingName).toBeNull();
      expect(store.successAction).toBeNull();
    });

    it('should set showSuccessMessage to false', () => {
      const store = useTemporarySuccessMessageStore();

      store.setSuccessDetails('test-id', 'test-name');
      expect(store.showSuccessMessage).toBe(true);

      store.clearSuccessDetails();

      expect(store.showSuccessMessage).toBe(false);
    });

    it('should be idempotent when called multiple times', () => {
      const store = useTemporarySuccessMessageStore();

      store.setSuccessDetails('test-id', 'test-name');
      store.clearSuccessDetails();
      store.clearSuccessDetails();
      store.clearSuccessDetails();

      expect(store.successId).toBeNull();
      expect(store.successOfferingName).toBeNull();
      expect(store.showSuccessMessage).toBe(false);
    });

    it('should work when no values were previously set', () => {
      const store = useTemporarySuccessMessageStore();

      // Clear without setting first
      store.clearSuccessDetails();

      expect(store.successId).toBeNull();
      expect(store.successOfferingName).toBeNull();
      expect(store.showSuccessMessage).toBe(false);
    });
  });

  describe('integration scenarios', () => {
    it('should support set-clear-set workflow', () => {
      const store = useTemporarySuccessMessageStore();

      // First set
      store.setSuccessDetails('id-1', 'name-1');
      expect(store.successId).toBe('id-1');
      expect(store.showSuccessMessage).toBe(true);

      // Clear
      store.clearSuccessDetails();
      expect(store.successId).toBeNull();
      expect(store.showSuccessMessage).toBe(false);

      // Second set
      store.setSuccessDetails('id-2', 'name-2');
      expect(store.successId).toBe('id-2');
      expect(store.successOfferingName).toBe('name-2');
      expect(store.showSuccessMessage).toBe(true);
    });

    it('should maintain independent state across multiple store instances', () => {
      const store1 = useTemporarySuccessMessageStore();
      const store2 = useTemporarySuccessMessageStore();

      // Both instances should reference the same store
      expect(store1).toBe(store2);

      store1.setSuccessDetails('shared-id', 'shared-name');

      expect(store2.successId).toBe('shared-id');
      expect(store2.successOfferingName).toBe('shared-name');
      expect(store2.showSuccessMessage).toBe(true);
    });

    it('should handle rapid successive updates', () => {
      const store = useTemporarySuccessMessageStore();

      for (let i = 0; i < 10; i++) {
        store.setSuccessDetails(`id-${i}`, `name-${i}`);
      }

      expect(store.successId).toBe('id-9');
      expect(store.successOfferingName).toBe('name-9');
      expect(store.showSuccessMessage).toBe(true);
    });
  });

  describe('session storage persistence', () => {
    it('should persist successId using session storage key', () => {
      const store = useTemporarySuccessMessageStore();
      const testId = 'persistent-id';

      store.setSuccessDetails(testId, 'test-name');

      // The store uses useSessionStorage with key 'temporarySuccessId'
      expect(store.successId).toBe(testId);
    });

    it('should persist successOfferingName using session storage key', () => {
      const store = useTemporarySuccessMessageStore();
      const testName = 'Persistent Offering Name';

      store.setSuccessDetails('test-id', testName);

      // The store uses useSessionStorage with key 'temporarySuccessOfferingName'
      expect(store.successOfferingName).toBe(testName);
    });
    it('should persist successAction using session storage key', () => {
      const store = useTemporarySuccessMessageStore();

      store.setSuccessDetails('test-id', 'test-name', 'revoked');

      expect(store.successAction).toBe('revoked');
    });
  });
});
