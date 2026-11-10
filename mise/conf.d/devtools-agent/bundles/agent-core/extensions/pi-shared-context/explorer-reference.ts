// Canonical references come from shared-context routing, not a new URI scheme.
import { join, relative } from "node:path";
import { resolveContextRecord } from "../../skills/shared-context/scripts/shared-context/lib";
import { validateStorePath } from "../../skills/shared-context/scripts/shared-context/layout";
import type { ExplorerTarget, SharedAgentContext } from "./model";

export type CopyMode = "path" | "reference" | "id";
let preferredMode: CopyMode = "path";
export function copyMode(): CopyMode { return preferredMode; }
export function cycleCopyMode(): CopyMode {
  preferredMode = preferredMode === "path" ? "reference" : preferredMode === "reference" ? "id" : "path";
  return preferredMode;
}

export async function formatExplorerReference(context: SharedAgentContext, target: ExplorerTarget, mode: CopyMode): Promise<string> {
  const item = target.kind === "initiative" ? target.initiative : target.ticket;
  if (target.kind === "initiative" && target.initiative.group) throw new Error("Ungrouped is a collection, not a record.");
  if (mode === "id") return item.id;
  const local = target.kind === "initiative" ? !/^[A-Za-z][A-Za-z0-9+.-]*:/.test(item.ref) || item.ref.startsWith("shared://") : target.ticket.backend === "local-markdown";
  if (!local) {
    if (mode === "reference") return item.ref;
    throw new Error("This record has no local path. Select Reference or id.");
  }
  if (target.kind === "ticket" && target.ticket.documentType?.toLowerCase() !== "adr") {
    const collection = await resolveContextRecord(context, { kind: "tickets" });
    if (!collection.root || !collection.path) throw new Error("The ticket collection has no local path.");
    const ref = item.ref.startsWith("shared://") ? item.ref.slice("shared://".length) : item.ref;
    await validateStorePath(collection.root, ref);
    const file = join(collection.root, ref);
    await validateStorePath(collection.path, relative(collection.path, file).split("\\").join("/"));
    if (mode === "path" && collection.store === "repository" && context.checkoutAvailable === false) throw new Error("No usable checkout for this path.");
    return mode === "path" ? file : `${collection.store === "shared" ? "shared://" : ""}${ref}`;
  }
  const record = await resolveContextRecord(context, target.kind === "initiative" ? { kind: "initiative", id: item.id }
    : { kind: "adr", id: item.id });
  if (mode === "path" && (!record.path || record.store === "repository" && context.checkoutAvailable === false)) throw new Error("No usable checkout for this path.");
  const value = mode === "path" ? record.path! : record.ref;
  return target.kind === "initiative" ? `${value.replace(/\/$/, "")}/index.md` : value;
}
