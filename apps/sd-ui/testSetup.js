import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { config } from '@vue/test-utils';
import PrimeVue from 'primevue/config';

config.global.plugins = [[PrimeVue, { theme: 'none' }]];

afterEach(() => {});
