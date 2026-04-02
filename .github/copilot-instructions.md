# Project Guidelines

## Overview

OpenFGA fine-grained authorization (ACL) project. Defines a role-based permission model where users are assigned to roles, roles grant permissions, and permissions support parent-child hierarchy.

## Architecture

- **model.fga** — Authorization model in FGA DSL (schema 1.1). Three types: `user`, `role`, `permission`. Access is computed via `assignee from role` OR `can_access from parent`.
- **model.test.mjs** — Vitest integration tests that connect to a live OpenFGA server, write the model, seed relationships, and verify check results.
- **kubevela-app.yaml** — KubeVela OAM deployment: OpenFGA Helm chart with PostgreSQL, a ConfigMap for the model, and an init Job that creates the store and writes the schema.
- **write-schema.sh** — Shell script used by the init Job; polls for API readiness, creates a store, and writes the model.

## Build and Test

```bash
npm install            # Install deps (@openfga/sdk, vitest)
npm test               # vitest run — requires OpenFGA server at http://localhost:8080
```

**Environment variables:**
| Variable | Default | Purpose |
|----------|---------|---------|
| `FGA_API_URL` | `http://localhost:8080` | OpenFGA server URL |
| `FGA_STORE_ID` | *(auto-created)* | Reuse an existing store |
| `FGA_MODEL_ID` | *(auto-created)* | Reuse an existing model |

## Conventions

- **Naming** — Entity IDs follow `type:name` format: `user:alice`, `role:editor`, `permission:product_edit`.
- **Tests are ESM** — Files use `.mjs` extension and ES module imports (`import { ... } from '@openfga/sdk'`).
- **Tests need a live server** — No mocks; tests run against a real OpenFGA instance. Ensure the server is running before executing tests.
- **FGA model changes** must stay in sync across `model.fga`, the ConfigMap in `kubevela-app.yaml`, and the test expectations in `model.test.mjs`.
