// Collects observations only. Receipt validation stays in workflow.ts; decisions stay in recovery.ts.
import { access, realpath, stat } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveContextRecord } from "../../../../../agent-core/skills/shared-context/scripts/shared-context/lib";
import type { Exec, SharedAgentContext } from "../../../../../agent-core/skills/shared-context/scripts/shared-context/lib";
import type { ExplorerTicket, TicketWorkflow } from "../../../../../agent-core/extensions/pi-shared-context/model";
import type { WorkflowInspection } from "./recovery";
import { receiptEvent, receiptPhase } from "./recovery";

export async function inspectWorkflow(context: SharedAgentContext, ticket: ExplorerTicket, workflow: TicketWorkflow, exec: Exec): Promise<WorkflowInspection> {
  const inspection: WorkflowInspection = {
    historyValid: workflow.inspection?.historyValid ?? !workflow.error,
    ...(workflow.inspection?.historyError ? { historyError: workflow.inspection.historyError } : {}),
    source: { state: "unknown" }, ownership: "unknown", worktrees: [], commits: [], artifacts: [],
  };
  let inventory: Record<string, unknown>[] = [];
  try {
    // Disable the optional forge and LLM collectors; inspection never runs hooks or aliases.
    const output = JSON.parse(await run(exec, "wt", ["-C", context.repositoryRoot, "--config-set", "list.full=false", "--config-set", "list.summary=false", "list", "--format=json", "--branches"]));
    const rows = Array.isArray(output) ? output : output?.schema === 2 ? output.items : undefined;
    if (!Array.isArray(rows) || rows.some(row => !row || typeof row !== "object" || Array.isArray(row))) throw new Error("Worktrunk returned an unsupported inventory schema.");
    inventory = rows;
    inspection.worktrees = inventory.map(row => ({
      ...(typeof row.path === "string" ? { path: row.path } : typeof record(row.worktree).path === "string" ? { path: String(record(row.worktree).path) } : {}),
      ...(typeof row.branch === "string" ? { branch: row.branch } : {}),
      ...(typeof row.marker === "string" ? { marker: row.marker } : {}),
    }));
  } catch (error) { inspection.inventoryError = message(error); }
  const latest = workflow.receipts[0];
  const workflowId = ticket.backend === "github" ? `GH-${ticket.id}` : ticket.id;
  const token = new RegExp(`(?:^|[/_.-])${workflowId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:$|[/_.-])`, "i");
  const candidates = inspection.worktrees.filter(row => latest ? row.path === latest.workspacePath || row.branch === latest.sourceBranch : row.branch && token.test(row.branch));
  if (candidates.some(row => row.marker && /🤖|💬|(?:^|\W)(?:working|waiting|active)(?:$|\W)/i.test(row.marker))) inspection.ownership = "active";
  const sourcePath = latest?.workspacePath ?? (candidates.length === 1 ? candidates[0]!.path : undefined);
  if (sourcePath) {
    inspection.source.path = sourcePath;
    try {
      await access(sourcePath);
      const top = (await run(exec, "git", ["-C", sourcePath, "rev-parse", "--show-toplevel"])).trim();
      if (await realpath(top) !== await realpath(sourcePath)) throw new Error("Recorded workspace is not the worktree root.");
      const common = (await run(exec, "git", ["-C", sourcePath, "rev-parse", "--git-common-dir"])).trim();
      const repositoryCommon = (await run(exec, "git", ["-C", context.repositoryRoot, "rev-parse", "--git-common-dir"])).trim();
      if (await realpath(resolve(sourcePath, common)) !== await realpath(resolve(context.repositoryRoot, repositoryCommon))) throw new Error("Recorded worktree belongs to a different Git repository.");
      const commit = (await run(exec, "git", ["-C", sourcePath, "rev-parse", "--verify", "HEAD^{commit}"])).trim();
      const tree = (await run(exec, "git", ["-C", sourcePath, "rev-parse", "--verify", "HEAD^{tree}"])).trim();
      const branch = (await run(exec, "git", ["-C", sourcePath, "branch", "--show-current"])).trim();
      // --no-optional-locks prevents status from refreshing the index on disk.
      const dirty = Boolean(await run(exec, "git", ["--no-optional-locks", "-C", sourcePath, "status", "--porcelain=v1", "--untracked-files=all"]));
      inspection.source = { state: "available", path: sourcePath, branch, commit, tree, dirty };
    } catch (error) {
      inspection.source = { state: (error as NodeJS.ErrnoException).code === "ENOENT" ? "missing" : "unknown", path: sourcePath, error: message(error) };
    }
  } else if (!inspection.inventoryError && candidates.length === 0) inspection.source.state = "missing";
  if (candidates.length > 1 && !latest) inspection.source.error = "Multiple worktrees match the ticket. Resolve the source workspace explicitly.";
  if (candidates.length === 1 && !sourcePath) inspection.source.error = "A ticket branch exists without a checked-out worktree. Locate and reconcile its source before starting.";
  inspection.source.candidates = candidates.length;
  try { await inspectCommits(context, ticket, workflow, inspection, exec); }
  catch (error) { inspection.commitsError = message(error); }
  if (inspection.historyValid) {
    for (const receipt of workflow.receipts) {
      if (receiptPhase(receipt) !== "review") continue;
      const outputs = Array.isArray(receipt.fields.outputs) ? receipt.fields.outputs.map(record) : [];
      const refs = receipt.outputs.filter(ref => /(?:^|\/)artifacts\/reviews\//.test(ref) || outputs.some(output => output.ref === ref && ["review", "review-artifact", "review_artifact"].includes(String(output.kind))));
      for (const ref of refs) {
        const artifact: WorkflowInspection["artifacts"][number] = { receiptId: receipt.id, ref, state: "unknown" };
        inspection.artifacts.push(artifact);
        try {
          const target = await artifactPath(context, ref);
          const info = await stat(target.path);
          if (!info.isFile() || info.size === 0) { artifact.state = "unusable"; continue; }
          // Read Markdown through mq and the same OKF module as the workflow reader.
          const body = await run(exec, "mq", ["--allow-http-import", "--no-lockfile", `--allow-read=${target.root}`, "-I", "raw", "-F", "json", 'import "github.com/harehare/okf.mq" | .', target.path]);
          const content = JSON.parse(body);
          artifact.state = typeof content === "string" && content.trim() ? "readable" : "unusable";
          artifact.matchesSource = typeof content === "string" && content.includes(receipt.sourceCommit);
        } catch (error) {
          artifact.state = (error as NodeJS.ErrnoException).code === "ENOENT" ? "missing" : "unusable";
          artifact.error = message(error);
        }
      }
    }
    await inspectFinish(context, ticket, workflow, inspection, exec);
  }
  if (latest && receiptPhase(latest) === "submit") {
    const observation: NonNullable<WorkflowInspection["submission"]> = {};
    inspection.submission = observation;
    try {
      const remote = (await run(exec, "git", ["-C", context.repositoryRoot, "ls-remote", "--heads", "origin", `refs/heads/${latest.sourceBranch}`])).trim();
      observation.remoteCommit = remote ? remote.split(/\s+/)[0] : undefined;
      const repository = context.canonicalOrigin.replace(/^https?:\/\/github.com\//, "").replace(/^github.com\//, "").replace(/\.git$/, "");
      if (!/^github\.com\//.test(context.canonicalOrigin.replace(/^https?:\/\//, ""))) throw new Error("Pull request observation is unavailable for this forge; inspect it through the configured adapter.");
      const prs = JSON.parse(await run(exec, "gh", ["pr", "list", "--repo", repository, "--head", latest.sourceBranch, "--state", "all", "--json", "url,headRefOid,headRefName,baseRefName,state"]));
      if (!Array.isArray(prs)) throw new Error("Pull request observation returned an invalid response.");
      const matching = prs.filter(pr => pr && pr.headRefName === latest.sourceBranch && pr.baseRefName === latest.baseBranch && typeof pr.url === "string");
      observation.pullRequests = matching.map(pr => pr.url);
      observation.verified = observation.remoteCommit === latest.sourceCommit && matching.some(pr => pr.headRefOid === latest.sourceCommit && ["OPEN", "MERGED"].includes(pr.state));
      observation.merged = matching.some(pr => pr.headRefOid === latest.sourceCommit && pr.state === "MERGED");
    } catch (error) { observation.error = message(error); }
  }
  return inspection;
}

async function inspectCommits(context: SharedAgentContext, ticket: ExplorerTicket, workflow: TicketWorkflow, inspection: WorkflowInspection, exec: Exec): Promise<void> {
  const related = new Set(workflow.receipts.map(receipt => receipt.sourceCommit));
  const candidates = new Set(related);
  const log = await run(exec, "git", ["-C", context.repositoryRoot, "log", "--all", "--format=%H", "--fixed-strings", `--grep=${ticket.id}`]);
  for (const commit of log.trim().split("\n").filter(Boolean)) candidates.add(commit);
  if (ticket.backend === "local-markdown") {
    const paths = await run(exec, "git", ["-C", context.repositoryRoot, "log", "--all", "--format=%H", "--", ticket.ref]);
    for (const commit of paths.trim().split("\n").filter(Boolean)) candidates.add(commit);
  }
  const tracker = await resolveContextRecord(context, { kind: "tickets" });
  const initiatives = await resolveContextRecord(context, { kind: "initiatives" });
  const workflows = await resolveContextRecord(context, { kind: "workflow", id: ticket.backend === "github" ? `GH-${ticket.id}` : ticket.id });
  const metadataRoots = [tracker, initiatives, workflows].filter(route => route.path && route.store === "repository").map(route => relative(context.repositoryRoot, route.path!).split("\\").join("/"));
  metadataRoots.push(context.layout?.tracker ?? "tracker");
  metadataRoots.push(workflows.store === "repository" && workflows.path ? relative(context.repositoryRoot, resolve(workflows.path, "..")).split("\\").join("/") : "workflows");
  const token = new RegExp(`(?:^|[^A-Za-z0-9])${ticket.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:$|[^A-Za-z0-9])`, "i");
  for (const commit of candidates) {
    if (!/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(commit)) continue;
    const subject = await run(exec, "git", ["-C", context.repositoryRoot, "show", "-s", "--format=%B", commit]);
    const paths = (await run(exec, "git", ["-C", context.repositoryRoot, "diff-tree", "--root", "--no-commit-id", "--name-only", "-r", "-z", commit])).split("\0").filter(Boolean);
    const ticketPath = paths.includes(ticket.ref);
    if (!related.has(commit) && !ticketPath && !token.test(subject)) continue;
    const kind = paths.some(path => !metadataRoots.some(root => path === root || path.startsWith(`${root}/`))) ? "source" : "tracker-evidence-only";
    // A message is only correlation: the changed paths remain visible and no phase result is inferred.
    inspection.commits.push({ commit, paths, kind, relatedBy: related.has(commit) ? "receipt" : ticketPath ? "ticket-path" : "message-and-diff" });
  }
}

async function inspectFinish(context: SharedAgentContext, ticket: ExplorerTicket, workflow: TicketWorkflow, inspection: WorkflowInspection, exec: Exec): Promise<void> {
  const finish = workflow.receipts[0];
  if (!finish || receiptPhase(finish) !== "finish") return;
  const byId = new Map(workflow.receipts.map(receipt => [receipt.id, receipt]));
  const chain: TicketWorkflow["receipts"] = [];
  const seen = new Set<string>();
  let current: typeof finish | undefined = finish;
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    chain.push(current);
    current = current.parentReceipt ? byId.get(current.parentReceipt) : undefined;
  }
  const field = (key: string): unknown => chain.find(receipt => receipt.fields[key] != null)?.fields[key];
  try {
    const ids = ["merged_commit", "base_before", "expected_merge_tree", "reviewed_source_commit", "reviewed_source_tree"] as const;
    const mapping: Record<string, string> = {};
    for (const key of ids) {
      const value = field(key);
      if (typeof value !== "string" || !/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(value)) throw new Error("Finish mapping is incomplete. Preserve the recorded outcome and obtain independently verifiable integration evidence or human recovery instructions.");
      mapping[key] = value;
    }
    const reviewRef = field("review_receipt");
    const review = workflow.receipts.find(receipt => receipt.id === reviewRef || receipt.ref === reviewRef);
    if (!review || receiptPhase(review) !== "review" || review.status !== "completed" || review.fields.result_missing === true || review.verdict !== "SUCCESS" || review.sourceCommit !== mapping.reviewed_source_commit || review.sourceTree !== mapping.reviewed_source_tree || review.sourceCommit !== finish.sourceCommit || review.sourceTree !== finish.sourceTree || !inspection.artifacts.some(artifact => artifact.receiptId === review.id && artifact.state === "readable" && artifact.matchesSource)) throw new Error("Finish mapping has no usable successful review for its exact source.");
    if (receiptEvent(review) === "phase-result" && !chain.some(receipt => receiptPhase(receipt) === "review" && receiptEvent(receipt) === "phase-complete" && receipt.parentReceipt === review.id && receipt.status === "completed")) throw new Error("The successful review child has no validated parent completion in the finish chain.");
    const parents = (await run(exec, "git", ["-C", context.repositoryRoot, "show", "-s", "--format=%P", mapping.merged_commit!])).trim().split(/\s+/);
    const mergedTree = (await run(exec, "git", ["-C", context.repositoryRoot, "rev-parse", "--verify", `${mapping.merged_commit}^{tree}`])).trim();
    if (parents.length !== 1 || parents[0] !== mapping.base_before || mergedTree !== mapping.expected_merge_tree || (field("merged_tree") != null && field("merged_tree") !== mergedTree)) throw new Error("The integration commit does not match the recorded base parent and expected merge tree.");
    await run(exec, "git", ["-C", context.repositoryRoot, "merge-base", "--is-ancestor", mapping.merged_commit!, finish.baseBranch]);
    inspection.finishIntegrated = true;
    const remote = field("remote");
    const remoteRef = field("remote_ref");
    if (typeof remote !== "string" || !remote || remote.startsWith("-") || typeof remoteRef !== "string" || !remoteRef.startsWith("refs/heads/")) throw new Error("Finish mapping has no exact remote branch to inspect.");
    const observed = (await run(exec, "git", ["-C", context.repositoryRoot, "ls-remote", "--heads", remote, remoteRef])).trim().split(/\s+/)[0];
    if (!observed || !/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(observed)) throw new Error("The named remote branch could not be observed.");
    await run(exec, "git", ["-C", context.repositoryRoot, "merge-base", "--is-ancestor", mapping.merged_commit!, observed]);
    const workspace = inspection.source;
    const removed = workspace.state === "missing" && !inspection.inventoryError && !inspection.worktrees.some(row => row.path === finish.workspacePath);
    inspection.finishVerified = finish.status === "FINISHED" && finish.fields.pushed === true && finish.fields.ticket_completed === true && finish.fields.worktree_removed === true && finish.fields.workspace_closed === true && removed && ["completed", "done", "closed", "resolved", "complete"].includes(ticket.status.trim().toLowerCase());
  } catch (error) {
    inspection.finishError = message(error);
  }
}

async function artifactPath(context: SharedAgentContext, ref: string): Promise<{ path: string; root: string }> {
  let root = context.repositoryRoot;
  let path: string;
  if (ref.startsWith("shared://")) {
    root = context.candidateSharedRoot ?? context.sharedRoot;
    path = resolve(root, ref.slice("shared://".length));
  } else if (ref.startsWith("file:")) path = fileURLToPath(ref);
  else if (/^[A-Za-z][A-Za-z0-9+.-]*:/.test(ref)) throw new Error("Artifact reference is not file-backed.");
  else path = resolve(root, ref);
  const local = relative(root, path);
  if (local === ".." || local.startsWith("../") || isAbsolute(local)) throw new Error("Artifact reference escapes its configured store.");
  const actual = await realpath(path);
  const actualRoot = await realpath(root);
  const target = relative(actualRoot, actual);
  if (target === ".." || target.startsWith("../") || isAbsolute(target)) throw new Error("Artifact symlink escapes its configured store.");
  return { path: actual, root: actualRoot };
}
function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
async function run(exec: Exec, command: string, args: string[]): Promise<string> {
  const result = await exec(command, args);
  if (result.code !== 0) throw new Error(`${command} inspection failed (exit ${result.code}): ${result.stdout}`);
  return result.stdout;
}
function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
