import { Given, Then, Before, AfterAll } from "@cucumber/cucumber";
import { OpenFgaClient } from "@openfga/sdk";
import assert from "node:assert/strict";

const FGA_API_URL = process.env.FGA_API_URL || "http://localhost:8080";
const FGA_STORE_ID = process.env.FGA_STORE_ID;
const FGA_MODEL_ID = process.env.FGA_MODEL_ID;

let fgaClient;
let setupDone = false;

Before(async function () {
  if (fgaClient) return;

  if (FGA_STORE_ID) {
    fgaClient = new OpenFgaClient({
      apiUrl: FGA_API_URL,
      storeId: FGA_STORE_ID,
      authorizationModelId: FGA_MODEL_ID,
    });
  } else {
    fgaClient = new OpenFgaClient({ apiUrl: FGA_API_URL });
    const { id: storeId } = await fgaClient.createStore({
      name: "bdd-test-store",
    });
    fgaClient.storeId = storeId;

    const model = (
      await import("../../model.json", { with: { type: "json" } })
    ).default;
    const { authorization_model_id } =
      await fgaClient.writeAuthorizationModel(model);
    fgaClient.authorizationModelId = authorization_model_id;
  }
});

Given(
  "the following built-in permissions exist:",
  async function (dataTable) {
    if (setupDone) return;

    const rows = dataTable.hashes();
    const writes = [];

    for (const row of rows) {
      const permission = row.permission.replace(":", "_");
      const parents = row.parents
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);

      for (const parent of parents) {
        const parentPermission = parent.replace(":", "_");
        writes.push({
          user: `permission:${permission}`,
          relation: "parent",
          object: `permission:${parentPermission}`,
        });
      }
    }

    if (writes.length > 0) {
      await fgaClient.write({ writes });
    }
  },
);

Given(
  "the following roles with permissions exist:",
  async function (dataTable) {
    if (setupDone) return;

    const rows = dataTable.hashes();
    const writes = [];

    for (const row of rows) {
      const role = row.role;
      const permissions = row.permissions
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);

      for (const perm of permissions) {
        const permission = perm.replace(":", "_");
        writes.push({
          user: `role:${role}`,
          relation: "role",
          object: `permission:${permission}`,
        });
      }
    }

    if (writes.length > 0) {
      await fgaClient.write({ writes });
    }
  },
);

Given(
  "the following users are assigned to roles:",
  async function (dataTable) {
    if (setupDone) return;

    const rows = dataTable.hashes();
    const writes = [];

    for (const row of rows) {
      const user = row.user;
      const roles = row.roles
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean);

      for (const role of roles) {
        writes.push({
          user: `user:${user}`,
          relation: "assignee",
          object: `role:${role}`,
        });
      }
    }

    if (writes.length > 0) {
      await fgaClient.write({ writes });
    }

    setupDone = true;
  },
);

Then(
  "the following users should have access:",
  async function (dataTable) {
    const rows = dataTable.hashes();
    const results = await Promise.all(
      rows.map(async (row) => {
        const permission = row.permission.replace(":", "_");
        const { allowed } = await fgaClient.check({
          user: `user:${row.user}`,
          relation: "can_access",
          object: `permission:${permission}`,
        });
        return { ...row, actual: allowed };
      }),
    );

    for (const result of results) {
      const expected = result.allowed === "yes";
      assert.equal(
        result.actual,
        expected,
        `Expected user "${result.user}" to ${expected ? "have" : "NOT have"} access to "${result.permission}", but got ${result.actual}`,
      );
    }
  },
);
