// Exercise persistence and rejection through the public owning CLI in isolated repositories.
import { afterEach, expect, test } from "bun:test";
import { mkdtemp, mkdir, readFile, writeFile, rm, symlink, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { slugifyGitRemote } from "../lib";
const cli = fileURLToPath(new URL("../cli.ts", import.meta.url));
const directories: string[] = [];
afterEach(async () => { await Promise.all(directories.splice(0).map(dir => rm(dir, { recursive: true, force: true }))); });
async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), "shared-contract-"));
  directories.push(root);
  const repo = path.join(root, "repo");
  const home = path.join(root, "home");
  await mkdir(repo);
  await mkdir(home);
  async function run(...args: string[]) {
    const child = Bun.spawn([cli, ...args], { cwd: repo, env: { ...process.env, HOME: home, XDG_CONFIG_HOME: path.join(home, ".config"), PATH: `${path.dirname(process.execPath)}:${process.env.PATH}` }, stdout: "pipe", stderr: "pipe" });
    const [stdout, stderr, code] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
    return { stdout, stderr, code };
  }
  for (const args of [["init", "-q", repo], ["-C", repo, "remote", "add", "origin", "https://github.com/example/contracts.git"]]) {
    const child = Bun.spawn(["git", ...args], { stdout: "pipe", stderr: "pipe" });
    if (await child.exited) throw new Error(await new Response(child.stderr).text());
  }
  const route = path.join(repo, ".context-routes.toml");
  const lines = ["# Authored route policy", "schema = 2 # retain header note", 'note = "keep"'];
  for (const kind of ["alignment", "tickets", "initiatives", "workflows", "evidence", "sources"]) {
    lines.push(`[records.${kind}]`, `adapter = "${kind === "tickets" ? "local-markdown" : "files"}"`, `store = "${kind === "evidence" ? "inherit:workflows" : "repository"}" # retain route note`);
  }
  await writeFile(route, lines.join("\n") + "\n");
  const shared = path.join(home, "Notes/SharedAgentContext", slugifyGitRemote("https://github.com/example/contracts.git"));
  return { root, repo, home, route, shared, run };
}
test("read-only resolution preserves legacy config; mutation preserves authored text and independent inherited storage", async () => {
  const f = await fixture();
  const original = await readFile(f.route, "utf8");
  const resolved = await f.run("resolve", "workflow", "--id", "TASK-1", "--json");
  expect(resolved.code).toBe(0);
  expect(JSON.parse(resolved.stdout)).toMatchObject({ schemaVersion: "shared-context-resolution/v1", store: "repository", path: path.join(f.repo, "workflows/TASK-1") });
  expect(await readFile(f.route, "utf8")).toBe(original);
  expect((await f.run("configure-route", "--kind", "workflows", "--store", "shared")).code).toBe(0);
  const updated = await readFile(f.route, "utf8");
  expect(updated).toBe(original.replace("schema = 2", 'schemaVersion = "shared-context-routes/v3"').replace('[records.workflows]\nadapter = "files"\nstore = "repository"', '[records.workflows]\nadapter = "files"\nstore = "shared"').replace('store = "inherit:workflows"', 'store = "repository"'));
  const evidence = await f.run("resolve", "evidence", "--workflow", "TASK-1", "--run", "manual", "--json");
  expect(JSON.parse(evidence.stdout).store).toBe("repository");
  expect((await f.run("resolve", "workflow", "--id", "TASK-1", "--json")).stdout).toContain('"store": "shared"');
});
test("bulk conversion reports partial outcomes and preserves rejected and current bytes", async () => {
  const f = await fixture();
  const layout = path.join(f.repo, "docs/agents/context-layout.toml");
  await mkdir(path.dirname(layout), { recursive: true });
  const authored = '# Paths\nschema = 1 # custom\n[paths]\ntracker = "records"\n';
  await writeFile(layout, authored);
  const unknown = path.join(f.root, ".context-routes.toml");
  const bytes = 'schemaVersion = "shared-context-routes/v99"\n';
  await writeFile(unknown, bytes);
  const selection = path.join(f.root, "selection.json");
  await writeFile(selection, JSON.stringify([layout, unknown]));
  const result = await f.run("upgrade", "--artifacts", selection);
  expect(result.code).toBe(1);
  expect(JSON.parse(result.stdout).status).toBe("partial");
  expect(await readFile(layout, "utf8")).toBe(authored.replace("schema = 1", 'schemaVersion = "shared-context-layout/v2"'));
  expect(await readFile(unknown, "utf8")).toBe(bytes);
  await writeFile(selection, JSON.stringify([layout]));
  const current = await readFile(layout, "utf8");
  expect(JSON.parse((await f.run("upgrade", "--artifacts", selection)).stdout).results[0].changed).toBe(false);
  expect(await readFile(layout, "utf8")).toBe(current);
});
test("unsafe route syntax and conflicting identifiers reject without byte changes", async () => {
  const f = await fixture();
  const original = (await readFile(f.route, "utf8")).replaceAll('store = "repository"', "store = 'repository'");
  await writeFile(f.route, original);
  expect((await f.run("configure-route", "--kind", "workflows", "--store", "shared")).code).not.toBe(0);
  expect(await readFile(f.route, "utf8")).toBe(original);
  const multiline = original.replace("[records.workflows]", '[records.workflows]\nnotes = """\nstore = "repository"\n"""');
  await writeFile(f.route, multiline);
  expect((await f.run("configure-route", "--kind", "workflows", "--store", "shared")).code).not.toBe(0);
  expect(await readFile(f.route, "utf8")).toBe(multiline);
  const ambiguous = 'schemaVersion = "shared-context-routes/v3"\n' + original;
  await writeFile(f.route, ambiguous);
  const selection = path.join(f.root, "selection.json");
  await writeFile(selection, JSON.stringify([f.route]));
  expect((await f.run("upgrade", "--artifacts", selection)).code).toBe(1);
  expect(await readFile(f.route, "utf8")).toBe(ambiguous);
});
test("source indexing preserves authored notes and rejects ambiguous managed blocks", async () => {
  const f = await fixture();
  const source = path.join(f.repo, "sources/library/web");
  await mkdir(source, { recursive: true });
  const copy = '---\nschemaVersion: shared-context-source/v1\nsource: web\ntitle: Original title\nurl: https://example.com\n---\nOriginal body\n';
  await writeFile(path.join(source, "copy.md"), copy);
  const index = path.join(source, "index.md");
  const notes = '# Notes\nKeep these notes.\n<!-- shared-context:index start -->\nstale\n<!-- shared-context:index end -->\nFooter\n';
  await writeFile(index, notes);
  const args = ["index", source, "--kind", "source", "--source", "web", "--library"];
  expect((await f.run(...args)).code).toBe(0);
  const updated = await readFile(index, "utf8");
  expect(updated).toContain("Original title");
  expect(updated.startsWith("# Notes\nKeep these notes.\n")).toBe(true);
  expect(updated.endsWith("\nFooter\n")).toBe(true);
  expect(await readFile(path.join(source, "copy.md"), "utf8")).toBe(copy);
  const malformed = updated + '<!-- shared-context:index start -->';
  await writeFile(index, malformed);
  expect((await f.run(...args)).code).not.toBe(0);
  expect(await readFile(index, "utf8")).toBe(malformed);
});

