// Temporary repositories exercise the public CLI and real graph reader, never live tracker records.
import { afterEach, expect, spyOn, test } from "bun:test";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { slugifyGitRemote } from "../../../../agent-core/skills/shared-context/scripts/shared-context/lib.ts";
import { markdownGraph } from "./dep-tree-markdown.ts";
import { applyMigration, checkMigration, planMigration, writePlanOutput, type MigrationPlan } from "./record-migration.ts";

const temporary: string[] = [];
const cli = fileURLToPath(new URL("./records.ts", import.meta.url));
const origin = "https://github.com/migration-tests/records.git";
const timeout = 120_000;
afterEach(async () => { await Promise.all(temporary.splice(0).map((directory) => fs.rm(directory, { recursive: true, force: true }))); });

async function markdown(filename: string, source?: string): Promise<string> {
  const args = ["x", "--", "mq", "--allow-http-import", "--no-lockfile", "-I", "raw", "-F", "json", 'import "github.com/harehare/okf.mq" | .'];
  const text = JSON.parse(execFileSync("mise", source === undefined ? [...args, filename] : args, { input: source, encoding: "utf8" })) as string;
  if (source !== undefined) { await fs.mkdir(path.dirname(filename), { recursive: true }); await fs.writeFile(filename, text); }
  return text;
}
function recordDocument(filename: string): { frontmatter: Record<string, unknown>; body: string } {
  return JSON.parse(execFileSync("mise", ["x", "--", "mq", "--allow-http-import", "--no-lockfile", "-I", "raw", "-F", "json", 'import "github.com/harehare/okf.mq" | okf::okf_parse(.)', filename], { encoding: "utf8" }));
}

async function fixture(mixed = false) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "records-migration-"));
  temporary.push(directory);
  const repository = path.join(directory, "repository");
  const sharedContextBase = path.join(directory, "shared");
  const sharedRoot = path.join(sharedContextBase, slugifyGitRemote(origin));
  await fs.mkdir(repository, { recursive: true });
  await fs.mkdir(sharedRoot, { recursive: true });
  execFileSync("git", ["init", "--quiet", repository]);
  execFileSync("git", ["-C", repository, "remote", "add", "origin", origin]);
  await markdown(path.join(repository, "docs/agents/issue-tracker.md"), '---\nbackend: local-markdown\nissue-root: records/issues\ninitiative-root: records/plans\n---\n# Tracker\n');
  await fs.writeFile(path.join(repository, "docs/agents/context-layout.toml"), 'schema = 1\n[paths]\ntracker = "records"\n');
  if (mixed) {
    const routes = ["schema = 2"];
    for (const [kind, adapter, store] of [["alignment", "markdown", "repository"], ["tickets", "local-markdown", "repository"], ["initiatives", "markdown", "shared"], ["workflows", "files", "repository"], ["evidence", "files", "inherit:workflows"], ["sources", "files", "inherit:alignment"]]) routes.push(`[records.${kind}]`, `adapter = "${adapter}"`, `store = "${store}"`);
    await fs.writeFile(path.join(sharedRoot, ".context-routes.toml"), routes.join("\n"));
  }
  const issues = path.join(repository, "records/issues");
  const initiative = path.join(mixed ? sharedRoot : repository, "records/plans/launch-spec");
  const spec = path.join(issues, "launch-spec.md");
  const child = path.join(issues, "TASK-1.md");
  const prerequisite = path.join(issues, "TASK-2.md");
  const specBody = '# Full specification\n\n<!-- preserve this comment -->\n\nText with two spaces.  \n\n[Asset](../asset.png "asset title")\n\n```md\n[Not a live link](launch-spec.md)\n```\n';
  await markdown(spec, `---\nid: launch-spec\ntitle: Launch specification\ntype: spec\nwork_status: unclaimed\nblocked_by: []\ncustom: {nested: yes}\n# custom comment\n---\n\n${specBody}`);
  const childText = '---\nid: TASK-1\ntitle: First task\nparent: launch-spec\nsequence: 1\nwork_status: claimed\nblocked_by: [TASK-2]\nowner: alice\n---\n\nChild body.\n';
  await markdown(child, childText);
  await markdown(prerequisite, '---\nid: TASK-2\ntitle: Prerequisite\nparent: launch-spec\nwork_status: completed\nblocked_by: []\n---\nSecond task.\n');
  const inbound = path.join(repository, "records/index.md");
  await markdown(inbound, '# Tracker\n\n[Specification][spec]\n\n[spec]: issues/launch-spec.md#details "Full spec"\n\n`issues/launch-spec.md`\n');
  const event = path.join(repository, "workflows/unrelated/events/001.md");
  await markdown(event, '# Immutable event\n\n[Old spec](../../../records/issues/launch-spec.md)\n');
  return { directory, repository, sharedContextBase, sharedRoot, issues, initiative, spec, child, childText, prerequisite, inbound, event, specBody };
}

async function planned(f: { repository: string; sharedContextBase: string }) {
  return planMigration(f, { kind: "spec-ticket", id: "launch-spec" });
}

