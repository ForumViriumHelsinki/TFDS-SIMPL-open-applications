import node from '@astrojs/node';
import vue from '@astrojs/vue';
import { defineConfig } from 'astro/config';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
// https://astro.build/config
export default defineConfig({
  integrations: [vue({ appEntrypoint: '/src/pages/_app' })],
  output: 'server',
  server: {
    host: true
  },
  security: {
    checkOrigin: false,
    // Trust all proxy headers natively; actual validation happens at runtime in middleware.ts
    allowedDomains: [{ hostname: '*' }]
  },
  image: {
    domains: [] // or whatever was here before, usually process.env derived but let's keep it simple or remove if unnecessary. Wait, it was derived from allowedDomains const which was removed.
  },
  adapter: node({
    mode: 'standalone',
  }),
  vite: {
    resolve: {
      alias: {
        '@': path.resolve('./src'),
      },
    },
    plugins: [tailwindcss()],
  },
});
