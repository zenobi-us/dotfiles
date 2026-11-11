// Exercise the real one-shot process, including JSON argument boundaries and file access limits.
import { afterEach, beforeEach, expect, test } from "bun:test";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

let temporary: string;
let home: string;
let repository: string;
const entry = path.resolve(import.meta.dir, "../mods/shared-context/request.ts");

beforeEach(async () => {
  temporary = await fs.mkdtemp(path.join(os.tmpdir(), "herdr-exec-request-"));
  home = path.join(temporary, "home");
  repository = path.join(temporary, 'workspace "quoted"');
  await fs.mkdir(path.join(home, "data"), { recursive: true });
  await fs.mkdir(repository);
  await fs.writeFile(path.join(home, "data/shared-context-runtime.json"), JSON.stringify({ path: process.env.PATH }));
  for (const args of [["init", "--quiet", repository], ["-C", repository, "remote", "add", "origin", `https://github.com/example/${path.basename(temporary)}.git`]]) {
    const child = Bun.spawn(["git", ...args], { stdout: "pipe", stderr: "pipe" });
    const error = await new Response(child.stderr).text();
    if (await child.exited) throw new Error(error);
  }
  await fs.writeFile(path.join(repository, ".context-routes.toml"), [
    "schema = 2",
    '[records.alignment]\nadapter = "markdown"\nstore = "repository"',
    '[records.tickets]\nadapter = "local-markdown"\nstore = "repository"',
    '[records.initiatives]\nadapter = "markdown"\nstore = "repository"',
    '[records.workflows]\nadapter = "files"\nstore = "repository"',
    '[records.evidence]\nadapter = "files"\nstore = "inherit:workflows"',
    '[records.sources]\nadapter = "files"\nstore = "inherit:alignment"',
  ].join("\n\n") + "\n");
});
afterEach(async () => { await fs.rm(temporary, { recursive: true, force: true }); });

async function call(encoded: string) {
  const child = Bun.spawn([process.execPath, entry, encoded, home], { stdout: "pipe", stderr: "pipe" });
  const [stdout, stderr, code] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
  return { code, stderr, result: JSON.parse(stdout) };
}

test("returns a large preview intact through JSON arguments with quoted paths", async () => {
  const filename = 'notes "quoted".txt';
  const body = "Unicode ✓ and multiple lines\n".repeat(9000);
  await fs.writeFile(path.join(repository, filename), body);
  const response = await call(JSON.stringify({ operation: "file", cwd: repository, collection: "alignment", path: filename }));
  expect(response.code).toBe(0);
  expect(response.result.data.body).toBe(body);
  expect(response.result.data.path).toBe(path.join(repository, filename));
  expect(Object.hasOwn(response.result, "error")).toBe(false);
});

test("returns a failing JSON response when a preview leaves its collection", async () => {
  await fs.writeFile(path.join(temporary, "outside.txt"), "outside collection");
  const response = await call(JSON.stringify({ operation: "file", cwd: repository, collection: "alignment", path: "../outside.txt" }));
  expect(response.code).toBe(1);
  expect(typeof response.result.error).toBe("string");
  expect(Object.hasOwn(response.result, "data")).toBe(false);
  expect(response.stderr).toBe("");
});

test("malformed input exits with a JSON error instead of a stack trace", async () => {
  const response = await call("{");
  expect(response.code).toBe(1);
  expect(typeof response.result.error).toBe("string");
  expect(Object.hasOwn(response.result, "data")).toBe(false);
  expect(response.stderr).toBe("");
});
