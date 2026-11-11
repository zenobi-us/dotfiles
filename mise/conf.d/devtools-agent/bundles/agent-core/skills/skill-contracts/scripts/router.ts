#!/usr/bin/env -S mise x -- bun --install=fallback
// Public read-only operations use the same validator as importing skill owners.
import { Crust } from "@crustjs/core@^0.0.19";
import { helpPlugin } from "@crustjs/plugins@^0.1.2";
import { loadContracts, resolveContract } from "./contracts.ts";

const app = new Crust("skill-contracts").meta({ description: "Validate installed skill manifests and resolve local authoritative definitions." });
const skillFlag = { skill: { type: "string" as const, required: true as const, description: "Installed skill directory containing contracts.json." } };

const validate = app.sub("validate").meta({ description: "Validate all declarations and resolve every definition and upgrade procedure without mutation." })
  .flags(skillFlag)
  .run(async ({ flags }) => report(async () => loadContracts(flags.skill)));
const resolve = app.sub("resolve").meta({ description: "Validate the manifest and return the requested authoritative definition." })
  .flags({ ...skillFlag, contract: { type: "string", required: true, description: "Record-family contract identifier." } })
  .run(async ({ flags }) => report(async () => resolveContract(flags.skill, flags.contract)));

async function report(operation: () => Promise<unknown>): Promise<void> {
  try {
    console.log(JSON.stringify(await operation(), null, 2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Contract operation failed.");
    process.exitCode = 1;
  }
}

app.use(helpPlugin()).command(validate).command(resolve).execute();
