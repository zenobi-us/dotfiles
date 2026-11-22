// Interpret owner resolutions without converting or relabelling retained snapshots.
import { isAbsolute, relative } from "node:path";
import { validateStorePath } from "../../../../../agent-core/skills/shared-context/scripts/shared-context/layout";

interface Location {
  kind: string;
  adapter: string;
  store: "repository" | "shared";
  root: string;
  path: string;
  ref: string;
  publication: "repository" | "push-if-remote";
}

/** Project location semantics in memory; persisted objects and their hashes stay untouched. */
export async function readContextResolution(input: unknown): Promise<Location> {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Resolution must be an object.");
  const fields = input as Record<string, unknown>;
  const legacy = detectLegacy(fields);
  if (!legacy && (Object.hasOwn(fields, "schema") || fields.schemaVersion !== "shared-context-resolution/v1")) throw new Error("Unsupported resolution identity.");
  for (const key of ["kind", "adapter", "root", "path", "ref", "publication", "store"]) {
    if (typeof fields[key] !== "string" || !fields[key] || fields[key] !== fields[key].trim()) throw new Error("Invalid resolution field: " + key);
  }
  const { kind, adapter, store, root, path, ref, publication } = fields as unknown as Location;
  if (!["alignment", "tracker", "tickets", "initiatives", "sources", "ticket", "initiative", "workflow", "evidence", "source", "adr"].includes(kind)
    || !/^[a-z][a-z0-9-]*$/.test(adapter) || !["repository", "shared"].includes(store)
    || !isAbsolute(root) || !isAbsolute(path)) throw new Error("Invalid resolution location.");
  const child = relative(root, path);
  if (child) await validateStorePath(root, child);
  const expectedRef = child ? child.split("\\").join("/") : ".";
  if (ref !== (store === "shared" ? "shared://" + expectedRef : expectedRef)
    || publication !== (store === "shared" ? "push-if-remote" : "repository")) throw new Error("Resolution reference or publication differs from its store.");
  return { kind, adapter, store, root, path, ref, publication };
}

// The only retained format has neither identity field and the same validated location fields.
function detectLegacy(fields: Record<string, unknown>): boolean {
  return !Object.hasOwn(fields, "schema") && !Object.hasOwn(fields, "schemaVersion");
}
