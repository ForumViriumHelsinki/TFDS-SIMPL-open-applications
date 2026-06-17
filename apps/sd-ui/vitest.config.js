import { fileURLToPath } from 'node:url';
import { configDefaults } from 'vitest/config';
import { getViteConfig } from 'astro/config';
import path from 'path';

export default getViteConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    exclude: [...configDefaults.exclude, 'e2e/**'],
    root: fileURLToPath(new URL('./', import.meta.url)),
    include: ['test/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
    globals: true,
    coverage: {
      reportsDirectory: './coverage',
      provider: 'istanbul',
      reporter: ['json', 'lcov', 'html'],
      include: ['src/**/*.{js,jsx,ts,tsx,vue}'],
      exclude: [
        'src/**/*.astro',
        'src/pages/**/*.{js,ts}',
        'src/*.{js,ts}',
        'src/services/**/*.{js,ts}',
        'src/api/*.{js,ts}',
      ],
    },
  },
});
