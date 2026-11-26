// Domain readers keep historical JSON read-only. The shared skill owns manifest
// validation and persistence; these checks own assessment meaning.
import { MATURITY_MODEL } from "./types.ts";
import type { Answers } from "../score-maturity.ts";
import type { AuditState, Evidence, Findings, Maturity, Snapshot } from "./types.ts";

export const CONTRACTS = {
  answers: "plain-language-answers",
  findings: "plain-language-findings",
  evidence: "plain-language-evidence",
  maturity: "plain-language-maturity",
  state: "plain-language-audit-state",
} as const;
export type Family = keyof typeof CONTRACTS;
type Records = { answers: Answers; findings: Findings; evidence: Evidence; maturity: Maturity; state: AuditState };
type ObjectValue = Record<string, unknown>;

/** Validate identity and content without changing the supplied object. */
export function readRecord<F extends Family>(family: F, input: unknown): Records[F] {
  if (!object(input)) throw new Error("Assessment input must be a JSON object.");
  const explicit = identify(input);
  const contract = explicit ?? detectLegacy(input);
  if (contract !== `${CONTRACTS[family]}/v1` && contract !== `${CONTRACTS[family]}/v2`) {
    throw new Error("Unsupported assessment contract for this input.");
  }
  if (!validRecord(contract, input)) throw new Error("Invalid assessment content for its contract.");
  return input as unknown as Records[F];
}

export function identify(value: ObjectValue): string | null {
  if (Object.hasOwn(value, "schema")) throw new Error("Unsupported or mixed assessment identity fields.");
  if (!Object.hasOwn(value, "schemaVersion")) return null;
  if (typeof value.schemaVersion !== "string") throw new Error("Explicit schemaVersion must be a string.");
  return value.schemaVersion;
}

export function detectLegacy(value: ObjectValue): string {
  if (identify(value) !== null) throw new Error("Explicit identities are not legacy candidates.");
  const matches = Object.keys(CONTRACTS).filter((family) => validShape(family as Family, value));
  if (matches.length !== 1) throw new Error("Unversioned assessment requires exactly one historical shape.");
  return `${CONTRACTS[matches[0] as Family]}/v1`;
}

export function validRecord(contract: string, value: unknown): boolean {
  if (!object(value)) return false;
  const family = (Object.keys(CONTRACTS) as Family[]).find((key) =>
    contract === `${CONTRACTS[key]}/v1` || contract === `${CONTRACTS[key]}/v2`);
  if (!family || Object.hasOwn(value, "schema")) return false;
  if (contract.endsWith("/v1")) {
    if (Object.hasOwn(value, "schemaVersion")) return false;
    try { if (detectLegacy(value) !== contract) return false; } catch { return false; }
  } else if (value.schemaVersion !== contract) return false;
  return validShape(family, value);
}

/** Reject numeric loss before a mutable container can be serialised again. */
export function parseRecord(content: string): ObjectValue {
  const value: unknown = JSON.parse(content, (_key, value: unknown, context?: { source?: string }) => {
    if (typeof value === "number" && (!context?.source || !Number.isFinite(value) || Object.is(value, -0)
      || decimal(context.source) !== decimal(JSON.stringify(value)))) {
      throw new Error("Assessment number cannot round-trip without loss.");
    }
    return value;
  });
  rejectDuplicateKeys(content);
  if (!object(value)) throw new Error("Assessment input must be a JSON object.");
  return value;
}

export function authored(value: ObjectValue): ObjectValue {
  const { schemaVersion: _identity, ...content } = value;
  return content;
}

export function validSnapshot(value: unknown): value is Snapshot {
  return object(value) && !Object.hasOwn(value, "schema") && !Object.hasOwn(value, "schemaVersion")
    && typeof value.timestamp === "string" && Number.isFinite(Date.parse(value.timestamp))
    && counts(value.totals) && level(value.overall);
}