test("repeated indexing keeps logical source identity across a canonical directory alias", async () => {
  const f = await fixture();
  const source = path.join(f.repo, "sources/library/web");
  const canonical = path.join(f.repo, "CanonicalSources");
  await mkdir(path.dirname(source), { recursive: true });
  await mkdir(canonical);
  await symlink("../../CanonicalSources", source);
  const args = ["index", source, "--kind", "source", "--source", "web", "--library"];
  expect((await f.run(...args)).code).toBe(0);
  const index = path.join(canonical, "index.md");
  const first = await readFile(index, "utf8");
  expect(first).toContain('source: "web"');
  expect(first).toContain('scope: "library"');
  expect((await f.run(...args)).code).toBe(0);
  expect(await readFile(index, "utf8")).toBe(first);
});

test("unsupported generated source identity rejects before creating an index", async () => {
  const f = await fixture();
  const source = path.join(f.repo, "Web");
  await mkdir(source);
  const copy = "Exact source bytes\n";
  await writeFile(path.join(source, "copy.md"), copy);
  const result = await f.run("index", source, "--kind", "source", "--source", "web", "--library");
  expect(result.code).not.toBe(0);
  expect(result.stderr).toContain("Invalid owned index metadata");
  expect(await stat(path.join(source, "index.md")).catch(error => error.code)).toBe("ENOENT");
  expect(await readFile(path.join(source, "copy.md"), "utf8")).toBe(copy);
});

