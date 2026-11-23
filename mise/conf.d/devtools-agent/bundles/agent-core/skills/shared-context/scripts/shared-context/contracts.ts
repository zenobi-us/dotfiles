// Shared-context owns configuration interpretation; skill-contracts owns atomic upgrades.
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { UpgradeOwner } from "../../../skill-contracts/scripts/upgrades";
export const skillRoot = fileURLToPath(new URL("../../", import.meta.url));
export const routeKinds = ["alignment", "tickets", "initiatives", "workflows", "evidence", "sources"] as const;
const current = ["shared-context-routes/v3", "shared-context-layout/v2"];
const legacy = ["shared-context-routes/v2", "shared-context-layout/v1"];
export function readConfiguration(content: string, family: "routes" | "layout"): Record<string, unknown> {
  const raw = Bun.TOML.parse(content) as Record<string, unknown>;
  const index = family === "routes" ? 0 : 1;
  if (Object.hasOwn(raw, "schemaVersion")) {
    if (raw.schemaVersion !== current[index] || Object.hasOwn(raw, "schema")) throw new Error("Unsupported or ambiguous shared-context configuration contract");
  } else if (raw.schema !== (family === "routes" ? 2 : 1)) throw new Error("Unsupported shared-context configuration schema");
  if (family === "routes") {
    const records = raw.records as Record<string, Record<string, unknown>>;
    if (!records || typeof records !== "object" || Array.isArray(records)) throw new Error("Routes require records tables");
    for (const kind of routeKinds) {
      const route = records[kind];
      if (!route || typeof route !== "object" || typeof route.adapter !== "string" || !/^[a-z][a-z0-9-]*$/.test(route.adapter)) throw new Error("Each route requires an adapter");
      if (kind === "tickets" && !["markdown", "local-markdown"].includes(route.adapter)) {
        if (route.store !== undefined) throw new Error("External tickets cannot have a store");
      } else if (!["shared", "repository", ...(kind === "sources" ? ["inherit:alignment"] : kind === "evidence" ? ["inherit:workflows"] : [])].includes(String(route.store))) throw new Error("Invalid route store");
    }
  } else {
    if (Object.keys(raw).some(key => !["schema", "schemaVersion", "paths"].includes(key))) throw new Error("Unknown layout field");
    if (raw.paths !== undefined && (!raw.paths || typeof raw.paths !== "object" || Array.isArray(raw.paths))) throw new Error("Layout paths must be a table");
    for (const [key, value] of Object.entries((raw.paths ?? {}) as object)) {
      if (!["tracker", "sources"].includes(key) || typeof value !== "string" || !value || value.trim() !== value || path.isAbsolute(value) || /^[A-Za-z]:/.test(value) || /[\\\0]/.test(value) || value.split("/").some(part => !part || part === "." || part === "..")) throw new Error("Invalid layout path");
    }
  }
  return raw;
}
function identify(content: string): string | null {
  const raw = Bun.TOML.parse(content) as Record<string, unknown>;
  if (!Object.hasOwn(raw, "schemaVersion")) return null;
  if (typeof raw.schemaVersion !== "string") throw new Error("schemaVersion must be a string");
  return raw.schemaVersion;
}
function family(contract: string): "routes" | "layout" {
  if ([current[0], legacy[0]].includes(contract)) return "routes";
  if ([current[1], legacy[1]].includes(contract)) return "layout";
  throw new Error("Unknown shared-context contract");
}
function validate(contract: string, content: string): boolean {
  const raw = readConfiguration(content, family(contract));
  return (raw.schemaVersion ?? (raw.schema === 2 ? legacy[0] : legacy[1])) === contract;
}
function header(content: string, from: string, to: string): string {
  const value = from.endsWith("routes/v2") ? 2 : 1;
  const pattern = new RegExp(`^schema[ \\t]*=[ \\t]*${value}(?=[ \\t]*(?:#|\\r?$))`, "m");
  if (!pattern.test(content)) throw new Error("Configuration header syntax requires an explicit decision");
  return content.replace(pattern, `schemaVersion = "${to}"`);
}
const owner: UpgradeOwner = {
  identify,
  detectLegacy(content) {
    return legacy.filter(contract => { try { return validate(contract, content); } catch { return false; } });
  },
  validate,
  preservation(contract, content) {
    const raw = readConfiguration(content, family(contract));
    const { schema: _schema, schemaVersion: _version, ...meaning } = raw;
    // Include the exact authored text as well as parsed values. Only the header may change.
    const normalized = raw.schemaVersion ? content.replace(/^schemaVersion[ \t]*=[ \t]*"shared-context-(?:routes\/v3|layout\/v2)"/m, "CONTRACT") : content.replace(/^schema[ \t]*=[ \t]*[12](?=[ \t]*(?:#|\r?$))/m, "CONTRACT");
    return { meaning, authored: normalized };
  },
  mutable(file) {
    const normalized = file.split(path.sep);
    return !normalized.some(part => ["events", "artifacts", ".git"].includes(part)) && (path.basename(file) === ".context-routes.toml" || file.endsWith(`${path.sep}docs${path.sep}agents${path.sep}context-layout.toml`));
  },
  destinations(operation) {
    if (!["upgrade", "set-route"].includes(operation)) throw new Error("Unsupported configuration operation");
    return operation === "set-route" ? [current[0]] : current;
  },
  convert(procedure, from, to, content) {
    if (procedure !== "file:references/configuration-upgrades.md" || !legacy.some((id, index) => id === from && current[index] === to)) throw new Error("Undeclared configuration upgrade");
    return { content: header(content, from, to), lossless: true, requiresDecision: false };
  },
  mutate(operation, contract, content, request) {
    if (operation !== "set-route" || contract !== current[0] || !request || typeof request !== "object" || Array.isArray(request)) throw new Error("Invalid route mutation");
    const input = request as Record<string, unknown>;
    if (Object.keys(input).some(key => !["kind", "store"].includes(key)) || !routeKinds.includes(input.kind as typeof routeKinds[number]) || !["shared", "repository"].includes(String(input.store))) throw new Error("Route mutation requires kind and store");
    const kind = input.kind as string;
    if (/"""|'''/.test(content)) throw new Error("Multiline TOML strings require an explicit routing decision");
    const records = readConfiguration(content, "routes").records as Record<string, { store?: string }>;
    const stores: Record<string, string> = { [kind]: input.store as string };
    for (const child of routeKinds) {
      if (records[child].store === `inherit:${kind}`) stores[child] = records[kind].store!;
    }
    const lines = content.split("\n");
    let active: string | undefined;
    const changed = new Set<string>();
    for (let i = 0; i < lines.length; i++) {
      if (/^\s*\[/.test(lines[i])) active = lines[i].match(/^\[records\.([a-z]+)\][ \t]*(?:#.*)?\r?$/)?.[1];
      if (active && Object.hasOwn(stores, active) && /^store\s*=/.test(lines[i])) {
        if (!/^store[ \t]*=[ \t]*"(?:shared|repository|inherit:alignment|inherit:workflows)"[ \t]*(?:#.*)?\r?$/.test(lines[i])) throw new Error("Route store syntax requires an explicit decision");
        lines[i] = lines[i].replace(/^(store[ \t]*=[ \t]*)"[^"]*"/, `$1"${stores[active]}"`);
        changed.add(active);
      }
    }
    if (changed.size !== Object.keys(stores).length) throw new Error("No editable route store found");
    return lines.join("\n");
  },
};
export default owner;
