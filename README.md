# TFDS-SIMPL-open-applications

Centralized monorepo hosting the TFDS-managed application source code. 

## Overview
This repository acts as the single source of truth for the user interface applications utilized by the TFDS agents (Governance Authority, Data Provider, Data Consumer) to interact with the federated catalogue and manage self-descriptions.

These applications are originally forked from the upstream SIMPL Open project (v3.1.x release train) and contain customizations and critical hotfixes optimized for TFDS agent deployments.

## Licensing & Compliance
This project is licensed under the **European Union Public Licence (EUPL) v1.2**, inheriting the license of the upstream SIMPL repositories.

### Upstream Modifications
In accordance with EUPL v1.2, the following modifications have been made to the original upstream SIMPL applications:
* **Customization & Configuration:** The applications have been optimized and configured to seamlessly integrate with TFDS agent environments, resolving specific environment variables for authentication servers, API endpoints, and gateways (such as the Tier 1 gateway).
* **Security & Dependency Updates:** Upgraded third-party dependencies to resolve vulnerabilities and aligned the application configurations (e.g., service accounts, resource limits/requests) with secure Kubernetes deployment standards.
* **UI/UX Refinements:** Aligned components with the Figma Design System and enhanced user flows (e.g., adding resource description lists, prefilling wizards, upload capabilities for deployment scripts, and resource description version history).

*Please refer to the `CHANGELOG.md` inside each application directory under `/apps` for detailed, application-specific modifications.*

## Structure
The repository utilizes a standard monorepo pattern. All frontend applications are located in the `/apps` directory.

```
.
├── LICENSE
├── README.md
└── apps/
    ├── catalogue-ui/
    │   ├── CHANGELOG.md
    │   ├── Dockerfile
    │   ├── LICENSE
    │   ├── README.md
    │   ├── charts/
    │   ├── documents/
    │   ├── package.json
    │   └── src/
    └── sd-ui/
        ├── CHANGELOG.md
        ├── Dockerfile
        ├── LICENSE
        ├── README.md
        ├── charts/
        ├── documents/
        ├── package.json
        └── src/
```