test("alignment migration keeps explicit independent routes authoritative after instructions are copied", async () => {
  const f = await fixture();
  const instructions = "# Authored instructions\nKeep these exact bytes.\n";
  await writeFile(path.join(f.repo, "AGENTS.md"), instructions);
  const original = await readFile(f.route, "utf8");
  const migrated = await f.run("migrate", "alignment", "--to", "shared");
  expect(migrated.code).toBe(0);
  expect(await readFile(path.join(f.shared, "AGENTS.md"), "utf8")).toBe(instructions);
  expect(await readFile(f.route, "utf8")).toBe(original.replace("schema = 2", 'schemaVersion = "shared-context-routes/v3"').replace('[records.alignment]\nadapter = "files"\nstore = "repository"', '[records.alignment]\nadapter = "files"\nstore = "shared"'));
  for (const args of [["tickets"], ["workflow", "--id", "TASK-1"], ["sources"]]) {
    const resolved = await f.run("resolve", ...args, "--json");
    expect(resolved.code).toBe(0);
    expect(JSON.parse(resolved.stdout).store).toBe("repository");
  }
  expect(JSON.parse((await f.run("resolve", "alignment", "--json")).stdout).store).toBe("shared");
});

test("empty collection migration creates identity before committing the route", async () => {
  const f = await fixture();
  expect((await f.run("migrate", "sources", "--to", "shared")).code).toBe(0);
  expect(JSON.parse(await readFile(path.join(f.shared, ".context-project.json"), "utf8"))).toEqual({ schemaVersion: "shared-context-project/v1", origin: "https://github.com/example/contracts" });
  const resolved = JSON.parse((await f.run("resolve", "sources", "--json")).stdout);
  expect(resolved).toMatchObject({ store: "shared", path: path.join(f.shared, "sources") });
});

test.each(['"schema" = 2', "schema = 0x2"])("migration preflights conversion of %s before creating target records", async header => {
  const f = await fixture();
  const original = (await readFile(f.route, "utf8")).replace("schema = 2", header);
  await writeFile(f.route, original);
  const source = path.join(f.repo, "sources/library/web");
  await mkdir(source, { recursive: true });
  await writeFile(path.join(source, "copy.md"), "Authored source\n");
  expect((await f.run("resolve", "sources", "--json")).code).toBe(0);
  const result = await f.run("migrate", "sources", "--to", "shared");
  expect(result.code).not.toBe(0);
  expect(result.stderr).toContain("Configuration header syntax");
  expect(await readFile(f.route, "utf8")).toBe(original);
  expect(await readFile(path.join(source, "copy.md"), "utf8")).toBe("Authored source\n");
  expect(await stat(f.shared).catch(error => error.code)).toBe("ENOENT");
});

