#!/usr/bin/env -S mise x -- bun --install=fallback
// Shared operations resolve declarations and delegate domain interpretation to installed owners.
import { Crust } from "@crustjs/core@^0.0.19";
import { helpPlugin } from "@crustjs/plugins@^0.1.2";
import { loadContracts, resolveContract } from "./contracts.ts";
import { readFile } from "node:fs/promises";
import { bulkUpgrade, safeUpgrade } from "./upgrades.ts";

const app = new Crust("skill-contracts").meta({ description: "Validate installed skill manifests and resolve local or pinned historical authoritative definitions." });
const skillFlag = { skill: { type: "string" as const, required: true as const, description: "Installed skill directory containing contracts.json." } };

const validate = app.sub("validate").meta({ description: "Validate all declarations and resolve every definition and upgrade procedure without mutation." })
  .flags(skillFlag)
  .run(async ({ flags }) => report(async () => loadContracts(flags.skill)));
const resolve = app.sub("resolve").meta({ description: "Validate the manifest and return the requested authoritative definition." })
  .flags({ ...skillFlag, contract: { type: "string", required: true, description: "Record-family contract identifier." } })
  .run(async ({ flags }) => report(async () => resolveContract(flags.skill, flags.contract)));

const upgradeFlags = {
  ...skillFlag,
  owner: { type: "string" as const, required: true as const, description: "Trusted installed owner adapter as file:relative-module.ts." },
};
const upgrade = app.sub("safe-upgrade").meta({ description: "Convert before an otherwise authorized owner mutation, then atomically persist validated content." })
  .flags({
    ...upgradeFlags,
    artifact: { type: "string", required: true, description: "Mutable artifact path." },
    operation: { type: "string", required: true, description: "Owner operation name, or upgrade for explicit conversion only." },
    request: { type: "string", description: "JSON file containing the authorized mutation request." },
  })
  .run(async ({ flags }) => report(async () => {
    const result = await safeUpgrade({
      ...flags, request: flags.request ? JSON.parse(await readFile(flags.request, "utf8")) : undefined,
    });
    if (result.status !== "completed") process.exitCode = 1;
    return result;
  }));
const bulk = app.sub("bulk-upgrade").meta({ description: "Explicitly convert selected artifacts and report every persisted change and rejection." })
  .flags({ ...upgradeFlags, artifacts: { type: "string", required: true, description: "JSON file containing distinct artifact paths." } })
  .run(async ({ flags }) => report(async () => {
    const result = await bulkUpgrade(flags, JSON.parse(await readFile(flags.artifacts, "utf8")));
    if (result.status !== "completed") process.exitCode = 1;
    return result;
  }));

async function report(operation: () => Promise<unknown>): Promise<void> {
  try {
    console.log(JSON.stringify(await operation(), null, 2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Contract operation failed.");
    process.exitCode = 1;
  }
}

app.use(helpPlugin()).command(validate).command(resolve).command(upgrade).command(bulk).execute();
