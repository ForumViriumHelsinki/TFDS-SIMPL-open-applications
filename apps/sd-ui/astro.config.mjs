import node from '@astrojs/node';
import vue from '@astrojs/vue';
import { defineConfig } from 'astro/config';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';

const allowedDomains = process.env.PUBLIC_ALLOWED_DOMAINS
  ? process.env.PUBLIC_ALLOWED_DOMAINS.split(',').map((d) => d.trim().replace('**.', '*.'))
  : [];

// https://astro.build/config
export default defineConfig({
  integrations: [vue({ appEntrypoint: '/src/pages/_app' })],
  output: 'server',
  server: {
    host: true
  },
  security: {
    checkOrigin: false,
    allowedDomains: allowedDomains
  },
  image: {
    domains: allowedDomains.map(d => d.replace('*.', ''))
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