const managed = "<!-- shared-context:index start -->\nstale\n<!-- shared-context:index end -->\n";
const indexMetadata = 'schemaVersion: shared-context-index/v1\nsource: web\nscope: library\ngenerated_by: shared-context\ngenerated_at: "2026-11-22T00:00:00.000Z"\n';
test.each([
  "schemaVersion: shared-context-index/v99\n" + indexMetadata,
  indexMetadata + "source: other\n",
  indexMetadata.replace("scope: library\n", ""),
  indexMetadata.replace("generated_by: shared-context", "generated_by: other-owner"),
  indexMetadata.replace("generated_at: \"2026-11-22T00:00:00.000Z\"", "generated_at: yesterday"),
  indexMetadata.replace("source: web", "source: [web]"),
  indexMetadata.replace("schemaVersion: shared-context-index/v1", "schemaVersion: null"),
])("invalid owned index metadata rejects without writes: %s", async metadata => {
  const f = await fixture();
  const source = path.join(f.repo, "sources/library/web");
  await mkdir(source, { recursive: true });
  const index = path.join(source, "index.md");
  const original = `---\n${metadata}---\n# Authored notes\n${managed}`;
  await writeFile(index, original);
  expect((await f.run("index", source, "--kind", "source", "--source", "web", "--library")).code).not.toBe(0);
  expect(await readFile(index, "utf8")).toBe(original);
});

test.each(["source: [web]", "title: 42", "url: false", "schemaVersion: null", "schemaVersion: shared-context-source/v99"])("invalid owned source metadata rejects without changing the index: %s", async field => {
  const f = await fixture();
  const source = path.join(f.repo, "sources/library/web");
  await mkdir(source, { recursive: true });
  const identity = field.startsWith("schemaVersion:") ? field : `schemaVersion: shared-context-source/v1\n${field}`;
  const copy = `---\n${identity}\n---\nSource body\n`;
  await writeFile(path.join(source, "copy.md"), copy);
  const index = path.join(source, "index.md");
  await writeFile(index, managed);
  expect((await f.run("index", source, "--kind", "source", "--source", "web", "--library")).code).not.toBe(0);
  expect(await readFile(index, "utf8")).toBe(managed);
  expect(await readFile(path.join(source, "copy.md"), "utf8")).toBe(copy);
});

test("external source contracts remain opaque while owned and legacy sources retain their bytes", async () => {
  const f = await fixture();
  const source = path.join(f.repo, "sources/library/web");
  await mkdir(source, { recursive: true });
  const copies = {
    "external.md": "---\nschemaVersion: external-source/v7\nsource: [foreign, structure]\ntitle: External title\nurl: https://example.com/external\n---\nExternal body\n",
    "owned.md": "---\nschemaVersion: shared-context-source/v1\nsource: web\ntitle: Owned title\n---\nOwned body\n",
    "legacy.md": "---\nsource: web\ntitle: Legacy title\n---\nLegacy body\n",
  };
  for (const [name, content] of Object.entries(copies)) await writeFile(path.join(source, name), content);
  expect((await f.run("index", source, "--kind", "source", "--source", "web", "--library")).code).toBe(0);
  expect((await f.run("index", source, "--kind", "source", "--source", "web", "--library")).code).toBe(0);
  const index = await readFile(path.join(source, "index.md"), "utf8");
  expect(index).toContain("[External title](https://example.com/external)");
  expect(index).toContain("Owned title");
  expect(index).toContain("Legacy title");
  for (const [name, content] of Object.entries(copies)) expect(await readFile(path.join(source, name), "utf8")).toBe(content);
});

