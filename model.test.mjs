import { describe, it, expect, beforeAll } from "vitest";
import { OpenFgaClient } from "@openfga/sdk";

const FGA_API_URL = process.env.FGA_API_URL || "http://localhost:8080";
const FGA_STORE_ID = process.env.FGA_STORE_ID;
const FGA_MODEL_ID = process.env.FGA_MODEL_ID;

describe("ACL Authorization Model", () => {
  let fgaClient;

  beforeAll(async () => {
    if (FGA_STORE_ID) {
      fgaClient = new OpenFgaClient({
        apiUrl: FGA_API_URL,
        storeId: FGA_STORE_ID,
        authorizationModelId: FGA_MODEL_ID,
      });
    } else {
      fgaClient = new OpenFgaClient({ apiUrl: FGA_API_URL });
      const { id: storeId } = await fgaClient.createStore({
        name: "acl-test-store",
      });
      fgaClient.storeId = storeId;

      const { authorization_model_id } =
        await fgaClient.writeAuthorizationModel(
          (await import("./model.json", { with: { type: "json" } })).default,
        );
      fgaClient.authorizationModelId = authorization_model_id;
    }
  });

  it("should allow access when user is assigned to a role that has the permission", async () => {
    await fgaClient.write({
      writes: [
        { user: "role:editor", relation: "role", object: "permission:product_edit" },
        { user: "user:alice", relation: "assignee", object: "role:editor" },
      ],
    });

    const { allowed } = await fgaClient.check({
      user: "user:alice",
      relation: "can_access",
      object: "permission:product_edit",
    });

    expect(allowed).toBe(true);
  });

  it("should deny access when user has no role assigned", async () => {
    const { allowed } = await fgaClient.check({
      user: "user:bob",
      relation: "can_access",
      object: "permission:product_edit",
    });

    expect(allowed).toBe(false);
  });

  it("should deny access when user's role does not have the permission", async () => {
    await fgaClient.write({
      writes: [
        { user: "user:charlie", relation: "assignee", object: "role:viewer" },
        { user: "role:viewer", relation: "role", object: "permission:product_view" },
      ],
    });

    const { allowed } = await fgaClient.check({
      user: "user:charlie",
      relation: "can_access",
      object: "permission:product_edit",
    });

    expect(allowed).toBe(false);
  });

  it("should allow a role to have multiple permissions", async () => {
    await fgaClient.write({
      writes: [
        { user: "role:admin", relation: "role", object: "permission:product_view" },
        { user: "role:admin", relation: "role", object: "permission:product_edit" },
        { user: "role:admin", relation: "role", object: "permission:category_edit" },
        { user: "role:admin", relation: "role", object: "permission:category_delete" },
        { user: "user:diana", relation: "assignee", object: "role:admin" },
      ],
    });

    const checks = await Promise.all([
      fgaClient.check({ user: "user:diana", relation: "can_access", object: "permission:product_view" }),
      fgaClient.check({ user: "user:diana", relation: "can_access", object: "permission:product_edit" }),
      fgaClient.check({ user: "user:diana", relation: "can_access", object: "permission:category_edit" }),
      fgaClient.check({ user: "user:diana", relation: "can_access", object: "permission:category_delete" }),
    ]);

    expect(checks.every((c) => c.allowed)).toBe(true);
  });

  it("should allow multiple users to be assigned to the same role", async () => {
    await fgaClient.write({
      writes: [
        { user: "role:support", relation: "role", object: "permission:product_view" },
        { user: "user:eve", relation: "assignee", object: "role:support" },
        { user: "user:frank", relation: "assignee", object: "role:support" },
      ],
    });

    const [eve, frank] = await Promise.all([
      fgaClient.check({ user: "user:eve", relation: "can_access", object: "permission:product_view" }),
      fgaClient.check({ user: "user:frank", relation: "can_access", object: "permission:product_view" }),
    ]);

    expect(eve.allowed).toBe(true);
    expect(frank.allowed).toBe(true);
  });

  it("should deny access to a permission not linked to any role", async () => {
    const { allowed } = await fgaClient.check({
      user: "user:diana",
      relation: "can_access",
      object: "permission:settings_manage",
    });

    expect(allowed).toBe(false);
  });

  it("should allow access to product:view when user has product:create via parent relation", async () => {
    await fgaClient.write({
      writes: [
        { user: "permission:product_create", relation: "parent", object: "permission:product_view" },
        { user: "role:creator", relation: "role", object: "permission:product_create" },
        { user: "user:grace", relation: "assignee", object: "role:creator" },
      ],
    });

    // grace has product_create, which should imply product_view
    const [canCreate, canView] = await Promise.all([
      fgaClient.check({ user: "user:grace", relation: "can_access", object: "permission:product_create" }),
      fgaClient.check({ user: "user:grace", relation: "can_access", object: "permission:product_view" }),
    ]);

    expect(canCreate.allowed).toBe(true);
    expect(canView.allowed).toBe(true);
  });

  it("should not leak permissions between different roles", async () => {
    // charlie is in role:viewer which has product_view but NOT category_delete
    const { allowed } = await fgaClient.check({
      user: "user:charlie",
      relation: "can_access",
      object: "permission:category_delete",
    });

    expect(allowed).toBe(false);
  });
});
