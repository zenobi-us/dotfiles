#!/usr/bin/env -S mise x -- bun
// Validate domain content before transport; delivery owns only identity and handoff integrity.
import Ajv from "ajv@^8.17.1";
import { readFile } from "node:fs/promises";
import current from "../references/contracts/result-v2.json";
import historical from "../references/contracts/result-v1.json";

const ajv = new Ajv({ allErrors: true, ownProperties: true });
const validators = {
  "tracker-result/v1": ajv.compile(historical),
  "tracker-result/v2": ajv.compile(current),
};

export function assertTrackerResult(value: unknown): asserts value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Tracker result must be an object.");
  if (Object.hasOwn(value, "schema") && Object.hasOwn(value, "schemaVersion")) throw new Error("Tracker result cannot declare both schema and schemaVersion.");
  const identity = "schemaVersion" in value ? value.schemaVersion : "schema" in value ? value.schema : undefined;
  if (identity !== "tracker-result/v1" && identity !== "tracker-result/v2") throw new Error("Unsupported tracker result contract.");
  const validator = validators[identity];
  if (!validator(value)) throw new Error(`Invalid tracker result: ${ajv.errorsText(validator.errors)}`);
}

if (import.meta.main) {
  try {
    const args = process.argv.slice(2);
    if (args.length !== 2 || args[0] !== "--input") throw new Error("Usage: validate-result.ts --input <result.json>");
    const value: unknown = JSON.parse(await readFile(args[1], "utf8"));
    assertTrackerResult(value);
    console.log(JSON.stringify(value, null, 2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