test("actual CLI plans and applies preserved spec, child records and live references; normal discovery accepts result", async () => {
  const f = await fixture();
  const beforeChild = recordDocument(f.child);
  const beforeEvent = await markdown(f.event);
  const output = path.join(f.directory, "migration-plan.json");
  const flags = ["--repository", f.repository, "--shared-context-base", f.sharedContextBase];
  const planResult = JSON.parse(execFileSync(cli, ["migrate", "plan", ...flags, "--spec-ticket", "launch-spec", "--output", output], { encoding: "utf8" }));
  expect(planResult.schemaVersion).toBe("tracker-result/v2");
  expect(planResult).not.toHaveProperty("schema");
  expect(planResult.plan.schemaVersion).toBe("tracker-migration-plan/v2");
  expect(planResult.changes).toBeNull();
  expect(planResult.validation.status).toBe("planned");
  expect(planResult.initiatives[0].id).toBe("launch-spec");
  expect(planResult.tickets).toHaveLength(2);
  expect(planResult.plan.affectedChildren).toHaveLength(2);
  const plan = JSON.parse(await fs.readFile(output, "utf8")) as MigrationPlan;
  expect(plan.changes[0]!.oldPath).toBe(f.spec);
  expect(plan.changes[0]!.newPath).toBe(path.join(f.initiative, "index.md"));
  expect(await fs.stat(path.join(f.repository, "workflows/migration-" + plan.id)).catch(() => null)).toBeNull();
  const result = JSON.parse(execFileSync(cli, ["migrate", "apply", ...flags, "--plan", output, "--acknowledge-writer-safety"], { encoding: "utf8" }));
  expect(result.schemaVersion).toBe("tracker-result/v2");
  expect(result).not.toHaveProperty("schema");
  expect(result.contentVerified).toBe(true);
  expect(result.normalTrackerDiscovery).toEqual({ tickets: 2, initiatives: 1 });
  expect(result.furtherWorkBlocked).toBe(true);
  expect(result.publication.status).toBe("required");
  expect(result.publication.stores[0].status).toBe("uncommitted");
  expect(result.changes.dependency_edges_added).toEqual([]);
  expect(result.validation.status).toBe("passed");
  const text = await markdown(path.join(f.initiative, "index.md"));
  expect(recordDocument(path.join(f.initiative, "index.md")).frontmatter).toMatchObject({ schemaVersion: "tracker-initiative/v2" });
  expect(text).toContain("id: launch-spec");
  expect(text).toContain("custom: {nested: yes}\n# custom comment");
  expect(text).toContain("<!-- preserve this comment -->");
  expect(text).toContain("Text with two spaces.  \n");
  expect(text).toContain('[Asset](../../asset.png "asset title")');
  expect(text).toContain("## Tickets");
  expect(text).not.toContain("work_status:");
  expect(text).not.toContain("blocked_by:");
  const afterChild = recordDocument(f.child);
  expect(afterChild.frontmatter).toEqual({ ...beforeChild.frontmatter, schemaVersion: "tracker-ticket/v2" });
  expect(afterChild.body).toBe(beforeChild.body);
  expect(recordDocument(f.prerequisite).frontmatter).toMatchObject({ schemaVersion: "tracker-ticket/v2", id: "TASK-2", parent: "launch-spec", work_status: "completed", blocked_by: [] });
  expect(await markdown(f.event)).toBe(beforeEvent);
  const inbound = await markdown(f.inbound);
  expect(inbound).toContain('[spec]: plans/launch-spec/index.md#details "Full spec"');
  expect(inbound).toContain("`issues/launch-spec.md`");
  expect(await markdownGraph(f.repository, "TASK-1", undefined, f.sharedContextBase)).toContain("TASK-2");
  const checked = JSON.parse(execFileSync(cli, ["migrate", "check", ...flags, "--migration", plan.id], { encoding: "utf8" }));
  expect(checked.membershipVerified).toBe(true);
  expect(checked.normalTrackerDiscovery).toEqual({ tickets: 2, initiatives: 1 });
  const events = path.join(f.repository, `workflows/migration-${plan.id}/events`);
  const countBefore = (await fs.readdir(events)).length;
  expect((await applyMigration(f, plan, true)).idempotent).toBe(true);
  expect((await fs.readdir(events)).length).toBe(countBefore);
}, timeout);

test("committed migration paths remain committed through a symlinked shared store", async () => {
  const f = await fixture(true);
  const linkedShared = path.join(f.directory, "linked-shared");
  await fs.symlink(f.sharedContextBase, linkedShared, "dir");
  execFileSync("git", ["init", "--quiet", f.sharedContextBase]);
  const options = { repository: f.repository, sharedContextBase: linkedShared };
  const plan = await planned(options);
  await applyMigration(options, plan, true);
  for (const directory of [f.repository, linkedShared]) {
    execFileSync("git", ["-C", directory, "add", "."]);
    execFileSync("git", ["-C", directory, "-c", "user.name=Migration Test", "-c", "user.email=migration@example.invalid", "commit", "--quiet", "-m", "Record migration"]);
  }
  const checked = await checkMigration(options, plan.id);
  expect(checked.contentVerified).toBe(true);
  expect(checked.publication).toMatchObject({
    status: "committed",
    stores: [{ status: "committed" }, { status: "committed" }],
    required: true,
  });
}, timeout);

