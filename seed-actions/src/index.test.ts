import { describe, it, expect } from "vitest";
import { buildTuples } from "./index.js";

describe("buildTuples", () => {
  it("generates parent tuples from includes", () => {
    const config = {
      permissions: [
        {
          resource: "category",
          actions: [
            { name: "view" },
            { name: "create", includes: ["view"] },
            { name: "edit", includes: ["view"] },
            { name: "delete", includes: ["create", "edit"] },
          ],
        },
      ],
    };

    const tuples = buildTuples(config);

    expect(tuples).toEqual([
      { user: "permission:category_create", relation: "parent", object: "permission:category_view" },
      { user: "permission:category_edit", relation: "parent", object: "permission:category_view" },
      { user: "permission:category_delete", relation: "parent", object: "permission:category_create" },
      { user: "permission:category_delete", relation: "parent", object: "permission:category_edit" },
    ]);
  });

  it("returns empty array when no includes exist", () => {
    const config = {
      permissions: [
        {
          resource: "category",
          actions: [{ name: "view" }, { name: "create" }],
        },
      ],
    };

    const tuples = buildTuples(config);

    expect(tuples).toEqual([]);
  });

  it("handles multiple resources", () => {
    const config = {
      permissions: [
        {
          resource: "category",
          actions: [
            { name: "view" },
            { name: "create", includes: ["view"] },
          ],
        },
        {
          resource: "invoice",
          actions: [
            { name: "view" },
            { name: "edit", includes: ["view"] },
          ],
        },
      ],
    };

    const tuples = buildTuples(config);

    expect(tuples).toEqual([
      { user: "permission:category_create", relation: "parent", object: "permission:category_view" },
      { user: "permission:invoice_edit", relation: "parent", object: "permission:invoice_view" },
    ]);
  });
});
