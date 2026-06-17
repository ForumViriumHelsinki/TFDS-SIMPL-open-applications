import type { App } from 'vue';
import PrimeVue from 'primevue/config';
import { pinia } from '@/stores';

export default (app: App) => {
  app.use(pinia);
  app.use(PrimeVue, { theme: 'none' });
};