test("mixed stores keep exact configured roots and repair cross-store membership", async () => {
  const f = await fixture(true);
  const plan = await planned(f);
  expect(plan.routes.initiatives.store).toBe("shared");
  expect(plan.routes.tickets.path).toBe(f.issues);
  await applyMigration(f, plan, true);
  expect(await markdownGraph(f.repository, undefined, "launch-spec", f.sharedContextBase)).toContain("TASK-1");
  expect((await checkMigration(f, plan.id)).contentVerified).toBe(true);
}, timeout);

test("stale source, new collection members and tampered paths reject before mutation", async () => {
  const f = await fixture();
  const plan = await planned(f);
  const old = await markdown(f.child);
  await markdown(f.child, old + "Changed\n");
  await expect(applyMigration(f, plan, true)).rejects.toThrow("Stale or altered");
  await markdown(f.child, old);
  const tampered = structuredClone(plan);
  tampered.changes[0]!.newPath = path.join(f.directory, "outside.md");
  await expect(applyMigration(f, tampered, true)).rejects.toThrow("escapes");
  await markdown(path.join(f.issues, "TASK-3.md"), '---\nid: TASK-3\ntitle: New child\nparent: launch-spec\nblocked_by: []\n---\n');
  await expect(applyMigration(f, plan, true)).rejects.toThrow("Stale or altered");
  expect(await markdown(f.spec)).toBe(plan.changes[0]!.before);
}, timeout);

test("destination conflict, unknown future schema and executable spec history refuse mutation", async () => {
  const f = await fixture();
  await markdown(path.join(f.initiative, "index.md"), "# Authored content\n");
  const conflict = await planned(f);
  expect(conflict.conflicts.join(" ")).toContain("already exists");
  await expect(applyMigration(f, conflict, true)).rejects.toThrow("conflicts");
  const current = await markdown(f.spec);
  await markdown(f.spec, current.replace("id: launch-spec", "schema: tracker-ticket/v99\nid: launch-spec"));
  await expect(planned(f)).rejects.toThrow("schema");
  await markdown(f.spec, current.replace("work_status: unclaimed", "work_status: claimed"));
  expect((await planned(f)).conflicts.join(" ")).toContain("workflow status");
  await markdown(f.spec, current);
  await markdown(path.join(f.repository, "workflows/launch-spec/events/001.md"), "# Existing execution receipt\n");
  expect((await planned(f)).conflicts.join(" ")).toContain("workflow history");
}, timeout);

test("writer acknowledgement and plan output guards are explicit", async () => {
  const f = await fixture();
  const plan = await planned(f);
  await expect(applyMigration(f, plan, false)).rejects.toThrow("acknowledge-writer-safety");
  await expect(writePlanOutput(f, plan, path.join(f.issues, "plan.json"))).rejects.toThrow("outside");
  await expect(writePlanOutput(f, plan, path.join(f.repository, "workflows/plan.json"))).rejects.toThrow("workflow");
  const workflows = path.join(f.repository, "workflows");
  const alias = path.join(f.directory, "workflow-alias");
  await fs.symlink(workflows, alias);
  await expect(writePlanOutput(f, plan, path.join(alias, "plan.json"))).rejects.toThrow("workflow");
  const output = path.join(f.directory, "plan.json");
  await writePlanOutput(f, plan, output);
  await expect(writePlanOutput(f, plan, output)).rejects.toThrow();
}, timeout);

test("a later partial write failure restores the moved spec and records rollback", async () => {
  const f = await fixture();
  const plan = await planned(f);
  const originalRename = fs.rename.bind(fs);
  const rename = spyOn(fs, "rename").mockImplementation(async (from, to) => {
    if (String(to) === f.inbound) throw new Error("Injected inbound write failure");
    return originalRename(from, to);
  });
  try { await expect(applyMigration(f, plan, true)).rejects.toThrow("partial writes rolled back"); }
  finally { rename.mockRestore(); }
  expect(await markdown(f.spec)).toBe(plan.changes[0]!.before);
  expect(await fs.stat(path.join(f.initiative, "index.md")).catch(() => null)).toBeNull();
  const state = JSON.parse(await fs.readFile(path.join(f.repository, `workflows/migration-${plan.id}/events/000002-migration.json`), "utf8"));
  expect(state.state).toBe("rolled-back");
  await expect(applyMigration(f, plan, true)).rejects.toThrow("incomplete");
}, timeout);

