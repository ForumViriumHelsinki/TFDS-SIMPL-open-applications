# SIMPL Catalogue UI

This web application provides a user interface for the xsfc catalogue. Features:

* Authentication with keycloak and tier1 gateway
* Quick search
* Advanced search

## Documentation

| Guide | Purpose |
|-------|---------|
| [Installation Guide](documents/Installation%20Guide.md) | How to install & deploy (local, Docker, Kubernetes) |
| [User Guide](documents/User%20Guide.md) | How to use the UI: search, negotiation & transfers |

> The guides live in `documents/` so they can be packaged or surfaced in Storybook/Help menus later.

## Environment variables

Make sure to **not** add trailing slashes to base URLS

Tier1 gateway keycloak authentication settings

```text
PUBLIC_AUTH_KEYCLOAK_SERVER_URL=""
PUBLIC_AUTH_KEYCLOAK_REALM=""
PUBLIC_AUTH_KEYCLOAK_CLIENT_ID=""
```

Base URL of the xsfc-advsearch-be instance exposed by Tier1 gateway which provides schemas for advanced search and gateways to quick and advanced search. Also the version of the API, for example: v1

```text
PUBLIC_SEARCH_API_URL=""
PUBLIC_SEARCH_API_VERSION="v1"
```

Base URL of the contract-consumption-be instance, and the version

```text
PUBLIC_CONTRACT_CONSUMPTION_API_URL=""
PUBLIC_CONTRACT_CONSUMPTION_API_VERSION="v1"
```

Setting that specifies if the application is deployed on the "consumer" or "provider" agent. Those are the two possible values.

```text
PUBLIC_AGENT_TYPE="consumer"
```

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   └── Card.astro
│   ├── layouts/
│   │   └── Layout.astro
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
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

[Astro documentation](https://docs.astro.build)
