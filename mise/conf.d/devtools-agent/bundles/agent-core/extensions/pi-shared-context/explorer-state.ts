// Session-only display snapshots never contain live workflow authorization.
import type { TrackerSnapshot } from "../../../matt-pocock/skills/reading-and-writing-tickets/scripts/model";
import type { SharedAgentContext } from "../../skills/shared-context/scripts/shared-context/lib";

const snapshots = new Map<string, { snapshot: TrackerSnapshot; validatedAt: number }>();
const loaders = new WeakMap<object, number>();
let nextLoader = 0;

export function snapshotIdentity(context: SharedAgentContext, loader?: object): string {
  if (loader && !loaders.has(loader)) loaders.set(loader, ++nextLoader);
  return JSON.stringify([context.repositoryRoot, context.canonicalOrigin, context.slug, context.routes,
  context.candidateSharedRoot, context.sharedRoot, context.alignmentRoot, context.root, context.layout,
  context.checkoutAvailable, loader ? loaders.get(loader) : null]);
}

export function recallSnapshot(key: string): { snapshot: TrackerSnapshot; validatedAt: number } | undefined {
  const entry = snapshots.get(key);
  return entry ? { snapshot: structuredClone(entry.snapshot), validatedAt: entry.validatedAt } : undefined;
}

export function rememberSnapshot(key: string, snapshot: TrackerSnapshot, validatedAt: number): void {
  snapshots.delete(key);
  snapshots.set(key, { snapshot: structuredClone(snapshot), validatedAt });
  if (snapshots.size > 16) snapshots.delete(snapshots.keys().next().value!);
}
