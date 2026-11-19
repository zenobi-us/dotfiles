// A batch shares canonical snapshots, then checks a fresh snapshot before it
// publishes classifications. Action preparation never enters this read scope.
import { AsyncLocalStorage } from "node:async_hooks";
import { createHash } from "node:crypto";
import { loadExplorerSnapshot } from "../../devtools-agent/bundles/developer/skills/git/worktree/scripts/workflow";
import type { SharedAgentContext, Exec } from "../../devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/lib";
import type { TrackerSnapshot } from "../../devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/model";
import type { DocumentReadProgress } from "../../devtools-agent/bundles/developer/skills/git/worktree/scripts/document-cache";
import { QueryError } from "./native";

type SnapshotRead = { context: SharedAgentContext; exec: Exec; value: Promise<TrackerSnapshot> };
const scopes = new AsyncLocalStorage<Map<string, SnapshotRead>>();

export async function withReadSession<T>(work: () => Promise<T>): Promise<T> {
  const snapshots = new Map<string, SnapshotRead>();
  return scopes.run(snapshots, async () => {
    const result = await work();
    for (const { context, exec, value } of snapshots.values()) {
      const before = createHash("sha256").update(JSON.stringify(await value)).digest("hex");
      const after = createHash("sha256").update(JSON.stringify(await loadExplorerSnapshot(context, exec))).digest("hex");
      if (before !== after) throw new QueryError("CHANGED_DURING_READ", "Tracker membership or content changed during the batch. Refresh to read a consistent result.");
    }
    return result;
  });
}

export function readSnapshot(context: SharedAgentContext, exec: Exec, progress?: (value: DocumentReadProgress) => void): Promise<TrackerSnapshot> {
  const snapshots = scopes.getStore();
  if (!snapshots) return loadExplorerSnapshot(context, exec, undefined, undefined, progress);
  const key = JSON.stringify([context.repositoryRoot, context.root, context.routes, context.layout]);
  let read = snapshots.get(key);
  if (!read) {
    read = { context, exec, value: loadExplorerSnapshot(context, exec, undefined, undefined, progress) };
    snapshots.set(key, read);
  }
  return read.value;
}
