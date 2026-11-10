// Real Git observations must be shared only inside one read-only UI refresh.
import { afterEach, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createInspectionExecutor } from "./inspection-exec";
import type { Exec } from "../../../../../agent-core/skills/shared-context/scripts/shared-context/lib";

const roots: string[] = [];
afterEach(async () => { await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true }))); });
const execute: Exec = async (command, args, cwd) => {
  const child = Bun.spawn([command, ...args], { cwd, stdout: "pipe", stderr: "pipe" });
  const [stdout, stderr, code] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
  return { code, stdout: code ? `${stdout}\n${stderr}` : stdout };
};
async function git(root: string, args: string[]): Promise<string> {
  const result = await execute("git", args, root);
  if (result.code) throw new Error(result.stdout);
  return result.stdout.trim();
}
async function repository(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "inspection-exec-"));
  roots.push(root);
  await git(root, ["init", "--quiet", "-b", "main"]);
  await git(root, ["-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "--allow-empty", "-m", root]);
  return root;
}

test("concurrent observations share work but new refreshes and other directories read their own HEAD", async () => {
  const root = await repository(), other = await repository();
  const original = await git(root, ["rev-parse", "HEAD"]), otherHead = await git(other, ["rev-parse", "HEAD"]);
  let reads = 0;
  const measured: Exec = (command, args, cwd) => { reads++; return execute(command, args, cwd); };
  const refresh = createInspectionExecutor(measured, root);
  const [left, right] = await Promise.all([refresh("git", ["rev-parse", "HEAD"]), refresh("git", ["rev-parse", "HEAD"])]);
  expect(left.stdout.trim()).toBe(original);
  expect(right.stdout.trim()).toBe(original);
  expect(reads).toBe(1);
  expect((await refresh("git", ["rev-parse", "HEAD"], other)).stdout.trim()).toBe(otherHead);
  await git(root, ["-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "--allow-empty", "-m", "Advance HEAD"]);
  const current = await git(root, ["rev-parse", "HEAD"]);
  expect(current).not.toBe(original);
  expect((await refresh("git", ["rev-parse", "HEAD"])).stdout.trim()).toBe(original);
  expect((await createInspectionExecutor(measured, root)("git", ["rev-parse", "HEAD"])).stdout.trim()).toBe(current);
});

test("document reads and mutations bypass observation reuse", async () => {
  const root = await repository(), ref = "refs/heads/observed";
  const initial = await git(root, ["rev-parse", "HEAD"]);
  const refresh = createInspectionExecutor(execute, root);
  await refresh("git", ["update-ref", ref, initial]);
  await git(root, ["update-ref", "-d", ref]);
  await refresh("git", ["update-ref", ref, initial]);
  expect(await git(root, ["rev-parse", ref])).toBe(initial);
  const file = join(root, "record.json");
  const args = ["--allow-http-import", "--no-lockfile", "-I", "json", "-F", "json", 'import "github.com/harehare/okf.mq" | .', file];
  await writeFile(file, '{"state":"before"}');
  expect(JSON.parse((await refresh("mq", args)).stdout)).toEqual({ state: "before" });
  await writeFile(file, '{"state":"after"}');
  expect(JSON.parse((await refresh("mq", args)).stdout)).toEqual({ state: "after" });
});
