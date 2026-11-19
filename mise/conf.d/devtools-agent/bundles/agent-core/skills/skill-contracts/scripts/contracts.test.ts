// Isolated installed-skill fixtures exercise public commands from an unrelated caller directory.
import { afterEach, beforeEach, expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const router = fileURLToPath(new URL("./router.ts", import.meta.url));
let root: string;
let skill: string;
let caller: string;
const empty = { schemaVersion: "skill-contract-manifest/v1", produces: [], accepts: [], contracts: {}, upgrades: [] };

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "skill-contracts-"));
  skill = join(root, "installed");
  caller = join(root, "caller");
  await mkdir(skill);
  await mkdir(caller);
  await writeFile(join(skill, "definition.txt"), "Owner definition: preserve authored text.\n");
  await writeFile(join(caller, "definition.txt"), "Wrong caller definition.\n");
  await save(empty);
});
afterEach(async () => { await rm(root, { recursive: true, force: true }); });

async function save(value: unknown): Promise<void> {
  await writeFile(join(skill, "contracts.json"), JSON.stringify(value));
}

async function run(operation = "validate", identifier?: string): Promise<{ code: number; out: string; error: string }> {
  const command = [process.execPath, "--install=fallback", router, operation, "--skill", skill];
  if (identifier) command.push("--contract", identifier);
  const processResult = Bun.spawn(command, { cwd: caller, stdout: "pipe", stderr: "pipe" });
  const [code, out, error] = await Promise.all([processResult.exited, new Response(processResult.stdout).text(), new Response(processResult.stderr).text()]);
  return { code, out, error };
}

test("empty collections are valid and inspection leaves installed content unchanged", async () => {
  const before = await readFile(join(skill, "contracts.json"), "utf8");
  const result = await run();
  expect(result.code).toBe(0);
  expect(JSON.parse(result.out)).toEqual({ manifest: empty, definitions: {}, procedures: [] });
  expect(await readFile(join(skill, "contracts.json"), "utf8")).toBe(before);
  expect((await readdir(skill)).sort()).toEqual(["contracts.json", "definition.txt"]);
});

test("input support does not imply output production and references use the installed directory", async () => {
  await save({ ...empty, produces: ["sample-record/v2"], accepts: ["sample-record/v1"], contracts: { "sample-record/v1": "file:definition.txt", "sample-record/v2": "file:definition.txt" } });
  const result = await run();
  expect(result.code).toBe(0);
  const resolved = JSON.parse(result.out);
  expect(resolved.manifest.produces).toEqual(["sample-record/v2"]);
  expect(resolved.manifest.accepts).toEqual(["sample-record/v1"]);
  const definition = await run("resolve", "sample-record/v1");
  expect(definition.code).toBe(0);
  expect(JSON.parse(definition.out)).toEqual({ reference: "file:definition.txt", path: join(skill, "definition.txt"), content: "Owner definition: preserve authored text.\n" });
});

test("recognises the manifest contract without a self-definition or inferred support", async () => {
  const result = await run("resolve", "skill-contract-manifest/v1");
  expect(result.code).toBe(0);
  expect(JSON.parse(JSON.parse(result.out).content).$id).toBe("skill-contract-manifest/v1");
  expect(JSON.parse((await run()).out).manifest.produces).toEqual([]);
  await save({ ...empty, accepts: ["skill-contract-manifest/v1"] });
  expect((await run()).code).toBe(0);
  await save({ ...empty, contracts: { "skill-contract-manifest/v1": "file:definition.txt" } });
  expect((await run()).error).toContain("must not redefine");
});

test.each(["produces", "accepts", "contracts", "upgrades"])("rejects missing required %s", async (field) => {
  const value: Record<string, unknown> = { ...empty };
  delete value[field];
  await save(value);
  const result = await run();
  expect(result.code).toBe(1);
  expect(result.out).toBe("");
  expect(result.error).toContain("Invalid skill contract manifest");
});

test.each(["sample/v0", "sample/v01", "sample/v-1", "Sample/v1", "sample/v1.0", "sample//v1", "sample/v1\n", "sample/v1\r", "sample/v1\u2028", "sample/v1\u2029"])("rejects invalid identifier %s before file resolution", async (identifier) => {
  await save({ ...empty, contracts: { [identifier]: "file:missing.txt" } });
  const result = await run();
  expect(result.code).toBe(1);
  expect(result.error).toContain("Invalid skill contract manifest");
  expect(result.error).not.toContain("Cannot resolve");
});

test.each([
  { ...empty, schemaVersion: "skill-contract-manifest/v2" },
  { ...empty, produces: ["sample/v1", "sample/v1"] },
  { ...empty, accepts: {} },
  { ...empty, contracts: [] },
  { ...empty, contracts: { "sample/v1": ["file:definition.txt", "file:other.txt"] } },
  { ...empty, upgrades: [{ from: "sample/v1", to: "sample/v2" }] },
])("rejects malformed declarations without interpreting them: %j", async (value) => {
  await save(value);
  expect((await run()).code).toBe(1);
});