function validShape(family: Family, value: ObjectValue): boolean {
  switch (family) {
    case "answers":
      return (!Object.hasOwn(value, "organisation") || typeof value.organisation === "string")
        && object(value.dimensions) && Object.values(value.dimensions).every((dimension) =>
          object(dimension) && Object.values(dimension).every((answer) => typeof answer === "boolean"));
    case "findings": {
      if (typeof value.configHash !== "string" || !object(value.files) || !counts(value.totals)
        || (Object.hasOwn(value, "skipped") && !strings(value.skipped))) return false;
      const suppliedTotals = value.totals;
      const totals = new Map<string, number>();
      for (const file of Object.values(value.files)) {
        if (!object(file) || !Array.isArray(file.violations)) return false;
        for (const violation of file.violations) {
          if (!object(violation) || typeof violation.rule !== "string" || !violation.rule
            || !Number.isSafeInteger(violation.line) || (violation.line as number) < 1
            || typeof violation.detail !== "string") return false;
          totals.set(violation.rule, (totals.get(violation.rule) ?? 0) + 1);
        }
      }
      return [...totals].every(([rule, count]) => suppliedTotals[rule] === count)
        && Object.entries(suppliedTotals).every(([rule, count]) => count === (totals.get(rule) ?? 0));
    }
    case "evidence":
      return object(value.artefacts) && Object.values(value.artefacts).every((entry) =>
        object(entry) && typeof entry.found === "boolean" && strings(entry.paths)
        && entry.found === (entry.paths.length > 0));
    case "maturity": {
      if (!object(value.dimensions) || !level(value.overall)) return false;
      let weakest = 4;
      for (const dimension of Object.keys(MATURITY_MODEL)) {
        const result = value.dimensions[dimension];
        if (!object(result) || !level(result.level) || !strings(result.missing)) return false;
        const next = MATURITY_MODEL[dimension][result.level as number];
        if (next ? result.missing.length === 0 || result.missing.some((criterion) => !next.includes(criterion))
          : result.missing.length !== 0) return false;
        weakest = Math.min(weakest, result.level as number);
      }
      return value.overall === weakest;
    }
    case "state":
      return Array.isArray(value.snapshots) && value.snapshots.every(validSnapshot);
  }
}

function object(value: unknown): value is ObjectValue {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function strings(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}
function counts(value: unknown): value is Record<string, number> {
  return object(value) && Object.values(value).every((count) => Number.isSafeInteger(count) && (count as number) >= 0);
}
function level(value: unknown): boolean {
  return Number.isInteger(value) && (value as number) >= 0 && (value as number) <= 4;
}
function decimal(source: string): string {
  const [mantissa, exponent = "0"] = source.toLowerCase().split("e");
  const fraction = mantissa.split(".")[1]?.length ?? 0;
  const digits = mantissa.replace(".", "");
  if (/^-?0+$/.test(digits)) return "0";
  const significant = digits.replace(/0+$/, "");
  return `${BigInt(significant)}e${BigInt(exponent) - BigInt(fraction) + BigInt(digits.length - significant.length)}`;
}

function rejectDuplicateKeys(content: string): void {
  const stack: Array<{ keys: Set<string>; expectingKey: boolean } | null> = [];
  for (const token of content.matchAll(/"(?:\\.|[^"\\])*"|[{}\[\],]/g)) {
    const text = token[0];
    if (text === "{") stack.push({ keys: new Set(), expectingKey: true });
    else if (text === "[") stack.push(null);
    else if (text === "}" || text === "]") stack.pop();
    else {
      const object = stack.at(-1);
      if (!object) continue;
      if (text === ",") object.expectingKey = true;
      else if (object.expectingKey) {
        const key: string = JSON.parse(text);
        if (object.keys.has(key)) throw new Error("Duplicate assessment JSON keys are ambiguous.");
        object.keys.add(key);
        object.expectingKey = false;
      }
    }
  }
}
