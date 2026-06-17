import type { App } from 'vue';
import PrimeVue from 'primevue/config';
import { createPinia } from 'pinia';

export default (app: App) => {
  app.use(createPinia());
  app.use(PrimeVue, { theme: 'none' });
};