test.each([
  { ...empty, produces: ["missing/v1"] },
  { ...empty, accepts: ["missing/v1"] },
  { ...empty, upgrades: [{ from: "missing/v1", to: "missing/v2", procedure: "file:definition.txt" }] },
])("rejects undeclared used identifiers: %j", async (value) => {
  await save(value);
  const result = await run();
  expect(result.code).toBe(1);
  expect(result.error).toContain("Missing authoritative definition");
});

test("validates upgrade endpoints and resolves procedures without executing them", async () => {
  await writeFile(join(skill, "procedure.txt"), "Do not execute: owner conversion instructions.\n");
  const value = { ...empty, contracts: { "sample/v1": "file:definition.txt", "sample/v2": "file:definition.txt" }, upgrades: [{ from: "sample/v1", to: "sample/v2", procedure: "file:procedure.txt" }] };
  await save(value);
  const result = await run();
  expect(result.code).toBe(0);
  expect(JSON.parse(result.out).procedures).toEqual([{ reference: "file:procedure.txt", path: join(skill, "procedure.txt"), content: "Do not execute: owner conversion instructions.\n" }]);
  await save({ ...value, upgrades: [...value.upgrades, { ...value.upgrades[0], procedure: "file:definition.txt" }] });
  expect((await run()).error).toContain("one procedure per endpoint pair");
  await save({ ...value, upgrades: [{ from: "sample/v1", to: "sample/v1", procedure: "file:procedure.txt" }] });
  expect((await run()).code).toBe(1);
  await save({ ...value, upgrades: [{ ...value.upgrades[0], procedure: "file:missing.txt" }] });
  expect((await run()).error).toContain("Cannot resolve");
});

test.each(["file:missing.txt", "file:", "file:/absolute.txt", "git:unavailable:definition.txt", "https://example.com/definition"])("rejects unresolved reference %s without partial success or mutation", async (reference) => {
  await save({ ...empty, contracts: { "sample/v1": "file:definition.txt", "sample/v2": reference } });
  const before = await readFile(join(skill, "contracts.json"), "utf8");
  const result = await run("resolve", "sample/v1");
  expect(result.code).toBe(1);
  expect(result.out).toBe("");
  expect(await readFile(join(skill, "contracts.json"), "utf8")).toBe(before);
});

test("rejects unreadable JSON, empty definitions, and unknown requested contracts", async () => {
  await writeFile(join(skill, "contracts.json"), "{");
  expect((await run()).error).toContain("as JSON");
  await writeFile(join(skill, "definition.txt"), " \n");
  await save({ ...empty, contracts: { "sample/v1": "file:definition.txt" } });
  expect((await run()).error).toContain("must not be empty");
  await save(empty);
  expect((await run("resolve", "sample/v1")).error).toContain("no authoritative definition");
});

test.each(["\n", "\r"])("rejects trailing line terminators in every identifier position: %j", async (suffix) => {
  const bad = `sample/v1${suffix}`;
  for (const declaration of [
    { ...empty, produces: [bad] },
    { ...empty, accepts: [bad] },
    { ...empty, contracts: { [bad]: "file:definition.txt" } },
    { ...empty, upgrades: [{ from: bad, to: "sample/v2", procedure: "file:definition.txt" }] },
    { ...empty, upgrades: [{ from: "sample/v1", to: bad, procedure: "file:definition.txt" }] },
  ]) {
    await save(declaration);
    const result = await run();
    expect(result.code).toBe(1);
    expect(result.out).toBe("");
    expect(result.error).toContain("Invalid skill contract manifest");
  }
  await save(empty);
  const requested = await run("resolve", bad);
  expect(requested.code).toBe(1);
  expect(requested.error).toContain("Contract identifier must use");
});

async function gitAt(directory: string, ...args: string[]): Promise<string> {
  const child = Bun.spawn(["git", "-C", directory, ...args], { stdout: "pipe", stderr: "pipe" });
  const [code, out, error] = await Promise.all([child.exited, new Response(child.stdout).text(), new Response(child.stderr).text()]);
  if (code) throw new Error(error);
  return out.trim();
}

