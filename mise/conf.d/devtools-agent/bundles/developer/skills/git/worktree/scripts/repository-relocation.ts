// A surviving linked source checkout proves identity after the publication checkout moves.
import { lstat, realpath } from "node:fs/promises";
import { isAbsolute } from "node:path";
import type { Exec } from "../../../../../agent-core/skills/shared-context/scripts/shared-context/lib";

type Fields = Record<string, unknown>;

/** Change only the effective repository/store root; historical bytes and source identity remain intact. */
export async function relocateRepository(fields: Fields, value: unknown, holder: Fields, repository: string, workflowRef: string, exec: Exec): Promise<Fields> {
  if (holder.event !== "operator-approval" || holder.status !== "approved"
    || typeof holder.history_repair_reason !== "string" || !holder.history_repair_reason.trim()
    || typeof holder.history_repair_authorization !== "string" || !holder.history_repair_authorization.trim()) {
    throw new Error("Repository relocation requires an approved operator history-repair record.");
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Repository relocation requires from and to paths.");
  const relocation = value as Fields;
  const workflow = fields.workflow as Fields | undefined;
  if (Object.keys(relocation).some(key => !["from", "to"].includes(key))
    || typeof relocation.from !== "string" || !isAbsolute(relocation.from)
    || relocation.to !== repository || relocation.from === repository
    || fields.repository !== relocation.from || workflow?.root !== relocation.from
    || workflow.store !== "repository" || workflow.ref !== workflowRef
    || typeof fields.worktree !== "string" || fields.workspace_path !== fields.worktree
    || fields.worktree === relocation.from) {
    throw new Error("Repository relocation must map the missing recorded base to the current publication checkout and preserve its source workspace.");
  }
  try {
    await lstat(relocation.from);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    const sourceRoot = await realpath(fields.worktree);
    const [sourceCommon, repositoryCommon, sourceTop, sourceTree, ancestry] = await Promise.all([
      git(exec, fields.worktree, ["rev-parse", "--path-format=absolute", "--git-common-dir"]),
      git(exec, repository, ["rev-parse", "--path-format=absolute", "--git-common-dir"]),
      git(exec, fields.worktree, ["rev-parse", "--show-toplevel"]),
      git(exec, repository, ["rev-parse", "--verify", `${fields.source_commit}^{tree}`]),
      exec("git", ["-C", fields.worktree, "merge-base", "--is-ancestor", String(fields.source_commit), "HEAD"]),
    ]);
    if (await realpath(sourceCommon) !== await realpath(repositoryCommon)
      || await realpath(sourceTop) !== sourceRoot || sourceTree !== fields.source_tree || ancestry.code !== 0) {
      throw new Error("Repository relocation requires a surviving source worktree in the same Git repository with the recorded commit/tree and ancestry.");
    }
    return { ...fields, repository, workflow: { ...workflow, root: repository } };
  }
  throw new Error("Repository relocation cannot replace an existing historical checkout path.");
}

async function git(exec: Exec, cwd: string, args: string[]): Promise<string> {
  const result = await exec("git", ["-C", cwd, ...args]);
  if (result.code !== 0) throw new Error("Repository relocation Git identity is unavailable.");
  return result.stdout.trim();
}
