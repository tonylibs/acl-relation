import { readFileSync } from "node:fs";
import { parse } from "yaml";
import { OpenFgaClient } from "@openfga/sdk";

interface Action {
  name: string;
  includes?: string[];
}

interface ResourcePermissions {
  resource: string;
  actions: Action[];
}

interface ActionsConfig {
  permissions: ResourcePermissions[];
}

interface Tuple {
  user: string;
  relation: string;
  object: string;
}

export function buildTuples(config: ActionsConfig): Tuple[] {
  const tuples: Tuple[] = [];

  for (const group of config.permissions) {
    for (const action of group.actions) {
      if (!action.includes) continue;
      for (const included of action.includes) {
        tuples.push({
          user: `permission:${group.resource}_${action.name}`,
          relation: "parent",
          object: `permission:${group.resource}_${included}`,
        });
      }
    }
  }

  return tuples;
}

async function main() {
  const configPath = process.env.ACTIONS_CONFIG_PATH || "/config/actions.yaml";
  const apiUrl = process.env.FGA_API_URL || "http://localhost:8080";
  const storeId = process.env.FGA_STORE_ID;
  const modelId = process.env.FGA_MODEL_ID;

  if (!storeId) {
    console.error("FGA_STORE_ID is required");
    process.exit(1);
  }

  const raw = readFileSync(configPath, "utf-8");
  const config: ActionsConfig = parse(raw);
  const tuples = buildTuples(config);

  if (tuples.length === 0) {
    console.log("No permission tuples to write.");
    return;
  }

  console.log(`Writing ${tuples.length} permission tuples...`);

  const fgaClient = new OpenFgaClient({
    apiUrl,
    storeId,
    authorizationModelId: modelId,
  });

  await fgaClient.write({ writes: tuples });

  console.log(`Successfully wrote ${tuples.length} tuples.`);
}

const isMainModule = !process.env.VITEST;
if (isMainModule) {
  main().catch((err) => {
    console.error("Failed to seed actions:", err);
    process.exit(1);
  });
}
