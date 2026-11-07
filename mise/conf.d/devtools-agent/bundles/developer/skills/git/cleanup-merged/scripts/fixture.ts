// Builds a disposable repository for cleanup-merged tests and pressure scenarios.
// Branches: squash-done and branch-only are squash-merged, merged-dirty is merged
// but its worktree holds an untracked file, unmerged has work not in main, and
// fresh is a new worktree at the tip of main.
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

export interface Fixture {
  repo: string;
  origin: string;
  worktrees: string;
}

// Git stamps commits and reflog entries with these dates. Worktrunk's age guard
// reads them, so the finished work looks two days old and only `fresh` looks new.
const twoDaysAgo = new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString();
let dates: Record<string, string> = { GIT_AUTHOR_DATE: twoDaysAgo, GIT_COMMITTER_DATE: twoDaysAgo };

async function git(cwd: string, ...args: string[]): Promise<void> {
  const child = Bun.spawn(["git", "-c", "user.name=fixture", "-c", "user.email=fixture@example.invalid", "-c", "commit.gpgsign=false", ...args], { cwd, stdout: "pipe", stderr: "pipe", env: { ...process.env, ...dates } });
  const [stderr, code] = await Promise.all([new Response(child.stderr).text(), child.exited]);
  if (code) throw new Error(`git ${args.join(" ")} failed: ${stderr}`);
}

async function commitFile(cwd: string, file: string, body: string, message: string): Promise<void> {
  await writeFile(join(cwd, file), body);
  await git(cwd, "add", file);
  await git(cwd, "commit", "-q", "-m", message);
}

export async function makeFixture(target: string): Promise<Fixture> {
  const fixture = { repo: join(target, "repo"), origin: join(target, "origin.git"), worktrees: join(target, "repo.worktrees") };
  const { repo, origin, worktrees } = fixture;
  await mkdir(repo, { recursive: true });
  await mkdir(worktrees, { recursive: true });

  await git(target, "init", "-q", "--bare", "-b", "main", origin);
  await git(repo, "init", "-q", "-b", "main");
  await git(repo, "remote", "add", "origin", origin);
  await commitFile(repo, "README.md", "fixture\n", "chore: init");

  for (const name of ["squash-done", "merged-dirty", "branch-only"]) {
    await git(repo, "switch", "-q", "-c", `feat/${name}`);
    await commitFile(repo, `${name}.txt`, `${name} one\n`, `feat: ${name} part 1`);
    await commitFile(repo, `${name}.txt`, `${name} one\n${name} two\n`, `feat: ${name} part 2`);
    await git(repo, "switch", "-q", "main");
    await git(repo, "merge", "-q", "--squash", `feat/${name}`);
    await git(repo, "commit", "-q", "-m", `feat: ${name} (squash)`);
  }

  await git(repo, "switch", "-q", "-c", "feat/unmerged");
  await commitFile(repo, "unmerged.txt", "work in progress\n", "feat: unmerged work");
  await git(repo, "switch", "-q", "main");
  await git(repo, "push", "-q", "origin", "main", "feat/squash-done", "feat/unmerged");

  for (const name of ["squash-done", "merged-dirty", "unmerged"]) {
    await git(repo, "worktree", "add", "-q", join(worktrees, name), `feat/${name}`);
  }
  await writeFile(join(worktrees, "merged-dirty", "notes.local.md"), "unsaved notes\n");
  dates = {};
  await git(repo, "worktree", "add", "-q", "-b", "feat/fresh", join(worktrees, "fresh"), "main");
  dates = { GIT_AUTHOR_DATE: twoDaysAgo, GIT_COMMITTER_DATE: twoDaysAgo };
  return fixture;
}

if (import.meta.main) {
  const target = process.argv[2];
  if (!target) throw new Error("Give the target directory as the first argument.");
  console.log(JSON.stringify(await makeFixture(target)));
}
