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
