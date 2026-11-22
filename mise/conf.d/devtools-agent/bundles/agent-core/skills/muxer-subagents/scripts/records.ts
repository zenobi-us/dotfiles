// Validates muxer-owned records. Historical reads retain original wire fields.
import Ajv from "ajv@^8.17.1";
import { constants } from "node:fs";
import { lstat, open } from "node:fs/promises";
import { dirname, parse, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadContracts } from "../../skill-contracts/scripts/contracts.ts";
import runV1 from "../references/contracts/muxer-run-v1.json";
import runV2 from "../references/contracts/muxer-run-v2.json";
import signalV1 from "../references/contracts/muxer-completion-v1.json";
import signalV2 from "../references/contracts/muxer-completion-v2.json";
import resourcesV1 from "../references/contracts/muxer-resources-v1.json";
import resourcesV2 from "../references/contracts/muxer-resources-v2.json";
import processV1 from "../references/contracts/muxer-owned-process-v1.json";
import processV2 from "../references/contracts/muxer-owned-process-v2.json";

export type RecordFamily = "muxer-run" | "muxer-completion" | "muxer-resources" | "muxer-owned-process";
const definitions = {
  "muxer-run": [runV1, runV2], "muxer-completion": [signalV1, signalV2],
  "muxer-resources": [resourcesV1, resourcesV2], "muxer-owned-process": [processV1, processV2],
};
const ajv = new Ajv({ allErrors: true, ownProperties: true });
const validators = Object.fromEntries(Object.entries(definitions).map(([family, schemas]) =>
  [family, schemas.map(schema => ajv.compile(schema))]));

export async function validateManifest(): Promise<void> {
  await loadContracts(fileURLToPath(new URL("../", import.meta.url)));
}

export function validateRecord(value: unknown, family: RecordFamily, runId: string, historical = false): asserts value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`Invalid ${family} record`);
  const record = value as Record<string, unknown>;
  // An explicit unknown identity never falls through to legacy detection.
  const current = record.schemaVersion === `${family}/v2`;
  if (record.schemaVersion !== undefined && !current) throw new Error(`Unsupported ${family} schemaVersion`);
  if (!current && !historical) throw new Error(`${family} requires an explicit historical reader`);
  const validator = validators[family]![current ? 1 : 0]!;
  if (!validator(record)) throw new Error(`Invalid ${family}: ${ajv.errorsText(validator.errors)}`);
  if ((family !== "muxer-owned-process" || current) && record.runId !== runId) throw new Error(`${family} run id does not match`);
  if (family === "muxer-resources") {
    const processes = record.processes as Array<{ state: string }>;
    if (record.shutdown === "confirmed" && (processes.length === 0 || processes.some(item => item.state !== "stopped"))) {
      throw new Error("Confirmed shutdown requires stopped process identities");
    }
    if ((record.shutdown === "pending") !== processes.some(item => item.state === "running")) {
      throw new Error("Pending shutdown must match live owned processes");
    }
  }
}

// Reject symlinked state descendants before interpreting or replacing evidence.
// The state root itself may be a system alias (/home -> /var/home).
export async function assertRunPath(path: string): Promise<void> {
  let current = resolve(path);
  const stop = dirname(dirname(dirname(dirname(current))));
  while (current !== stop && current !== parse(current).root) {
    try {
      if ((await lstat(current)).isSymbolicLink()) throw new Error(`Unsafe symlink in run path: ${current}`);
    } catch (error) {
      if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
    }
    current = dirname(current);
  }
}

export async function readRecord(path: string): Promise<unknown> {
  await assertRunPath(path);
  const file = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  try { return JSON.parse(await file.readFile("utf8")); }
  finally { await file.close(); }
}