test.each(["events", "artifacts/evidence/RUN"])("canonical aliases into %s cannot mutate history through index or configuration upgrades", async history => {
  const f = await fixture();
  const target = path.join(f.repo, "workflows/TASK", history);
  const alias = path.join(f.repo, "sources/library/web");
  await mkdir(target, { recursive: true });
  await mkdir(path.dirname(alias), { recursive: true });
  await symlink(target, alias);
  const index = path.join(target, "index.md");
  await writeFile(index, managed);
  const configuration = path.join(target, ".context-routes.toml");
  const original = await readFile(f.route, "utf8");
  await writeFile(configuration, original);
  const selection = path.join(f.root, "selection.json");
  await writeFile(selection, JSON.stringify([path.join(alias, ".context-routes.toml")]));
  const indexed = await f.run("index", alias, "--kind", "source", "--source", "web", "--library");
  expect(indexed.code).not.toBe(0);
  expect(indexed.stderr).toContain("Immutable history");
  const upgraded = await f.run("upgrade", "--artifacts", selection);
  expect(upgraded.code).toBe(1);
  expect(JSON.parse(upgraded.stdout).results[0].error).toContain("Immutable artifact");
  expect(await readFile(index, "utf8")).toBe(managed);
  expect(await readFile(configuration, "utf8")).toBe(original);
});

test("configuration aliases honor the canonical target upgrade lock", async () => {
  const f = await fixture();
  const alias = path.join(f.root, "alias");
  await symlink(f.repo, alias);
  const original = await readFile(f.route, "utf8");
  await writeFile(`${f.route}.contract-upgrade.lock`, "Other cooperating writer\n");
  const selection = path.join(f.root, "selection.json");
  await writeFile(selection, JSON.stringify([path.join(alias, ".context-routes.toml")]));
  expect((await f.run("upgrade", "--artifacts", selection)).code).toBe(1);
  expect(await readFile(f.route, "utf8")).toBe(original);
  expect(await readFile(`${f.route}.contract-upgrade.lock`, "utf8")).toBe("Other cooperating writer\n");
});

test("identity recovery versions only newly created records and preserves historical identities", async () => {
  const f = await fixture();
  await mkdir(f.shared, { recursive: true });
  const slug = path.basename(f.shared);
  const args = ["recover-identity", slug, "--remote", "https://github.com/example/contracts.git"];
  expect((await f.run(...args)).code).toBe(0);
  const identity = path.join(f.shared, ".context-project.json");
  const created = await readFile(identity, "utf8");
  expect(JSON.parse(created)).toEqual({ schemaVersion: "shared-context-project/v1", origin: "https://github.com/example/contracts" });
  expect((await f.run(...args)).code).toBe(0);
  expect(await readFile(identity, "utf8")).toBe(created);
  const historical = '{ "origin": "https://github.com/example/contracts.git", "authored": "keep" }\n';
  await writeFile(identity, historical);
  expect((await f.run(...args)).code).toBe(0);
  expect(await readFile(identity, "utf8")).toBe(historical);
});

test.each(["migrate", "init"])("%s preserves equivalent authored project identities and rejects mismatches", async operation => {
  for (const extra of ["", ', "authored": "keep"']) {
    const f = await fixture();
    await mkdir(f.shared, { recursive: true });
    if (operation === "init") await rm(f.route);
    const identity = path.join(f.shared, ".context-project.json");
    const original = `{ "origin": "https://github.com/example/contracts.git"${extra} }\n`;
    await writeFile(identity, original);
    const args = operation === "init" ? ["init", "--store", "shared"] : ["migrate", "sources", "--to", "shared"];
    expect((await f.run(...args)).code).toBe(0);
    expect(await readFile(identity, "utf8")).toBe(original);
  }
  const f = await fixture();
  await mkdir(f.shared, { recursive: true });
  if (operation === "init") await rm(f.route);
  const identity = path.join(f.shared, ".context-project.json");
  const mismatch = '{ "origin": "https://github.com/example/other.git" }\n';
  await writeFile(identity, mismatch);
  const args = operation === "init" ? ["init", "--store", "shared"] : ["migrate", "sources", "--to", "shared"];
  expect((await f.run(...args)).code).toBe(1);
  expect(await readFile(identity, "utf8")).toBe(mismatch);
  expect(await stat(path.join(f.shared, "sources")).catch(() => null)).toBeNull();
});
