// Mutable generated views have a separate upgrade boundary from immutable receipts.
import { basename, dirname } from "node:path";
import { isMap, isScalar, parseDocument } from "yaml@2.8.1";
import type { UpgradeOwner } from "../../../../../agent-core/skills/skill-contracts/scripts/upgrades";
import { contractIdentity } from "./contract-identity";

const versions = {
  "worktree-workflow/v2": "worktree-workflow/v3",
  "worktree-latest-status/v1": "worktree-latest-status/v2",
} as const;
const current = Object.values(versions);
const procedure = "file:references/contracts/view-upgrade.md";

const owner: UpgradeOwner = {
  identify(content) {
    const fields = values(content);
    if (!Object.hasOwn(fields, "schema") && !Object.hasOwn(fields, "schemaVersion")) return null;
    const identity = fields.schemaVersion ?? fields.schema;
    if (typeof identity !== "string") throw new Error("View identifier must be a string.");
    if (identity.startsWith("worktree-workflow/")) return contractIdentity(fields, "worktree-workflow", 3, [2]);
    if (identity.startsWith("worktree-latest-status/")) return contractIdentity(fields, "worktree-latest-status", 2, [1]);
    throw new Error("Unsupported view contract.");
  },
  detectLegacy() { return []; },
  validate(contract, content) {
    try {
      const fields = values(content);
      if (owner.identify(content) !== contract) return false;
      for (const key of ["workflow_id", "state", "latest_receipt"]) if (typeof fields[key] !== "string" || !fields[key]) return false;
      if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(String(fields.workflow_id))) return false;
      if (contract.startsWith("worktree-workflow/")) {
        const initiative = fields.initiative;
        const validInitiative = initiative === null || typeof initiative === "string" && /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(initiative);
        if (contract === "worktree-workflow/v3" && !validInitiative) return false;
        return typeof fields.ticket_ref === "string" && fields.ticket_ref.length > 0 && fields.event_root === "events" && fields.artifact_root === "artifacts" && fields.projection_root === "projections";
      }
      return typeof fields.ticket === "string" && fields.ticket.length > 0 && ["latest_source_commit", "latest_source_tree"].every(key => typeof fields[key] === "string" && /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(fields[key] as string)) && (fields.latest_review_verdict === null || ["SUCCESS", "FAILURE"].includes(String(fields.latest_review_verdict))) && Array.isArray(fields.open_findings);
    } catch { return false; }
  },
  preservation(_contract, content) {
    const doc = document(content);
    const pair = doc.contents.items.find(item => isScalar(item.key) && ["schema", "schemaVersion"].includes(String(item.key.value)))!;
    if (!isScalar(pair.key) || !isScalar(pair.value)) throw new Error("View contract must use scalar keys and values.");
    pair.key.value = "schemaVersion";
    pair.value.value = String(pair.value.value).split("/v")[0];
    return doc.toString();
  },
  mutable(path, content) {
    const fields = values(content);
    const manifest = basename(path) === "manifest.yaml";
    const status = basename(path) === "latest-status.yaml" && basename(dirname(path)) === "projections";
    const root = manifest ? dirname(path) : status ? dirname(dirname(path)) : undefined;
    const contract = owner.identify(content);
    const family = manifest ? "worktree-workflow/" : "worktree-latest-status/";
    return root !== undefined && typeof contract === "string" && contract.startsWith(family)
      && basename(root) === fields.workflow_id && !path.split("/").some(part => ["events", "artifacts"].includes(part));
  },
  destinations(operation) {
    if (!["upgrade", "update"].includes(operation)) throw new Error("Supported view operations: upgrade, update.");
    return current;
  },
  convert(ref, from, to, content) {
    if (ref !== procedure || versions[from as keyof typeof versions] !== to) throw new Error("Undeclared view upgrade.");
    const doc = document(content);
    if (from === "worktree-workflow/v2") {
      const initiative = values(content).initiative;
      if (!(initiative === null || typeof initiative === "string" && /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(initiative))) {
        throw new Error("Historical initiative requires an owner decision before upgrade.");
      }
    }
    const pair = doc.contents.items.find(item => isScalar(item.key) && item.key.value === "schema")!;
    if (!isScalar(pair.key) || !isScalar(pair.value)) throw new Error("View contract must be scalar.");
    pair.key.value = "schemaVersion";
    pair.value.value = to;
    return { content: doc.toString(), lossless: true, requiresDecision: false };
  },
  mutate(operation, contract, content, request) {
    if (operation !== "update" || !request || typeof request !== "object" || Array.isArray(request)) throw new Error("View update requires an object.");
    const fields = request as Record<string, unknown>;
    const allowed = contract.startsWith("worktree-workflow/") ? ["state", "latest_receipt"] : ["state", "latest_receipt", "latest_source_commit", "latest_source_tree", "latest_review_verdict", "open_findings"];
    if (!Object.keys(fields).length || Object.keys(fields).some(key => !allowed.includes(key))) throw new Error("View update can change only generated status fields.");
    const doc = document(content);
    for (const [key, value] of Object.entries(fields)) doc.set(key, value);
    return doc.toString();
  },
};
export default owner;

function document(content: string) {
  const doc = parseDocument(content, { uniqueKeys: true });
  if (doc.errors.length || !isMap(doc.contents) || doc.contents.items.some(item => !isScalar(item.key) || typeof item.key.value !== "string")) throw new Error("View must be a YAML mapping with unique string keys.");
  // Aliases, tags and non-finite/rounded numbers need an owner decision, not a lossy conversion.
  const visit = (node: unknown): void => {
    if (!node || typeof node !== "object") return;
    const value = node as { tag?: string; source?: string; value?: unknown; items?: unknown[]; key?: unknown };
    if (value.tag || (isScalar(node) && typeof value.value === "number" && (!Number.isSafeInteger(value.value) || Object.is(value.value, -0)))) throw new Error("View contains unsupported tagged or numeric data.");
    if (isScalar(node) && typeof value.value === "number" && value.source && /^[-+]?\d+$/.test(value.source) && BigInt(value.source) !== BigInt(value.value)) throw new Error("View number cannot round-trip.");
    if (node.constructor.name === "Alias") throw new Error("View aliases require an explicit owner decision.");
    if (value.items) value.items.forEach(visit);
    if (value.key) visit(value.key);
    if (value.value && typeof value.value === "object") visit(value.value);
  };
  visit(doc.contents);
  return doc as typeof doc & { contents: NonNullable<typeof doc.contents> & { items: { key: unknown; value: unknown }[] } };
}
function values(content: string): Record<string, unknown> { return document(content).toJS() as Record<string, unknown>; }
