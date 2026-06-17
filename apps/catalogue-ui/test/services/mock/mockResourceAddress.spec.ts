import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getDestinationAddressTemplates,
  getDestinationAddressSchema,
  getDestinationAddressUiSchema,
} from '@/services/mock/mockResourceAddress';
import type {
  GetResourceAddressTemplatesParams,
  GetResourceAddressSchemaParams,
  GetResourceAddressUiSchemaParams,
  ResourceAddressTemplatesResponse,
  ResourceAddressSchemaResponse,
  ResourceAddressUiSchemaResponse,
  Template,
} from '@simpl/vue-components';

describe('mockResourceAddress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock setTimeout to avoid actual delays in tests
    vi.stubGlobal(
      'setTimeout',
      vi.fn((callback) => {
        callback();
        return 1;
      })
    );
  });

  describe('getDestinationAddressTemplates', () => {
    it('should return destination address templates with 200 status', async () => {
      const params: GetResourceAddressTemplatesParams = {
        sharingMethodId: 'HTTPDATA_PUSH',
        offeringType: 'DATA',
      };

      const response = await getDestinationAddressTemplates(params);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');

      const data: ResourceAddressTemplatesResponse = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(3);
      expect(data[0]).toEqual({
        id: '1',
        label: 'HTTP Data Push Template 1',
      });
      expect(data[1]).toEqual({
        id: '2',
        label: 'HTTP Data Push Template 2',
      });
      expect(data[2]).toEqual({
        id: '3',
        label: 'S3 Bucket Template',
      });
    });

    it('should accept optional keycloak token', async () => {
      const params: GetResourceAddressTemplatesParams = {
        sharingMethodId: 'IONOS_S3',
        offeringType: 'DATA',
      };

      const response = await getDestinationAddressTemplates(params, 'test-token');

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
    });

    it('should return consistent template structure', async () => {
      const params: GetResourceAddressTemplatesParams = {
        sharingMethodId: 'HTTPDATA_PUSH',
        offeringType: 'DATA',
      };

      const response = await getDestinationAddressTemplates(params);
      const data: ResourceAddressTemplatesResponse = await response.json();

      data.forEach((template: Template) => {
        expect(template).toHaveProperty('id');
        expect(template).toHaveProperty('label');
        expect(typeof template.id).toBe('string');
        expect(typeof template.label).toBe('string');
      });
    });
  });

  describe('getDestinationAddressSchema', () => {
    it('should return destination address schema with 200 status', async () => {
      const params: GetResourceAddressSchemaParams = {
        templateId: '3',
      };

      const response = await getDestinationAddressSchema(params);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');

      const data: ResourceAddressSchemaResponse = await response.json();
      expect(data.type).toBe('object');
      expect(data.properties).toBeDefined();
      expect(data.required).toEqual(['bucketName']);
    });

    it('should return S3 bucket schema properties', async () => {
      const params: GetResourceAddressSchemaParams = {
        templateId: '3',
      };

      const response = await getDestinationAddressSchema(params);
      const data: ResourceAddressSchemaResponse = await response.json();

      expect(data.properties.bucketName).toEqual({
        type: 'string',
        description: 'Name of the S3 bucket',
      });
      expect(data.properties.acl).toEqual({
        type: 'string',
        description: 'Access control list setting',
        enum: ['private', 'public-read', 'public-read-write'],
      });
      expect(data.properties.region).toEqual({
        type: 'string',
        description: 'AWS region',
        enum: ['us-east-1', 'us-west-2', 'eu-west-1'],
      });
    });

    it('should accept optional keycloak token', async () => {
      const params: GetResourceAddressSchemaParams = {
        templateId: '3',
      };

      const response = await getDestinationAddressSchema(params, 'test-token');

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
    });
  });

  describe('getDestinationAddressUiSchema', () => {
    it('should return destination address UI schema with 200 status', async () => {
      const params: GetResourceAddressUiSchemaParams = {
        templateId: '3',
      };

      const response = await getDestinationAddressUiSchema(params);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');

      const data: ResourceAddressUiSchemaResponse = await response.json();
      expect(data['ui:order']).toEqual(['bucketName', 'region', 'acl']);
    });

    it('should return UI schema with field configurations', async () => {
      const params: GetResourceAddressUiSchemaParams = {
        templateId: '3',
      };

      const response = await getDestinationAddressUiSchema(params);
      const data: ResourceAddressUiSchemaResponse = await response.json();

      expect(data.bucketName).toEqual({
        'ui:placeholder': 'Enter bucket name',
        'ui:help': 'The name must be globally unique across all AWS accounts',
      });
      expect(data.acl).toEqual({
        'ui:widget': 'select',
        'ui:placeholder': 'Select access control level',
      });
      expect(data.region).toEqual({
        'ui:widget': 'select',
        'ui:placeholder': 'Select AWS region',
      });
    });

    it('should accept optional keycloak token', async () => {
      const params: GetResourceAddressUiSchemaParams = {
        templateId: '3',
      };

      const response = await getDestinationAddressUiSchema(params, 'test-token');

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
    });

    it('should include proper widget configurations', async () => {
      const params: GetResourceAddressUiSchemaParams = {
        templateId: '3',
      };

      const response = await getDestinationAddressUiSchema(params);
      const data: ResourceAddressUiSchemaResponse = await response.json();

      // Check that select widgets are properly configured
      expect(data.acl['ui:widget']).toBe('select');
      expect(data.region['ui:widget']).toBe('select');

      // Check that placeholders are provided
      expect(data.bucketName['ui:placeholder']).toBeTruthy();
      expect(data.acl['ui:placeholder']).toBeTruthy();
      expect(data.region['ui:placeholder']).toBeTruthy();
    });
  });
});