test("legacy ticket stamping preserves fields and initiative spec consolidation is separate", async () => {
  const f = await fixture();
  // The ticket belongs to a real legacy initiative, so staged graph discovery is meaningful.
  await markdown(path.join(f.initiative, "index.md"), '# Launch\n\n- [First](../../issues/TASK-1.md)\n- [Second](../../issues/TASK-2.md)\n');
  const ticket = await planMigration(f, { kind: "ticket", id: "TASK-1" });
  expect(ticket.affectedChildren).toEqual([]);
  expect(ticket.changes).toHaveLength(1);
  expect(ticket.changes[0]!.after).toContain("schemaVersion: tracker-ticket/v2");
  expect(ticket.changes[0]!.after).toContain("work_status: claimed");
  await applyMigration(f, ticket, true);
  expect(await markdownGraph(f.repository, "TASK-1", undefined, f.sharedContextBase)).toContain("TASK-2");
  const separate = await fixture();
  await fs.mkdir(separate.initiative, { recursive: true });
  await markdown(path.join(separate.initiative, "spec.md"), '---\nid: launch-spec\ntitle: Initiative spec\ncustom: retain\n---\n# Complete spec\n');
  // Explicit consolidation refuses a duplicate spec-ticket id rather than guessing which record owns it.
  const duplicate = await planMigration(separate, { kind: "initiative-spec", id: "launch-spec" });
  expect(duplicate.conflicts.join(" ")).toContain("duplicated");
  await fs.unlink(separate.spec);
  const consolidation = await planMigration(separate, { kind: "initiative-spec", id: "launch-spec" });
  await applyMigration(separate, consolidation, true);
  expect(await markdown(path.join(separate.initiative, "index.md"))).toContain("# Complete spec");
}, timeout);

test("hosted tracker backend reports prerequisite without creating migration state", async () => {
  const f = await fixture(true);
  const manifest = path.join(f.sharedRoot, ".context-routes.toml");
  const text = await fs.readFile(manifest, "utf8");
  await fs.writeFile(manifest, text.replace('adapter = "local-markdown"\nstore = "repository"', 'adapter = "github"'));
  await expect(planned(f)).rejects.toThrow("Local Markdown backend");
  expect(await fs.stat(path.join(f.repository, "workflows/migration-plan")).catch(() => null)).toBeNull();
}, timeout);

test("workflow collisions and unsupported journal versions block mutation and repeat checks", async () => {
  const f = await fixture();
  const plan = await planned(f);
  const workflow = path.join(f.repository, `workflows/migration-${plan.id}`);
  await fs.mkdir(path.join(workflow, "events"), { recursive: true });
  await fs.writeFile(path.join(workflow, "events/000001-migration.json"), JSON.stringify({ schema: "tracker-migration/v99" }));
  await expect(applyMigration(f, plan, true)).rejects.toThrow("collision");
  expect(await markdown(f.spec)).toBe(plan.changes[0]!.before);
  await fs.rm(workflow, { recursive: true });
  await applyMigration(f, plan, true);
  const eventPath = path.join(workflow, "events/000002-migration.json");
  const event = JSON.parse(await fs.readFile(eventPath, "utf8"));
  await fs.writeFile(eventPath, JSON.stringify({ ...event, schemaVersion: "tracker-migration/v99" }));
  await expect(checkMigration(f, plan.id)).rejects.toThrow("unsupported schema");
  await expect(applyMigration(f, plan, true)).rejects.toThrow("unsupported schema");
}, timeout);

test("actual staged graph failure leaves legacy records and workflow untouched", async () => {
  const f = await fixture();
  await fs.unlink(f.prerequisite);
  const plan = await planned(f);
  await expect(applyMigration(f, plan, true)).rejects.toThrow("TASK-2");
  expect(await markdown(f.spec)).toBe(plan.changes[0]!.before);
  expect(await fs.stat(path.join(f.repository, `workflows/migration-${plan.id}`)).catch(() => null)).toBeNull();
}, timeout);

test("group conversion merges a child's inbound repair with stamping and leaves versioned children intact", async () => {
  const f = await fixture();
  await markdown(f.child, f.childText + "\n[Specification](launch-spec.md)\n");
  await markdown(f.prerequisite, "---\nschema: tracker-ticket/v1\nid: TASK-2\ntitle: Prerequisite\nparent: launch-spec\nwork_status: completed\nblocked_by: []\n---\nSecond task.\n");
  const versionedBefore = await markdown(f.prerequisite);
  const childBefore = recordDocument(f.child);
  const plan = await planned(f);
  expect(plan.changes.filter((entry) => entry.oldPath === f.child)).toHaveLength(1);
  expect(plan.changes.some((entry) => entry.oldPath === f.prerequisite)).toBe(false);
  await applyMigration(f, plan, true);
  expect(recordDocument(f.child).frontmatter).toEqual({ ...childBefore.frontmatter, schemaVersion: "tracker-ticket/v2" });
  expect(await markdown(f.child)).toContain("[Specification](../plans/launch-spec/index.md)");
  expect(await markdown(f.prerequisite)).toBe(versionedBefore);
}, timeout);

test("publication observes the real remote instead of trusting cached upstream refs", async () => {
  const f = await fixture();
  const remote = path.join(f.directory, "remote.git");
  execFileSync("git", ["init", "--bare", "--quiet", remote]);
  execFileSync("git", ["-C", f.repository, "config", "user.name", "Migration test"]);
  execFileSync("git", ["-C", f.repository, "config", "user.email", "migration@example.test"]);
  execFileSync("git", ["-C", f.repository, "add", "-A"]);
  execFileSync("git", ["-C", f.repository, "commit", "--quiet", "-m", "Fixture before migration"]);
  execFileSync("git", ["-C", f.repository, "remote", "add", "publish", remote]);
  execFileSync("git", ["-C", f.repository, "push", "--quiet", "--set-upstream", "publish", "HEAD:main"]);
  const plan = await planned(f);
  await applyMigration(f, plan, true);
  execFileSync("git", ["-C", f.repository, "add", "-A"]);
  execFileSync("git", ["-C", f.repository, "commit", "--quiet", "-m", "Fixture migration"]);
  execFileSync("git", ["-C", f.repository, "update-ref", "refs/remotes/publish/main", "HEAD"]);
  const pending = await checkMigration(f, plan.id);
  expect(pending.publication).toMatchObject({ status: "committed", required: true });
  expect(pending.furtherWorkBlocked).toBe(true);
  execFileSync("git", ["-C", f.repository, "push", "--quiet", "publish", "HEAD:main"]);
  expect((await checkMigration(f, plan.id)).publication).toMatchObject({ status: "published", required: false });
}, timeout);

