// A separate resolution needs exact operator approval and a fresh review, never a reused verdict.
import type { Exec } from "../../../../../agent-core/skills/shared-context/scripts/shared-context/lib";

type Fields = Record<string, unknown>;

/** Match publication's freeze rules, including failed launch closures with unfinished work. */
export function frozenSource(receipt: Fields, parent?: Fields): boolean {
  const partialClosure = receipt.event === "phase-complete" && ["start", "implementation", "fix"].includes(String(receipt.phase))
    && ["failed", "blocked"].includes(String(receipt.status)) && receipt.result_missing === true
    && parent?.event === "phase-start" && parent.phase === (receipt.phase === "implementation" ? "start" : receipt.phase);
  return ["review", "submit", "finish"].includes(String(receipt.phase))
    || receipt.event === "phase-complete" && !partialClosure;
}

/** Infer authorization needs without trusting the optional transition marker. */
export function sourceIdentityChanged(receipt: Fields, parent: Fields): boolean {
  return ["worktree", "workspace_path", "source_branch", "base_branch"].some(key => receipt[key] !== parent[key])
    || frozenSource(receipt, parent) && ["source_commit", "source_tree"].some(key => receipt[key] !== parent[key]);
}

export function approvedSourceTransition(receipt: Fields, parent: Fields): boolean {
  if (receipt.event !== "phase-start" || receipt.phase !== "review"
    || receipt.source_transition !== parent.receipt_id || parent.event !== "operator-approval"
    || parent.status !== "approved" || parent.ticket_ref !== receipt.ticket_ref
    || parent.workflow_id !== receipt.workflow_id || receipt.base_branch !== parent.base_branch
    || receipt.workspace_path != null && receipt.workspace_path !== receipt.worktree) return false;
  const candidate = parent.source_candidate;
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return false;
  const target = candidate as Fields;
  return [["worktree", "worktree"], ["branch", "source_branch"], ["base_branch", "base_branch"],
  ["commit", "source_commit"], ["tree", "source_tree"]].every(([key, field]) =>
    typeof target[key!] === "string" && target[key!] !== "" && target[key!] === receipt[field!]);
}

/** Approval alone cannot prove Git ancestry, including during read-only coordination. */
export async function sourceTransitionAncestryIssue(receipt: Fields, parent: Fields, repository?: string, exec?: Exec): Promise<{ code: string; severity: "error"; message: string } | undefined> {
  const commits = [parent.source_commit, receipt.source_commit];
  if (commits.some(commit => typeof commit !== "string" || !/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(commit))) {
    return { code: "source_object_unavailable", severity: "error", message: "Source transition requires valid original and candidate commit identities before validating history." };
  }
  if (!repository || !exec) return { code: "source_transition_unverifiable", severity: "error", message: "Source transition ancestry is unverified; inspect with repository Git access before validating history." };
  const ancestry = await exec("git", ["-C", repository, "merge-base", "--is-ancestor", String(parent.source_commit), String(receipt.source_commit)]);
  if (ancestry.code === 1) return { code: "invalid_source_transition", severity: "error", message: "Source candidate must preserve the original source commit as an ancestor." };
  if (ancestry.code !== 0) return { code: "source_object_unavailable", severity: "error", message: "Source transition Git objects are unavailable; recover them before validating history." };
}