async function historicalSource(): Promise<{ source: string; commit: string }> {
  const source = join(root, "source");
  await mkdir(source);
  for (const directory of [source, caller, skill]) {
    await gitAt(directory, "init", "-q");
    await gitAt(directory, "add", ".");
    await gitAt(directory, "-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "--allow-empty", "-qm", "initial");
  }
  await writeFile(join(source, "definition.txt"), "Pinned historical definition.\n");
  await gitAt(source, "add", ".");
  await gitAt(source, "-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "-qm", "historical");
  const commit = await gitAt(source, "rev-parse", "HEAD");
  await writeFile(join(source, "definition.txt"), "New checkout content must not replace the pin.\n");
  await gitAt(source, "add", ".");
  await gitAt(source, "-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "-qm", "newer");
  return { source, commit };
}

test("fetches an absent pinned object from the declared source without changing any checkout", async () => {
  const { source, commit } = await historicalSource();
  const absent = Bun.spawn(["git", "-C", caller, "cat-file", "-e", commit], { stdout: "ignore", stderr: "ignore" });
  expect(await absent.exited).not.toBe(0);
  const reference = `git:${commit}:definition.txt`;
  await save({ ...empty, sourceRepository: source, accepts: ["sample/v1"], contracts: { "sample/v1": reference } });
  const directories = [caller, skill, source];
  const before = await Promise.all(directories.map(async (directory) => [await gitAt(directory, "rev-parse", "HEAD"), await gitAt(directory, "status", "--porcelain=v1", "--untracked-files=all")]));
  const result = await run("resolve", "sample/v1");
  expect(result.code).toBe(0);
  expect(JSON.parse(result.out)).toEqual({ reference, path: `${commit}:definition.txt`, content: "Pinned historical definition.\n" });
  expect((await run()).code).toBe(0);
  const after = await Promise.all(directories.map(async (directory) => [await gitAt(directory, "rev-parse", "HEAD"), await gitAt(directory, "status", "--porcelain=v1", "--untracked-files=all")]));
  expect(after).toEqual(before);
  expect(await readFile(join(caller, "definition.txt"), "utf8")).toBe("Wrong caller definition.\n");
  expect(await readFile(join(skill, "definition.txt"), "utf8")).toBe("Owner definition: preserve authored text.\n");
});

test("rejects mutable pins, missing source, and invalid repository paths", async () => {
  const { source, commit } = await historicalSource();
  for (const reference of [
    "git:HEAD:definition.txt", "git:master:definition.txt", "git:v1:definition.txt",
    `git:${commit.slice(0, 12)}:definition.txt`, `git:${commit}:/definition.txt`,
    `git:${commit}:../definition.txt`, `git:${commit}:./definition.txt`,
    `git:${commit}:dir//definition.txt`, `git:${commit}:definition.txt\n`,
  ]) {
    await save({ ...empty, sourceRepository: source, contracts: { "sample/v1": reference } });
    const result = await run();
    expect(result.code).toBe(1);
    expect(result.out).toBe("");
  }
  await save({ ...empty, contracts: { "sample/v1": `git:${commit}:definition.txt` } });
  expect((await run()).error).toContain("require sourceRepository");
  await save({ ...empty, sourceRepository: "../source", contracts: { "sample/v1": `git:${commit}:definition.txt` } });
  expect((await run()).code).toBe(1);
});

test("fails closed for unavailable repositories, commits, content, and non-commit objects", async () => {
  const { source, commit } = await historicalSource();
  await gitAt(source, "-c", "user.name=Test", "-c", "user.email=test@example.com", "tag", "-am", "tag", "v1", commit);
  const tag = await gitAt(source, "rev-parse", "v1");
  const tree = await gitAt(source, "rev-parse", `${commit}^{tree}`);
  for (const [repository, reference] of [
    [join(root, "unavailable"), `git:${commit}:definition.txt`],
    [caller, `git:${commit}:definition.txt`],
    [source, `git:${"0".repeat(40)}:definition.txt`],
    [source, `git:${commit}:missing.txt`],
    [source, `git:${tag}:definition.txt`],
    [source, `git:${tree}:definition.txt`],
  ]) {
    await save({ ...empty, sourceRepository: repository, contracts: { "sample/v1": "file:definition.txt", "sample/v2": reference } });
    const result = await run("resolve", "sample/v1");
    expect(result.code).toBe(1);
    expect(result.out).toBe("");
  }
});

test("resolves pinned upgrade procedures without execution and rejects empty historical content", async () => {
  const { source, commit } = await historicalSource();
  await save({
    ...empty, sourceRepository: source,
    contracts: { "sample/v1": "file:definition.txt", "sample/v2": "file:definition.txt" },
    upgrades: [{ from: "sample/v1", to: "sample/v2", procedure: `git:${commit}:definition.txt` }],
  });
  const result = await run();
  expect(result.code).toBe(0);
  expect(JSON.parse(result.out).procedures[0].content).toBe("Pinned historical definition.\n");
  await writeFile(join(source, "definition.txt"), " \n");
  await gitAt(source, "add", ".");
  await gitAt(source, "-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "-qm", "empty definition");
  const emptyCommit = await gitAt(source, "rev-parse", "HEAD");
  await save({ ...empty, sourceRepository: source, contracts: { "sample/v1": `git:${emptyCommit}:definition.txt` } });
  const rejected = await run();
  expect(rejected.code).toBe(1);
  expect(rejected.out).toBe("");
  expect(rejected.error).toContain("must not be empty");
});
