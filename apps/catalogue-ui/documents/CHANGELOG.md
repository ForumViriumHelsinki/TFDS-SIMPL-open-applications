## 1.2.4 (2025-07-11)

### changed (1 change)

- [[SIMPL-11996] Changed logout to not require confirmation](https://code.europa.eu/simpl/simpl-open/development/gaia-x-edc/simpl-catalogue-client/-/commit/b9090889609aeb4b6421048dc8a8362df27a2900) ([merge request](https://code.europa.eu/simpl/simpl-open/development/gaia-x-edc/simpl-catalogue-client/-/merge_requests/63))


## 1.2.3 (2025-07-02)

### added (1 change)

- [[SIMPL-10368](https://jira.simplprogramme.eu/browse/SIMPL-14467) Super-linear runtime fix.](https://code.europa.eu/simpl/simpl-open/development/gaia-x-edc/simpl-catalogue-client/-/commit/cac341124c04e40d28d694145ee9e87139964579) ([merge request](https://code.europa.eu/simpl/simpl-open/development/gaia-x-edc/simpl-catalogue-client/-/merge_requests/61))


## 1.2.2 (2025-07-02)

### fixed (1 change)

- [[SIMPL-6095](https://jira.simplprogramme.eu/browse/SIMPL-6095) Fixed price...](https://code.europa.eu/simpl/simpl-open/development/gaia-x-edc/simpl-catalogue-client/-/commit/3fa7628a8bb3c2e30f401f81c0a82545ccca2d6c) ([merge request](https://code.europa.eu/simpl/simpl-open/development/gaia-x-edc/simpl-catalogue-client/-/merge_requests/54))


## 1.2.1 (2024-05-09)

### Added

- Classes to elements to aid testing
- Unit tests to increase code coverage to 80%

## 1.2.0 (2024-02-17)

### Added

- Advanced search JSON forms implementation using ttl endpoints and useForAdvancedSearch property

### Changed

- Clicking "Request resource" is now possible without clicking more details

## 1.1.0 (2024-01-24)

### Added

- Logout option
- Option to hide "Request resource" button by setting environment variable

### Changed

- Object name field to blob name in transfer address

### Fixed

- Gateway timeout bug when token expires
- Redirections to subpages after logging in
- Ingress settings to avoid 502 errors

## 1.0.0 (2024-12-23)

### Added

- Requesting data and infrastructure resources with contract consumption and negotiation
- Transfer process start and status
- Modal component

## Changed

- All local API requests to use generic function

## 0.2.2 (2024-12-16)

### Changed

- Favicon
- Icon fill colors to mainly use currentColor

## Removed

- Query search feature
- Federated catalogue service and types

## 0.2.1 (2024-12-12)

### Added

- Added status page that requires no login and added it for liveness and readiness k8s probes
- Resource types to search results
- Loading of self descriptions while scrollin

### Fixed

- Modified endpoints according to newest version of IAA components

### Changed

- All backend API calls to go through an Astro endpoint
- Retrieval of single self descriptions by ID to happen through sdtooling-be
- Converted header from React to Vue
- Integrated quick search into one search page with tabs

## 0.2.0 (2024-12-05)

### Added

- Tier1 gateway integration
- Authentication by redirecting to external login page
- Semantic validation for advanced search: validation warning messages on inputs
- Some Simpl Open design elements

### Changed

- API calls refactored
- API error handling

### Removed

- Deprecated features: sign json, publish json file to catalogue
- Catalogue selection dropdowns
- Catalogue specific keycloak authentication
- Login page and old auth components
- SD UI related components and pages

## 0.1.6 (2024-10-24)

### Added

- New repository for separating catalogue UI featuires from SD UI
