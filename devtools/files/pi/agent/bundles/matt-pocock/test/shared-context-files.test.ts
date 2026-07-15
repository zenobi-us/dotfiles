import { afterEach, expect, test } from "bun:test";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { slugifyGitRemote } from "../extensions/shared-context";
import { listSharedContextFiles } from "../scripts/shared-context-files";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => fs.rm(directory, { recursive: true, force: true })));
});

test("lists files from the active shared-context root", async () => {
  const repositoryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "matt-pocock-repo-"));
  const sharedBase = await fs.mkdtemp(path.join(os.tmpdir(), "matt-pocock-shared-"));
  temporaryDirectories.push(repositoryRoot, sharedBase);

  const origin = "https://github.com/Owner/Repo.git";
  const sharedRoot = path.join(sharedBase, slugifyGitRemote(origin));
  await fs.mkdir(sharedRoot);
  await fs.writeFile(path.join(sharedRoot, "AGENTS.md"), "shared instructions");

  let fdArgs: string[] = [];
  const result = await listSharedContextFiles(repositoryRoot, async (command, args) => {
    if (command === "git" && args.includes("--show-toplevel")) return { stdout: repositoryRoot, stderr: "", code: 0 };
    if (command === "git" && args.includes("get-url")) return { stdout: origin, stderr: "", code: 0 };
    fdArgs = args;
    return { stdout: `${path.join(sharedRoot, "AGENTS.md")}\n`, stderr: "", code: 0 };
  }, sharedBase);

  expect(result.code).toBe(0);
  expect(fdArgs).toContain("--absolute-path");
  expect(fdArgs.at(-1)).toBe(sharedRoot);
});