test("source Git blob provenance uses the Git root when the shared store is nested", async () => {
  const f = await fixture(true);
  await fs.unlink(f.spec);
  const specification = path.join(f.initiative, "spec.md");
  await markdown(specification, "---\nid: launch-spec\ntitle: Shared specification\n---\n# Shared spec\n");
  execFileSync("git", ["init", "--quiet", f.sharedContextBase]);
  execFileSync("git", ["-C", f.sharedContextBase, "add", "-A"]);
  execFileSync("git", ["-C", f.sharedContextBase, "-c", "user.name=Migration test", "-c", "user.email=migration@example.test", "commit", "--quiet", "-m", "Fixture shared store"]);
  const plan = await planMigration(f, { kind: "initiative-spec", id: "launch-spec" });
  const expected = execFileSync("git", ["-C", f.sharedContextBase, "rev-parse", `HEAD:${path.relative(f.sharedContextBase, specification)}`], { encoding: "utf8" }).trim();
  expect(plan.inputs.find((input) => input.path === specification)?.blob).toBe(expected);
}, timeout);

test("CLI failures retain the result envelope and identify the failed operation", async () => {
  const f = await fixture();
  let failure: Record<string, unknown> | undefined;
  try {
    execFileSync(cli, ["migrate", "apply", "--repository", f.repository], { encoding: "utf8" });
  } catch (error) {
    if (!error || typeof error !== "object" || !("stdout" in error)) throw error;
    failure = JSON.parse(String(error.stdout));
  }
  expect(failure).toMatchObject({
    schemaVersion: "tracker-result/v2", operation: "migrate apply", ok: false,
    initiatives: [], tickets: [], changes: null, publication: null, rendered: null,
    validation: { status: "failed" },
  });
}, timeout);

test("standalone ticket check works before the first initiative collection exists", async () => {
  const f = await fixture();
  const before = await markdown(f.child);
  const result = JSON.parse(execFileSync(cli, ["check", "--repository", f.repository, "--shared-context-base", f.sharedContextBase, "--ticket", "TASK-1"], { encoding: "utf8" }));
  expect(result.ok).toBe(true);
  expect(result.legacy).toBe(true);
  expect(result.tickets).toEqual([{ id: "TASK-1", title: "First task", ref: "records/issues/TASK-1.md", state: "claimed", blocked_by: ["TASK-2"] }]);
  expect(result.graph).toContain("TASK-1");
  expect(result.graph).toContain("TASK-2");
  expect(await fs.stat(path.dirname(f.initiative)).catch(() => null)).toBeNull();
  expect(await markdown(f.child)).toBe(before);
}, timeout);

// Build immutable v1 fixtures from the same reviewed semantics, including property
// order: historical plan IDs and event hashes used JSON.stringify, not sorted JSON.
async function historicalPlan(f: { repository: string; sharedContextBase: string }): Promise<MigrationPlan> {
  const current = await planned(f);
  const { schemaVersion, id, ...rest } = current;
  const changes = current.changes.map((entry) => {
    const after = entry.after.replace("schemaVersion: tracker-initiative/v2", "schema: tracker-initiative/v1").replace("schemaVersion: tracker-ticket/v2", "schema: tracker-ticket/v1");
    return { ...entry, after, afterHash: createHash("sha256").update(after).digest("hex") };
  });
  const core = { schema: "tracker-migration-plan/v1" as const, ...rest, routes: { ...rest.routes, workflow: { ...rest.routes.workflow, path: path.join(f.repository, "workflows/migration-plan"), ref: "workflows/migration-plan" } }, changes };
  const historicalId = createHash("sha256").update(JSON.stringify(core)).digest("hex").slice(0, 24);
  return { ...core, id: historicalId, routes: { ...core.routes, workflow: { ...core.routes.workflow, path: path.join(f.repository, `workflows/migration-${historicalId}`), ref: `workflows/migration-${historicalId}` } } };
}

test("unapplied v1 plans are verified but cannot create new historical record output", async () => {
  const f = await fixture();
  const plan = await historicalPlan(f);
  await expect(applyMigration(f, plan, true)).rejects.toThrow("new v2 plan");
  expect(await markdown(f.spec)).toBe(plan.changes[0]!.before);
  expect(await fs.stat(path.join(f.repository, `workflows/migration-${plan.id}`)).catch(() => null)).toBeNull();
}, timeout);

