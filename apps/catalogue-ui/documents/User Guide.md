# Catalogue UI User Guide

## Table of Contents

- [Catalogue UI User Guide](#catalogue-ui-user-guide)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Core Features](#core-features)
  - [Quick Start](#quick-start)
  - [Access \& Authentication](#access--authentication)
  - [Searching](#searching)
    - [Quick Search](#quick-search)
    - [Advanced Search](#advanced-search)
    - [Result List](#result-list)
  - [Details View](#details-view)
  - [Contract Negotiation](#contract-negotiation)
  - [Data Transfer](#data-transfer)
    - [Transfer Details Form](#transfer-details-form)
    - [Submit \& Monitor](#submit--monitor)
  - [Appendix](#appendix)

---

## Overview

This application lets you:

- Discover resource descriptions
- Inspect detailed metadata
- Negotiate access (when permitted)
- Initiate and monitor data transfers

## Core Features

| Feature | Purpose |
|---------|---------|
| Quick Search | Free‑text search across all resource descriptions |
| Advanced Search | Schema-aware, field-specific queries |
| Details View | Rich metadata, eligibility & actions |
| Contract Negotiation | Automated agreement workflow |
| Data Transfer | Configure destination & execute delivery |

## Quick Start

1. Open the application.
2. Click `Search` (empty query allowed) to list recent or all resources (depending on configuration).
3. Enter terms (Quick Search) OR switch to Advanced Search for structured filters.
4. Open a result via `More Details`.
5. If eligible, click `Get Data` to begin negotiation.
6. After successful negotiation, enter transfer details and submit.
7. Monitor progress until `Complete`, then verify at your destination.

---

## Access & Authentication

Authentication now occurs automatically when you open the application:

- On first load, the UI silently redirects to the identity provider (Keycloak) and completes single sign‑on (SSO) if you already have an active session.
- If no active session exists, a login page appears; after successful login you are returned to the originally requested page.
- Subsequent navigation reuses the existing session until it expires or you explicitly sign out (sign‑out method may be provided via a profile / user menu if enabled in your deployment).
- If an authentication error occurs (e.g., malformed redirect, expired realm config), a generic access error page or a blank screen with console errors may appear—refresh first, then contact support if persistent.

**Token Handling (summary):**

- An authorization code flow runs in the background; short‑lived access tokens are refreshed automatically before expiry.
- Public runtime environment variables (`PUBLIC_AUTH_*`) determine realm, client, and issuer endpoints; mismatches can cause immediate redirect loops.

**Minimal User Action:**

- In normal circumstances you do not need to click a "Login" button—access is immediate after the initial redirect completes.
- Manual re‑authentication only occurs if the session expires or you open the app in a fresh context (new browser / cleared storage).

---

## Searching

### Quick Search

Use the global search box:

- Enter any keyword, fragment, or phrase.
- Press `Enter` or click `Search`.

Best for exploratory discovery.

### Advanced Search

1. Select a schema (e.g., `Data`, `Infrastructure`).
2. A dynamic form lists searchable fields.
3. Fill one or more fields (exact/partial matching depends on field type).
4. Run the search.

Best for precise queries when you know the structure.

### Result List

Each entry typically shows:

- Title / Name
- Description / Abstract

Primary action:

- `More Details` (opens full resource page)

---

## Details View

Displays:

- Full metadata sections
- Eligibility indicator for transfer
- Status of negotiation (if in progress)

The `Get Data` button becomes enabled when:

- The contract consumption backend service returns a valid response for the /offers endpoint call

If the button is disabled, the asset is not available for transfer.

---

## Contract Negotiation

Triggered by clicking `Get Data`.

Possible states:

- In progress
- Success
- Failed

Negotiations are automatic; just wait.

---

## Data Transfer

### Transfer Details Form

Provide:

- **Destination Address**: Where the asset will be delivered.
- **Sharing Method**: Mechanism / protocol (e.g., HTTP push, S3, object store).
- **Address Template**: A set of fields specific to the sharing method

Validation runs inline; all required fields must pass before continuing.

### Submit & Monitor

After submitting:

- Status transitions: `In Progress` → `Complete` (or `Failed`).

On completion, verify externally at the destination.

---

<!-- Removed redundant 'Using the Application' section; access instructions now covered in Access & Authentication. -->

## Appendix

For environment-specific behaviors (timeouts, supported methods), refer to deployment documentation.
