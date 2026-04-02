# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

OpenFGA fine-grained authorization (ACL) project. Defines a role-based permission model where users are assigned to roles, roles grant permissions, and permissions support parent-child inheritance.

## Commands

```bash
npm install              # Install dependencies
npm test                 # Run Vitest unit tests (requires live OpenFGA at localhost:8080)
npm run test:bdd         # Run CucumberJS BDD tests (requires live OpenFGA at localhost:8080)
```

Environment variables for tests: `FGA_API_URL` (default `http://localhost:8080`), `FGA_STORE_ID`, `FGA_MODEL_ID` (both auto-created if omitted).

## Architecture

**Authorization model** (`model.fga`, schema 1.1): Three types — `user`, `role`, `permission`. Access formula: `can_access = assignee from role OR can_access from parent`. This enables RBAC with permission inheritance (e.g., `product:create` implies `product:view`).

**Testing** — Two test suites, both require a running OpenFGA server (no mocks):
- `model.test.mjs` — Vitest integration tests. Writes model from `model.json`, seeds relationships, verifies `check()` results.
- `features/permissions.feature` + `features/step_definitions/permissions.steps.mjs` — CucumberJS BDD tests with Gherkin scenarios covering inheritance, cross-module isolation, multi-role users, and super admin.

**Deployment** — `kubevela-app.yaml` is a KubeVela OAM app: OpenFGA Helm chart with PostgreSQL, ConfigMap embedding the model, and an init Job (`write-schema.sh`) that creates the store and writes the schema.

**CI** — `.github/workflows/test.yml` runs both test suites using `.github/actions/setup-openfga` (starts OpenFGA Docker container, creates store, loads model via FGA CLI).

## Conventions

- Entity IDs: `type:name` format — `user:alice`, `role:editor`, `permission:category_view`.
- In BDD steps, permission names like `category:view` are converted to `permission:category_view` (colon → underscore).
- All test files use ESM (`.mjs` extension, `import` syntax).
- FGA model changes must stay in sync across `model.fga`, `model.json`, the ConfigMap in `kubevela-app.yaml`, and test expectations.