test("retained v1 plans and event hashes remain byte-identical on check and idempotent apply", async () => {
  const f = await fixture();
  const plan = await historicalPlan(f);
  const workflow = path.join(f.repository, `workflows/migration-${plan.id}`);
  const planFile = path.join(workflow, "artifacts/snapshots/migration-plan.json");
  const events = path.join(workflow, "events");
  await fs.mkdir(path.dirname(planFile), { recursive: true });
  await fs.mkdir(events, { recursive: true });
  const planText = JSON.stringify(plan, null, 4) + "\n";
  await fs.writeFile(planFile, planText);
  for (const entry of plan.changes) {
    await markdown(entry.newPath, entry.after);
    if (entry.oldPath !== entry.newPath) await fs.unlink(entry.oldPath);
  }
  const applying = { schema: "tracker-migration/v1", migration: plan.id, sequence: 1, previousHash: null, state: "applying", planHash: createHash("sha256").update(JSON.stringify(plan)).digest("hex"), at: "2026-01-01T00:00:00.000Z" };
  const applied = { ...applying, sequence: 2, previousHash: createHash("sha256").update(JSON.stringify(applying)).digest("hex"), state: "applied" };
  const first = JSON.stringify(applying, null, 4) + "\n";
  const last = JSON.stringify(applied, null, 4) + "\n";
  await fs.writeFile(path.join(events, "000001-migration.json"), first);
  await fs.writeFile(path.join(events, "000002-migration.json"), last);
  expect((await checkMigration(f, plan.id)).contentVerified).toBe(true);
  expect(await applyMigration(f, plan, true)).toMatchObject({ schemaVersion: "tracker-result/v2", idempotent: true, membershipVerified: true });
  expect(await fs.readFile(planFile, "utf8")).toBe(planText);
  expect(await fs.readFile(path.join(events, "000001-migration.json"), "utf8")).toBe(first);
  expect(await fs.readFile(path.join(events, "000002-migration.json"), "utf8")).toBe(last);
  expect((await fs.readdir(events)).sort()).toEqual(["000001-migration.json", "000002-migration.json"]);
}, timeout);

test("unknown and dual migration identities reject without record writes", async () => {
  const f = await fixture();
  const plan = await planned(f);
  for (const altered of [{ ...plan, schema: "tracker-migration-plan/v1" }, { ...plan, schemaVersion: "tracker-migration-plan/v99" }]) {
    await expect(applyMigration(f, altered as MigrationPlan, true)).rejects.toThrow("malformed migration plan");
    expect(await markdown(f.spec)).toBe(plan.changes[0]!.before);
  }
  expect(await fs.stat(path.join(f.repository, `workflows/migration-${plan.id}`)).catch(() => null)).toBeNull();
}, timeout);

function commandResult(args: string[]): Record<string, any> {
  try { return JSON.parse(execFileSync(cli, args, { encoding: "utf8" })); }
  catch (error) {
    if (!error || typeof error !== "object" || !("stdout" in error)) throw error;
    return JSON.parse(String(error.stdout));
  }
}

test("actual update upgrades a v1 ticket before mutation while preserving blockers and authored bytes", async () => {
  const f = await fixture();
  await markdown(f.child, f.childText.replace("---\n", "---\nschema: tracker-ticket/v1\n") + "\n<!-- authored child comment -->\n");
  const before = recordDocument(f.child);
  const request = path.join(f.directory, "update.json");
  await fs.writeFile(request, JSON.stringify({ fields: { title: "Reviewed title", triage: "ready-for-agent" } }));
  const result = commandResult(["update", "--repository", f.repository, "--shared-context-base", f.sharedContextBase, "--ticket", "TASK-1", "--request", request]);
  expect(result).toMatchObject({ schemaVersion: "tracker-result/v2", ok: true, upgrade: { changed: true, from: "tracker-ticket/v1", to: "tracker-ticket/v2" } });
  const after = recordDocument(f.child);
  const { schema, ...retained } = before.frontmatter;
  expect(after.frontmatter).toEqual({ ...retained, schemaVersion: "tracker-ticket/v2", title: "Reviewed title", triage: "ready-for-agent" });
  expect(after.body).toBe(before.body);
  expect(result.tickets[0]).toMatchObject({ id: "TASK-1", state: "claimed", blocked_by: ["TASK-2"] });
}, timeout);

test("actual initiative update retains authored specification and direct child membership", async () => {
  const f = await fixture();
  const index = path.join(f.initiative, "index.md");
  await markdown(index, "---\nschema: tracker-initiative/v1\nid: launch-spec\ntitle: Launch\ntype: Initiative\ncustom: retain\n---\n# Authored specification\n\n<!-- preserve -->\n\n## Tickets\n\n- [First](../../issues/TASK-1.md)\n- [Second](../../issues/TASK-2.md)\n");
  const before = recordDocument(index);
  const request = path.join(f.directory, "initiative-update.json");
  await fs.writeFile(request, JSON.stringify({ fields: { title: "Reviewed launch" } }));
  const result = commandResult(["update", "--repository", f.repository, "--shared-context-base", f.sharedContextBase, "--initiative", "launch-spec", "--request", request]);
  expect(result).toMatchObject({ ok: true, initiatives: [{ id: "launch-spec", title: "Reviewed launch", children: [{ id: "TASK-1", ref: "records/issues/TASK-1.md" }, { id: "TASK-2", ref: "records/issues/TASK-2.md" }] }] });
  const after = recordDocument(index);
  expect(after.body).toBe(before.body);
  expect(after.frontmatter).toMatchObject({ schemaVersion: "tracker-initiative/v2", custom: "retain" });
  expect(await markdown(f.child)).toBe(f.childText);
}, timeout);

