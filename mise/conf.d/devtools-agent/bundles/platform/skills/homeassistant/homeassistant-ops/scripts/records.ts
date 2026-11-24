// Validates owned envelopes without rewriting saved evidence or Home Assistant payloads.
import Ajv, { type ValidateFunction } from "ajv@^8.17.1";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { loadContracts, type ContractManifest } from "../../../../../agent-core/skills/skill-contracts/scripts/contracts.ts";

type RecordValue = Record<string, unknown>;
interface RecordValidators {
  manifest: ContractManifest;
  checks: Map<string, ValidateFunction>;
}
const skillRoot = fileURLToPath(new URL("../", import.meta.url));
let declarations: Promise<RecordValidators> | undefined;

export async function readRecord(file: string, family?: string): Promise<{ identifier: string; value: RecordValue }> {
  const value: unknown = JSON.parse(readFileSync(file, "utf8"));
  const identifier = await validateRecord(value, family);
  return { identifier, value: value as RecordValue };
}

export async function writeRecord(file: string, value: RecordValue, indent = 2): Promise<void> {
  const identifier = await validateRecord(value);
  const { manifest } = await validators();
  if (!manifest.produces.includes(identifier)) throw new Error(`Unsupported output contract: ${identifier}`);
  // Snapshots and reports are evidence. An output path must not replace an earlier record.
  writeFileSync(file, JSON.stringify(sortKeys(value), null, indent) + "\n", { encoding: "utf8", flag: "wx" });
}

export async function validateRecord(value: unknown, family?: string): Promise<string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Record must be a JSON object");
  const record = value as RecordValue;
  const { manifest, checks } = await validators();
  const hasSchema = Object.hasOwn(record, "schema");
  const hasVersion = Object.hasOwn(record, "schemaVersion");
  let identifier: string;
  if (hasSchema || hasVersion) {
    // These formats never used `schema`. An unknown explicit identity is not legacy input.
    if (hasSchema) throw new Error("Unsupported schema field; use a supported schemaVersion");
    if (typeof record.schemaVersion !== "string" || !manifest.accepts.includes(record.schemaVersion)) {
      throw new Error(`Unsupported record contract: ${String(record.schemaVersion)}`);
    }
    identifier = record.schemaVersion;
  } else {
    const matches = manifest.accepts.filter(id => id.endsWith("/v1") && checks.get(id)!(record));
    if (matches.length !== 1) throw new Error(`Expected exactly one historical record format; found ${matches.length}`);
    identifier = matches[0]!;
  }
  if (family && !identifier.startsWith(`${family}/`)) throw new Error(`Expected ${family}, got ${identifier}`);
  const check = checks.get(identifier)!;
  if (!check(record)) throw new Error(`Invalid ${identifier}: ${JSON.stringify(check.errors)}`);
  return identifier;
}

function validators(): Promise<RecordValidators> {
  return declarations ??= loadValidators();
}

async function loadValidators(): Promise<RecordValidators> {
  const { manifest, definitions } = await loadContracts(skillRoot);
  const ajv = new Ajv({ allErrors: true, ownProperties: true });
  const checks = new Map<string, ValidateFunction>();
  for (const identifier of manifest.accepts) {
    checks.set(identifier, ajv.compile(JSON.parse(definitions[identifier]!.content)));
  }
  return { manifest, checks };
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, item]) => [key, sortKeys(item)]));
  }
  return value;
}
