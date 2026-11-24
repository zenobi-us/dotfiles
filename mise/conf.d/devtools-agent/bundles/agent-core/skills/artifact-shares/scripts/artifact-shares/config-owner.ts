// Owns configuration interpretation. Hooks are pure; shared safeUpgrade owns persistence.
import Ajv from "ajv@^8.17.1";
import { isDeepStrictEqual } from "node:util";
import type { UpgradeOwner } from "../../../skill-contracts/scripts/upgrades.ts";
import legacy from "../../references/contracts/config-v1.json";
import current from "../../references/contracts/config-v2.json";

export const CONFIG_V1 = "artifact-share-config/v1";
export const CONFIG_V2 = "artifact-share-config/v2";
export const DEFAULT_CLONE_ROOT = "~/.local/share/artifact-shares";
const ajv = new Ajv({ strict: false });
const validators: Record<string, (value: unknown) => boolean> = {
  [CONFIG_V1]: ajv.compile(legacy),
  [CONFIG_V2]: ajv.compile(current),
};

export function parseConfig(content: string): Record<string, unknown> {
  const value: unknown = JSON.parse(content);
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Configuration must be a JSON object.");
  // JSON.parse checks syntax first. Inspect tokens only for information it discards.
  const tokens = content.match(/"(?:\\.|[^"\\])*"|[{}\[\]:,]|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null/g)!;
  const objects: Set<string>[] = [];
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index]!;
    if (token === "{") objects.push(new Set());
    else if (token === "}") objects.pop();
    else if (token.startsWith('"') && tokens[index + 1] === ":") {
      const key = JSON.parse(token) as string;
      const keys = objects.at(-1)!;
      if (keys.has(key)) throw new Error("Duplicate configuration keys cannot be converted safely.");
      keys.add(key);
    } else if (/^-?\d/.test(token)) {
      const number = Number(token);
      if (!Number.isFinite(number) || Object.is(number, -0) || decimalValue(token) !== decimalValue(JSON.stringify(number))) {
        throw new Error("Configuration number cannot round-trip without loss.");
      }
    }
  }
  return value as Record<string, unknown>;
}

function decimalValue(source: string): string {
  const [mantissa, exponent = "0"] = source.toLowerCase().split("e");
  const fractionLength = mantissa!.split(".")[1]?.length ?? 0;
  const digits = mantissa!.replace(".", "");
  if (/^-?0+$/.test(digits)) return "0";
  const significant = digits.replace(/0+$/, "");
  return `${BigInt(significant)}e${BigInt(exponent) - BigInt(fractionLength) + BigInt(digits.length - significant.length)}`;
}

export function configMeaning(value: Record<string, unknown>): Record<string, unknown> {
  const { schemaVersion, ...authored } = value;
  return { ...authored, clone_root: value.clone_root ?? DEFAULT_CLONE_ROOT, shares: value.shares ?? {} };
}

const owner: UpgradeOwner = {
  identify(content) {
    const value = parseConfig(content);
    if (!Object.hasOwn(value, "schemaVersion")) return null;
    if (typeof value.schemaVersion !== "string") throw new Error("Explicit schemaVersion must be a string.");
    return value.schemaVersion;
  },
  detectLegacy(content) {
    const value = parseConfig(content);
    return !Object.hasOwn(value, "schemaVersion") && validators[CONFIG_V1]!(value) ? [CONFIG_V1] : [];
  },
  validate(contract, content) { return validators[contract]?.(parseConfig(content)) === true; },
  preservation(_contract, content) { return configMeaning(parseConfig(content)); },
  mutable(file, content) {
    return !file.split(/[\\/]/).some((part) => ["events", "receipts", "evidence"].includes(part)) && parseConfig(content).immutable !== true;
  },
  destinations(operation) {
    if (!["upgrade", "save", "clone-root"].includes(operation)) throw new Error("Unsupported configuration operation.");
    return [CONFIG_V2];
  },
  convert(procedure, from, to, content) {
    if (procedure !== "file:references/contracts/config-upgrade.txt" || from !== CONFIG_V1 || to !== CONFIG_V2) throw new Error("Unsupported configuration upgrade.");
    return { content: `${JSON.stringify({ ...configMeaning(parseConfig(content)), schemaVersion: CONFIG_V2 }, null, 2)}\n`, lossless: true, requiresDecision: false };
  },
  mutate(operation, contract, content, request) {
    if (contract !== CONFIG_V2) throw new Error("Configuration mutation requires the current contract.");
    const value = parseConfig(content);
    if (operation === "clone-root") {
      if (typeof request !== "string" || !request.trim()) throw new Error("Clone root must be a nonempty path.");
      value.clone_root = request;
      return `${JSON.stringify(value, null, 2)}\n`;
    }
    if (operation !== "save" || !request || typeof request !== "object" || !("before" in request) || !("after" in request)) throw new Error("Save requires the loaded configuration and requested configuration.");
    if (!isDeepStrictEqual(configMeaning(value), request.before)) throw new Error("Configuration changed since it was read; no update was written.");
    const after = parseConfig(JSON.stringify(request.after));
    return `${JSON.stringify({ ...after, schemaVersion: CONFIG_V2 }, null, 2)}\n`;
  },
};
export default owner;