test("actual bulk upgrade reports partial persistence and leaves unsupported inputs byte-identical", async () => {
  const f = await fixture();
  await markdown(f.child, f.childText.replace("---\n", "---\nschema: tracker-ticket/v1\n"));
  await markdown(f.prerequisite, (await markdown(f.prerequisite)).replace("---\n", "---\nschemaVersion: tracker-ticket/v99\n"));
  const unknownBefore = await markdown(f.prerequisite);
  const bodyBefore = recordDocument(f.child).body;
  const list = path.join(f.directory, "artifacts.json");
  await fs.writeFile(list, JSON.stringify([f.child, f.prerequisite]));
  const args = ["upgrade", "--repository", f.repository, "--shared-context-base", f.sharedContextBase, "--artifacts", list];
  const result = commandResult(args);
  expect(result).toMatchObject({ schemaVersion: "tracker-result/v2", ok: false, upgrade: { status: "partial", results: [{ artifact: f.child, changed: true, status: "completed" }, { artifact: f.prerequisite, changed: false, status: "failed" }] } });
  expect(recordDocument(f.child).frontmatter).toMatchObject({ schemaVersion: "tracker-ticket/v2", id: "TASK-1", parent: "launch-spec", blocked_by: ["TASK-2"] });
  expect(recordDocument(f.child).body).toBe(bodyBefore);
  expect(await markdown(f.prerequisite)).toBe(unknownBefore);
  const currentBefore = await markdown(f.child);
  await fs.writeFile(list, JSON.stringify([f.child]));
  expect(commandResult(args)).toMatchObject({ ok: true, changes: null, upgrade: { status: "completed", results: [{ changed: false }] } });
  expect(await markdown(f.child)).toBe(currentBefore);
}, timeout);

test("structural mutations and immutable bulk paths reject without changing records", async () => {
  const f = await fixture();
  const request = path.join(f.directory, "unsafe.json");
  const before = await markdown(f.child);
  await fs.writeFile(request, JSON.stringify({ fields: { parent: "other", blocked_by: [] } }));
  expect(commandResult(["update", "--repository", f.repository, "--shared-context-base", f.sharedContextBase, "--ticket", "TASK-1", "--request", request]).ok).toBe(false);
  expect(await markdown(f.child)).toBe(before);
  const list = path.join(f.directory, "unsafe-artifacts.json");
  const eventBefore = await markdown(f.event);
  await fs.writeFile(list, JSON.stringify([f.child, f.event]));
  expect(commandResult(["upgrade", "--repository", f.repository, "--shared-context-base", f.sharedContextBase, "--artifacts", list]).ok).toBe(false);
  expect(await markdown(f.child)).toBe(before);
  expect(await markdown(f.event)).toBe(eventBefore);
}, timeout);

test("membership projection rejects before mutation and bulk retains independent outcomes", async () => {
  const f = await fixture();
  const index = path.join(f.initiative, "index.md");
  const invalid = "---\nschema: tracker-initiative/v1\nid: launch-spec\ntitle: Launch\n---\n## Tickets\n\n[Missing](../../issues/missing.md)\n";
  await markdown(index, invalid);
  const request = path.join(f.directory, "update.json");
  await fs.writeFile(request, JSON.stringify({ fields: { title: "Changed launch" } }));
  const flags = ["--repository", f.repository, "--shared-context-base", f.sharedContextBase];
  expect(commandResult(["update", ...flags, "--initiative", "launch-spec", "--request", request]).ok).toBe(false);
  expect(await markdown(index)).toBe(invalid);
  const list = path.join(f.directory, "selected.json");
  const independent = path.join(f.issues, "independent.md");
  await markdown(independent, "---\nschema: tracker-ticket/v1\nid: independent\ntitle: Independent\nwork_status: unclaimed\nblocked_by: []\n---\n");
  await fs.writeFile(list, JSON.stringify([independent, index]));
  const result = commandResult(["upgrade", ...flags, "--artifacts", list]);
  expect(result).toMatchObject({ ok: false, upgrade: { status: "partial", results: [{ changed: true, status: "completed" }, { changed: false, status: "failed" }] } });
  expect(await markdown(index)).toBe(invalid);
  expect(recordDocument(independent).frontmatter.schemaVersion).toBe("tracker-ticket/v2");
}, timeout);

