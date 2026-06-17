/** @type {import("prettier").Config} */

export default {
  plugins: ['prettier-plugin-astro', 'prettier-plugin-tailwindcss'],
  overrides: [
    {
      files: '*.astro',
      options: {
        parser: 'astro',
      },
    },
  ],
  useTabs: false,
  singleQuote: true,
  trailingComma: 'es5',
  semi: true,
  printWidth: 100,
  pluginSearchDirs: false,
};
