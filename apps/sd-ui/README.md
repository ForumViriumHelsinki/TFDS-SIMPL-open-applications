# SIMPL Self Description UI

This web application provides a user interface to create self description documents and publish the to the federated catalogue.

The application retrieves the schemas for the documents from the SD tooling backend and generates a form dynamically from them.

After the user fills out the form they can publish the document to the catalogue. Clicking the submit button starts the following steps:

1. **enrichAndValidate**: the contents of the document is validated and some of the fields get populated by the backend
2. **signing**: the validated and extended document gets signed by the signer service
3. **publishing**: the signed document gets published to the catalogue

## Documentation

| Guide | Purpose |
|-------|---------|
| [Installation Guide](documents/Installation%20Guide.md) | How to install & deploy (local, Docker, Kubernetes) |

## Environment variables

These variables are required to be set for the application to function. Make sure **not** to add trailing slashes to URLs.

```text
PUBLIC_AUTH_KEYCLOAK_SERVER_URL=""
PUBLIC_AUTH_KEYCLOAK_REALM=""
PUBLIC_AUTH_KEYCLOAK_CLIENT_ID=""
```

The URLs defined here should be endpoints available on the tier1 gateway

```text
PUBLIC_CREATION_WIZARD_API_URL=""
PUBLIC_CREATION_WIZARD_API_VERSION="v2"
PUBLIC_SIGNER_URL=""
```

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4322`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |
| `npm run cy:open`         | Run cypress E2E tests                            |

## 👀 Want to learn more?

[Astro documentation](https://docs.astro.build)