test("selected record kind and complete initiative membership are validated before writes", async () => {
  const f = await fixture();
  const flags = ["--repository", f.repository, "--shared-context-base", f.sharedContextBase];
  const request = path.join(f.directory, "update.json");
  await fs.writeFile(request, JSON.stringify({ fields: { title: "Changed title" } }));
  const wrongKind = "---\nschema: tracker-initiative/v1\nid: TASK-1\ntitle: Wrong kind\n---\n## Tickets\n";
  await markdown(f.child, wrongKind);
  expect(commandResult(["update", ...flags, "--ticket", "TASK-1", "--request", request]).ok).toBe(false);
  expect(await markdown(f.child)).toBe(wrongKind);
  const list = path.join(f.directory, "selected.json");
  await fs.writeFile(list, JSON.stringify([f.child, f.prerequisite]));
  expect(commandResult(["upgrade", ...flags, "--artifacts", list])).toMatchObject({ ok: false, upgrade: { status: "partial", results: [{ status: "failed", changed: false }, { status: "completed", changed: true }] } });
  expect(await markdown(f.child)).toBe(wrongKind);
  await markdown(f.child, f.childText);
  const index = path.join(f.initiative, "index.md");
  const incomplete = "---\nschema: tracker-initiative/v1\nid: launch-spec\ntitle: Launch\n---\n## Tickets\n";
  await markdown(index, incomplete);
  expect(commandResult(["update", ...flags, "--initiative", "launch-spec", "--request", request]).ok).toBe(false);
  expect(await markdown(index)).toBe(incomplete);
  await fs.writeFile(list, JSON.stringify([index]));
  expect(commandResult(["upgrade", ...flags, "--artifacts", list])).toMatchObject({ ok: false, upgrade: { results: [{ status: "failed", changed: false }] } });
  expect(await markdown(index)).toBe(incomplete);
}, timeout);

test("initiative scalar mutation cannot add ticket triage metadata", async () => {
  const f = await fixture();
  const index = path.join(f.initiative, "index.md");
  const original = "---\nschema: tracker-initiative/v1\nid: launch-spec\ntitle: Launch\n---\n## Tickets\n\n- [First](../../issues/TASK-1.md)\n- [Second](../../issues/TASK-2.md)\n";
  await markdown(index, original);
  const request = path.join(f.directory, "update.json");
  await fs.writeFile(request, JSON.stringify({ fields: { triage: "ready-for-agent" } }));
  expect(commandResult(["update", "--repository", f.repository, "--shared-context-base", f.sharedContextBase, "--initiative", "launch-spec", "--request", request]).ok).toBe(false);
  expect(await markdown(index)).toBe(original);
}, timeout);

test("ticket update and bulk reject incomplete direct parent membership before persistence", async () => {
  const f = await fixture();
  const flags = ["--repository", f.repository, "--shared-context-base", f.sharedContextBase];
  const index = path.join(f.initiative, "index.md");
  await markdown(index, "---\nschema: tracker-initiative/v1\nid: launch-spec\ntitle: Launch\n---\n## Tickets\n\n- [Second](../../issues/TASK-2.md)\n");
  await markdown(f.child, f.childText.replace("---\n", "---\nschema: tracker-ticket/v1\n"));
  const before = await markdown(f.child);
  const indexBefore = await markdown(index);
  const request = path.join(f.directory, "update.json");
  await fs.writeFile(request, JSON.stringify({ fields: { title: "Changed" } }));
  expect(commandResult(["update", ...flags, "--ticket", "TASK-1", "--request", request]).ok).toBe(false);
  expect(await markdown(f.child)).toBe(before);
  const independent = path.join(f.issues, "independent.md");
  await markdown(independent, "---\nschema: tracker-ticket/v1\nid: independent\ntitle: Independent\nwork_status: unclaimed\nblocked_by: []\n---\n");
  const list = path.join(f.directory, "selected.json");
  await fs.writeFile(list, JSON.stringify([f.child, independent]));
  expect(commandResult(["upgrade", ...flags, "--artifacts", list])).toMatchObject({
    ok: false, upgrade: { status: "partial", results: [{ status: "failed", changed: false }, { status: "completed", changed: true }] },
  });
  expect(await markdown(f.child)).toBe(before);
  expect(await markdown(index)).toBe(indexBefore);
  expect(recordDocument(independent).frontmatter.schemaVersion).toBe("tracker-ticket/v2");
}, timeout);

test("ticket updates support direct and hierarchical membership without changing parent records", async () => {
  const f = await fixture();
  const flags = ["--repository", f.repository, "--shared-context-base", f.sharedContextBase];
  const index = path.join(f.initiative, "index.md");
  await markdown(index, "---\nschema: tracker-initiative/v1\nid: launch-spec\ntitle: Launch\n---\n## Tickets\n\n- [First](../../issues/TASK-1.md)\n- [Second](../../issues/TASK-2.md)\n");
  const nested = path.join(f.issues, "nested.md");
  await markdown(nested, "---\nschema: tracker-ticket/v1\nid: nested\ntitle: Nested\nparent: TASK-1\nwork_status: unclaimed\nblocked_by: []\n---\n<!-- retain -->\n");
  const indexBefore = await markdown(index);
  const request = path.join(f.directory, "update.json");
  await fs.writeFile(request, JSON.stringify({ fields: { title: "Changed" } }));
  for (const id of ["TASK-1", "nested"]) {
    expect(commandResult(["update", ...flags, "--ticket", id, "--request", request]).ok).toBe(true);
  }
  expect(recordDocument(nested).frontmatter).toMatchObject({ schemaVersion: "tracker-ticket/v2", parent: "TASK-1", title: "Changed" });
  expect(recordDocument(nested).body).toContain("<!-- retain -->");
  expect(await markdown(index)).toBe(indexBefore);
}, timeout);
