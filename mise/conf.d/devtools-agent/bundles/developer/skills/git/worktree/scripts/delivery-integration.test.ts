// Exercises actual operation CLIs, retained transport files and authoritative YAML in isolated repositories.
import { afterEach, expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rename, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("../../../../../", import.meta.url));
const records = join(root, "matt-pocock/skills/reading-and-writing-tickets/scripts/records.ts");
const delivery = join(root, "agent-core/skills/result-delivery/scripts/router.ts");
const contextCli = join(root, "agent-core/skills/shared-context/scripts/shared-context/cli.ts");
const writer = fileURLToPath(new URL("./write-result.ts", import.meta.url));
const temporary: string[] = [];
const inspector = fileURLToPath(new URL("./inspect.ts", import.meta.url));
afterEach(async () => { await Promise.all(temporary.splice(0).map((directory) => rm(directory, { recursive: true, force: true }))); });

async function run(command: string, args: string[], env: Record<string, string | undefined> = {}, cwd = tmpdir()) {
  const child = Bun.spawn([command, ...args], { cwd, env: { ...process.env, RESULT_DELIVERY_CONTEXT: undefined, MUXER_SUBAGENT_ROLE: undefined, MUXER_SUBAGENT_RUN_ID: undefined, MUXER_SUBAGENT_PARENT_RUN_ID: undefined, ...env }, stdout: "pipe", stderr: "pipe" });
  const [stdout, stderr, code] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
  return { stdout, stderr, code };
}

// Existing publication scenarios now prepare phase context instead of copying an envelope to the writer.
async function publishPhase(receipt: Record<string, unknown>, input: string, repository: string, env: Record<string, string | undefined> = {}, parent = false, cwd = tmpdir()) {
  const { schema, schemaVersion, receipt_id, workflow_id, event, phase, attempt, parent_receipt, worktree, workspace_path: _workspace, source_branch, base_branch, source_commit, source_tree, repository: _repository, ticket, ticket_ref: _ticketRef, workflow: _workflow, muxer, agent, pane_id, session_id, ...outcome } = receipt;
  const context = {
    ...(schemaVersion ? { schemaVersion: "worktree-phase-context/v2" } : { schema: "worktree-phase-context/v1" }), receipt_schema: schemaVersion ?? schema, receipt_id, workflow_id, event, phase, attempt, parent_receipt, ticket,
    source: { worktree, branch: source_branch, base_branch, commit: source_commit, tree: source_tree },
    session: { muxer, agent, pane_id, session_id, run_id: "integration-run", operation_id: env.RESULT_DELIVERY_CONTEXT ? JSON.parse(await readFile(env.RESULT_DELIVERY_CONTEXT, "utf8")).operationId : undefined },
  };
  await writeFile(input + ".phase.json", JSON.stringify(context));
  await writeFile(input, JSON.stringify(outcome));
  return run(writer, [...(parent ? ["--parent-event"] : []), "--repository", repository, "--phase-context", input + ".phase.json", "--input", input], env, cwd);
}
async function fixture(retained = true) {
  const directory = await mkdtemp(join(tmpdir(), "delivery-workflow-"));
  temporary.push(directory);
  const repository = join(directory, "repository");
  await mkdir(repository);
  execFileSync("git", ["init", "--quiet", "--initial-branch=main", repository]);
  execFileSync("git", ["-C", repository, "remote", "add", "origin", "https://github.com/result-delivery-tests/" + crypto.randomUUID() + ".git"]);
  execFileSync("git", ["-C", repository, "-c", "user.name=Delivery Tests", "-c", "user.email=delivery@example.invalid", "-c", "commit.gpgsign=false", "-c", "core.hooksPath=/dev/null", "commit", "--quiet", "--allow-empty", "-m", "test: seed isolated repository"]);
  async function markdown(relative: string, fields: Record<string, unknown>, body: string) {
    const destination = join(repository, relative);
    const query = 'import "github.com/harehare/okf.mq" | okf::okf_stringify(' + JSON.stringify({ frontmatter: fields, body }) + ')';
    const text = execFileSync("mq", ["--allow-http-import", "--no-lockfile", "-I", "null", "-F", "text", query], { encoding: "utf8" });
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, text);
  }
  await markdown("docs/agents/issue-tracker.md", { backend: "local-markdown", "issue-root": "tracker/tickets", "initiative-root": "tracker/initiatives" }, "# Tracker\n");
  await mkdir(join(repository, "tracker/tickets"), { recursive: true });
  await markdown("tracker/tickets/TASK-1.md", { schema: "tracker-ticket/v1", id: "TASK-1", title: "Validate receipt", work_status: "claimed", blocked_by: [] }, "# Validate receipt\n");
  await markdown("tracker/initiatives/check/index.md", { schema: "tracker-initiative/v1", id: "check", title: "Check delivery" }, "# Check delivery\n\n## Tickets\n");
  const resolved = await run(contextCli, ["resolve", "workflow", "--id", "TASK-1", "--json"], {}, repository);
  if (resolved.code !== 0) throw new Error(resolved.stderr);
  const workflow = JSON.parse(resolved.stdout);
  const commit = execFileSync("git", ["-C", repository, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  const tree = execFileSync("git", ["-C", repository, "rev-parse", "HEAD^{tree}"], { encoding: "utf8" }).trim();
  async function context(schema: string, operationId: string) {
    const file = join(directory, operationId + ".context.json");
    const target = join(directory, operationId + ".result.json");
    await writeFile(file, JSON.stringify({ schemaVersion: "result-delivery/v2", kind: "context", audience: "agent", mode: "artifact-reference", runId: "integration-run", operationId, target: { path: target, ref: pathToFileURL(target).href, schema } }));
    return { file, target };
  }
  const receipt: Record<string, unknown> = { schema: "worktree-receipt/v1", event: "phase-result", receipt_id: "implementation-0002", workflow_id: "TASK-1", phase: "implementation", attempt: 1, parent_receipt: "start-0001", repository, worktree: repository, source_branch: "main", base_branch: "main", source_commit: commit, source_tree: tree, created_at: new Date().toISOString(), muxer: "tmux", workspace_path: repository, pane_id: "test-pane", agent: "omp", session_id: "test-session", ticket: { backend: "local-markdown", id: "TASK-1", ref: "tracker/tickets/TASK-1.md" }, workflow: { store: workflow.store, root: workflow.root, ref: workflow.ref }, ticket_ref: "tracker/tickets/TASK-1.md", inputs: [{ kind: "receipt", ref: "start-0001" }], outputs: [{ kind: "receipt", ref: "implementation-0002" }], status: "completed", changed_files: [], validation: [{ command: "smoke", result: "passed" }], summary: "Checked the delivery workflow", open_questions: [] };
  if (retained) {
    await mkdir(join(workflow.path, "events"), { recursive: true });
    await writeFile(join(workflow.path, "events/start-0001.yaml"), Bun.YAML.stringify({ ...receipt, receipt_id: "start-0001", event: "phase-start", phase: "start", status: "started", parent_receipt: null }));
  }
  return { directory, repository, workflow, receipt, context };
}

test("ticket CLI keeps machine JSON and gives humans a summary without losing a required handoff", async () => {
  const f = await fixture();
  const flags = ["check", "--repository", f.repository, "--initiative", "check"];
  const machine = await run(records, flags);
  expect(machine.code).toBe(0);
  expect(JSON.parse(machine.stdout).initiatives[0].ref).toBe("tracker/initiatives/check/index.md");
  const human = await run(records, [...flags, "--format", "human"]);
  expect(human.code).toBe(0);
  expect(human.stdout).toContain("tracker/initiatives/check/index.md");
  expect(human.stdout.trim().startsWith("{")).toBe(false);
  const context = await f.context("tracker-result/v2", "ticket-check");
  const delegated = await run(records, [...flags, "--deliver", "--format", "human"], { RESULT_DELIVERY_CONTEXT: context.file });
  expect(delegated.code).toBe(0);
  expect(JSON.parse(delegated.stdout).kind).toBe("reference");
  const reread = await run(delivery, ["read", "--context", context.file]);
  expect(reread.code).toBe(0);
  expect(JSON.parse(reread.stdout).validation.status).toBe("passed");
}, 120_000);

test("phase writer publishes authoritative YAML and a verifiable result in one operation", async () => {
  const f = await fixture();
  const context = await f.context("worktree-receipt/v1", "phase-result");
  const input = join(f.directory, "receipt.json");
  await writeFile(input, JSON.stringify(f.receipt));
  const parentPath = join(f.workflow.path, "events/start-0001.yaml");
  const retained = await readFile(parentPath, "utf8");
  await rm(parentPath);
  const unassigned = await run(writer, ["--repository", f.repository, "--input", input], { RESULT_DELIVERY_CONTEXT: context.file });
  expect(unassigned.code).not.toBe(0);
  expect(unassigned.stderr).toContain("requires --phase-context");
  expect(await Bun.file(context.target).exists()).toBe(false);
  expect(await Bun.file(join(f.workflow.path, "events/implementation-0002.yaml")).exists()).toBe(false);
  await writeFile(parentPath, retained);
  await writeFile(input, JSON.stringify({ ...f.receipt, session_id: "invented-session" }));
  const wrongSession = await run(writer, ["--repository", f.repository, "--input", input], { RESULT_DELIVERY_CONTEXT: context.file });
  expect(wrongSession.code).not.toBe(0);
  expect(wrongSession.stderr).toContain("differs from retained phase identity");
  await writeFile(input, JSON.stringify(f.receipt));
  execFileSync("git", ["-C", f.repository, "switch", "--quiet", "-c", "wrong-branch"]);
  expect(execFileSync("git", ["-C", f.repository, "rev-parse", "HEAD", "HEAD^{tree}"], { encoding: "utf8" }).trim().split("\n")).toEqual([f.receipt.source_commit as string, f.receipt.source_tree as string]);
  const wrongBranch = await run(writer, ["--repository", f.repository, "--input", input], { RESULT_DELIVERY_CONTEXT: context.file });
  expect(wrongBranch.code).not.toBe(0);
  expect(await Bun.file(join(f.workflow.path, "events/implementation-0002.yaml")).exists()).toBe(false);
  expect(await Bun.file(context.target).exists()).toBe(false);
  expect(await readFile(parentPath, "utf8")).toBe(retained);
  execFileSync("git", ["-C", f.repository, "switch", "--quiet", "main"]);
  const result = await run(writer, ["--repository", f.repository, "--input", input], { RESULT_DELIVERY_CONTEXT: context.file });
  expect(result.code).toBe(0);
  const reference = JSON.parse(result.stdout);
  expect(reference.kind).toBe("reference");
  const event = join(f.workflow.path, "events/implementation-0002.yaml");
  const source = await readFile(event, "utf8");
  expect(Bun.YAML.parse(source)).toEqual(f.receipt);
  const reread = await run(delivery, ["read", "--context", context.file]);
  expect(reread.code).toBe(0);
  expect(JSON.parse(reread.stdout)).toEqual(f.receipt);
  const ack = await run(delivery, ["ack", "--context", context.file, "--sha256", reference.sha256]);
  expect(ack.code).toBe(0);
  expect(await readFile(event, "utf8")).toBe(source);
  const duplicate = await run(writer, ["--repository", f.repository, "--input", input], { RESULT_DELIVERY_CONTEXT: context.file });
  expect(duplicate.code).not.toBe(0);
  expect(await readFile(event, "utf8")).toBe(source);
}, 120_000);

test("phase writer accepts a shared store alias without following event-directory symlinks", async () => {
  const f = await fixture(false);
  const home = join(f.directory, "home");
  const shared = join(f.directory, "shared");
  const alias = join(f.directory, "shared-alias");
  await mkdir(shared);
  await symlink(shared, alias);
  await mkdir(join(home, ".config/shared-agent-context"), { recursive: true });
  await writeFile(join(home, ".config/shared-agent-context/config.json"), JSON.stringify({ storage_path: alias }));
  const env = {
    HOME: home,
    MISE_DATA_DIR: process.env.MISE_DATA_DIR ?? join(process.env.HOME!, ".local/share/mise"),
    MISE_CONFIG_DIR: process.env.MISE_CONFIG_DIR ?? join(process.env.HOME!, ".config/mise"),
  };
  const routes = ["schema = 2"];
  for (const kind of ["alignment", "tickets", "initiatives", "workflows", "evidence", "sources"]) {
    const adapter = kind === "tickets" ? "local-markdown" : ["alignment", "initiatives"].includes(kind) ? "markdown" : "files";
    routes.push(`[records.${kind}]`, `adapter = "${adapter}"`, `store = "${kind === "workflows" ? "shared" : "repository"}"`);
  }
  await writeFile(join(f.repository, ".context-routes.toml"), routes.join("\n"));
  const resolved = await run(contextCli, ["resolve", "workflow", "--id", "TASK-1", "--json"], env, f.repository);
  expect(resolved.stderr).toBe("");
  expect(resolved.code).toBe(0);
  const workflow = JSON.parse(resolved.stdout);
  expect(workflow.store).toBe("shared");
  expect(workflow.root.startsWith(alias + "/")).toBe(true);
  const receipt = {
    ...f.receipt, schema: undefined, schemaVersion: "worktree-receipt/v3", receipt_id: "start-0001",
    phase: "start", event: "phase-start", status: "started", parent_receipt: null, pane_id: null,
    workflow: { store: workflow.store, root: workflow.root, ref: workflow.ref },
  };
  const input = join(f.directory, "aliased-receipt.json");
  await writeFile(input, JSON.stringify(receipt));
  const result = await publishPhase(receipt, input, f.repository, env, true);
  expect(result.stderr).toBe("");
  expect(result.code).toBe(0);
  const events = join(workflow.path, "events");
  const event = join(events, "start-0001.yaml");
  const bytes = await readFile(event, "utf8");
  expect(Bun.YAML.parse(bytes)).toEqual(receipt);
  const duplicate = await publishPhase(receipt, input, f.repository, env, true);
  expect(duplicate.code).not.toBe(0);
  expect(await readFile(event, "utf8")).toBe(bytes);

  const outside = join(f.directory, "outside");
  await mkdir(outside);
  await rename(events, join(workflow.path, "retained-events"));
  await symlink(outside, events);
  await writeFile(input, JSON.stringify({ ...receipt, receipt_id: "start-0002" }));
  const escaped = await publishPhase({ ...receipt, receipt_id: "start-0002" }, input, f.repository, env, true);
  expect(escaped.code).not.toBe(0);
  expect(await Bun.file(join(outside, "start-0002.yaml")).exists()).toBe(false);
}, 120_000);

test("v2 child delivery and parent checkpoints use separate immutable result boundaries", async () => {
  const f = await fixture(false);
  const context = await f.context("worktree-receipt/v2", "v2-result");
  const input = join(f.directory, "v2.json");
  const isolatedConfig = join(f.directory, "wt.toml");
  await writeFile(isolatedConfig, "");
  const created = await run("wt", ["--config", isolatedConfig, "-C", f.repository, "switch", "--create", "feature/TASK-1", "--base", "main", "--no-cd", "--no-hooks"]);
  expect(created.code).toBe(0);
  const listed = await run("wt", ["--config", isolatedConfig, "-C", f.repository, "list", "--format=json"]);
  const inventory = JSON.parse(listed.stdout);
  const row = (Array.isArray(inventory) ? inventory : inventory.items).find((item: { branch: string }) => item.branch === "feature/TASK-1");
  const source = row.worktree?.path ?? row.path;
  const child: Record<string, unknown> = { ...f.receipt, schema: "worktree-receipt/v2", worktree: source, workspace_path: source, source_branch: "feature/TASK-1" };
  const start = { ...child, receipt_id: "start-0001", parent_receipt: null, phase: "start", event: "phase-start", status: "started", pane_id: null };
  await mkdir(join(f.workflow.path, "events"), { recursive: true });
  await writeFile(join(f.workflow.path, "events/start-0001.yaml"), Bun.YAML.stringify(start));
  await writeFile(input, JSON.stringify({ ...child, worktree: f.repository, workspace_path: f.repository }));
  const dirtying = await publishPhase({ ...child, worktree: f.repository, workspace_path: f.repository }, input, f.repository, { RESULT_DELIVERY_CONTEXT: context.file });
  expect(dirtying.code).not.toBe(0);
  expect(dirtying.stderr).toContain("does not match its parent");
  await writeFile(input, JSON.stringify({ ...child, source_branch: "feature/OTHER" }));
  const wrongBranch = await publishPhase({ ...child, source_branch: "feature/OTHER" }, input, f.repository, { RESULT_DELIVERY_CONTEXT: context.file });
  expect(wrongBranch.code).not.toBe(0);
  expect(wrongBranch.stderr).toContain("does not match its parent");
  await writeFile(input, JSON.stringify(child));
  const orphan = await publishPhase({ ...child, parent_receipt: "absent" }, input, f.repository, { RESULT_DELIVERY_CONTEXT: context.file });
  expect(orphan.code).not.toBe(0);
  expect(await Bun.file(context.target).exists()).toBe(false);
  expect(await Bun.file(join(f.workflow.path, "events/implementation-0002.yaml")).exists()).toBe(false);
  await writeFile(input, JSON.stringify(child));
  const result = await publishPhase(child, input, f.repository, { RESULT_DELIVERY_CONTEXT: context.file });
  expect(result.code).toBe(0);
  expect((await run("git", ["-C", source, "status", "--porcelain=v1"])).stdout).toBe("");
  const delivered = await readFile(context.target, "utf8");
  const parent = { ...child, receipt_id: "parent-complete-0003", event: "phase-complete", parent_receipt: child.receipt_id, pane_id: null };
  const alternate = await run("git", ["-C", f.repository, "-c", "user.name=Delivery Tests", "-c", "user.email=delivery@example.invalid", "commit-tree", String(child.source_tree), "-p", String(child.source_commit), "-m", "Alternate source"]);
  expect(alternate.code).toBe(0);
  for (const invalid of [
    { ...parent, source_commit: alternate.stdout.trim() },
    { ...parent, created_at: new Date(Date.parse(String(child.created_at)) - 1_000).toISOString() },
    { ...parent, parent_receipt: start.receipt_id },
  ]) {
    await writeFile(input, JSON.stringify(invalid));
    expect((await publishPhase(invalid, input, f.repository, {}, true)).code).not.toBe(0);
    expect(await Bun.file(join(f.workflow.path, "events/parent-complete-0003.yaml")).exists()).toBe(false);
    expect(await readFile(context.target, "utf8")).toBe(delivered);
  }
  await writeFile(input, JSON.stringify(parent));
  const completed = await publishPhase(parent, input, f.repository, { RESULT_DELIVERY_CONTEXT: context.file }, true);
  expect(completed.code).toBe(0);
  expect(Bun.YAML.parse(await readFile(join(f.workflow.path, "events/parent-complete-0003.yaml"), "utf8"))).toEqual(parent);
  expect(await readFile(context.target, "utf8")).toBe(delivered);
  const duplicate = await publishPhase(parent, input, f.repository, {}, true);
  expect(duplicate.code).not.toBe(0);
  await writeFile(input, JSON.stringify({ ...parent, receipt_id: "missing-parent", parent_receipt: "absent" }));
  const missing = await publishPhase({ ...parent, receipt_id: "missing-parent", parent_receipt: "absent" }, input, f.repository, {}, true);
  expect(missing.code).not.toBe(0);
}, 120_000);

test.each(["mismatch", "relative", "subdirectory"])("writer and inspector reject %s source paths without changing prior events", async (invalid) => {
  const f = await fixture();
  const context = await f.context("worktree-receipt/v1", "invalid-source");
  const events = join(f.workflow.path, "events");
  await mkdir(events, { recursive: true });
  const start = { ...f.receipt, receipt_id: "start-0001", event: "phase-start", phase: "start", status: "started", parent_receipt: null };
  const prior = Bun.YAML.stringify(start);
  const startPath = join(events, "start-0001.yaml");
  await writeFile(startPath, prior);
  const nested = join(f.repository, "nested");
  await mkdir(nested);
  const receipt = { ...f.receipt, ...(invalid === "mismatch" ? { workspace_path: nested } : invalid === "relative" ? { worktree: ".", workspace_path: "." } : { worktree: nested, workspace_path: nested }) };
  const input = join(f.directory, "invalid.json");
  await writeFile(input, JSON.stringify(receipt));
  const rejected = await run(writer, ["--repository", f.repository, "--input", input], { RESULT_DELIVERY_CONTEXT: context.file });
  expect(rejected.code).not.toBe(0);
  expect(rejected.stderr).toContain(invalid === "subdirectory" ? "worktree root" : "same absolute worktree");
  expect(await Bun.file(join(events, "implementation-0002.yaml")).exists()).toBe(false);
  expect(await Bun.file(context.target).exists()).toBe(false);
  expect(await readFile(startPath, "utf8")).toBe(prior);
  const invalidPath = join(events, "implementation-0002.yaml");
  const invalidBytes = Bun.YAML.stringify(receipt);
  await writeFile(invalidPath, invalidBytes);
  const inspected = await run(inspector, [String(f.receipt.ticket_ref), "--json"], {}, f.repository);
  expect(inspected.code).toBe(0);
  const workflow = JSON.parse(inspected.stdout).workflow;
  expect(workflow.inspection.historyValid).toBe(false);
  expect(workflow.events.find((event: { ref: string }) => event.ref.endsWith("implementation-0002.yaml")).error).toContain(invalid === "subdirectory" ? "worktree root" : "same absolute worktree");
  expect(await readFile(invalidPath, "utf8")).toBe(invalidBytes);
  expect(await readFile(startPath, "utf8")).toBe(prior);
}, 120_000);

test("a published valid receipt passes actual CLI inspection", async () => {
  const f = await fixture();
  const events = join(f.workflow.path, "events");
  await mkdir(events, { recursive: true });
  await writeFile(join(events, "start-0001.yaml"), Bun.YAML.stringify({ ...f.receipt, receipt_id: "start-0001", event: "phase-start", phase: "start", status: "started", parent_receipt: null }));
  const input = join(f.directory, "valid.json");
  await writeFile(input, JSON.stringify(f.receipt));
  const published = await run(writer, ["--repository", f.repository, "--input", input]);
  expect(published.code).toBe(0);
  const inspected = await run(inspector, [String(f.receipt.ticket_ref), "--json"], {}, f.repository);
  expect(inspected.code).toBe(0);
  const workflow = JSON.parse(inspected.stdout).workflow;
  expect(workflow.inspection.historyValid).toBe(true);
  expect(workflow.receipts.find((receipt: { id: string }) => receipt.id === "implementation-0002")).toMatchObject({ workspacePath: f.repository, sourceCommit: f.receipt.source_commit });
}, 120_000);

test("generated v2 publication continues inspected retained source-root history and rejects foreign workflow identity", async () => {
  const f = await fixture(false);
  const source = join(f.directory, "source");
  execFileSync("git", ["-C", f.repository, "worktree", "add", "--quiet", "-b", "feature/TASK-1", source]);
  const child = { ...f.receipt, schema: "worktree-receipt/v2", worktree: source, workspace_path: source, source_branch: "feature/TASK-1" };
  const parent = {
    ...child, receipt_id: "start-0001", parent_receipt: null,
    phase: "start", event: "phase-start", status: "started",
    workflow: { store: "repository", root: source, ref: f.workflow.ref },
  };
  const parentPath = join(f.workflow.path, "events/start-0001.yaml");
  await mkdir(dirname(parentPath), { recursive: true });
  const retained = Bun.YAML.stringify(parent);
  await writeFile(parentPath, retained);
  const inspected = await run(inspector, [String(f.receipt.ticket_ref), "--json"], {}, f.repository);
  expect(inspected.code).toBe(0);
  expect(JSON.parse(inspected.stdout).workflow.inspection.historyValid).toBe(true);
  const context = await f.context("worktree-receipt/v2", "retained-root");
  const input = join(f.directory, "retained-root.json");
  const event = join(f.workflow.path, "events/implementation-0002.yaml");
  const foreign = join(f.directory, "foreign");
  execFileSync("git", ["init", "--quiet", foreign]);
  // A matching origin cannot establish linked-checkout identity.
  execFileSync("git", ["-C", foreign, "remote", "add", "origin", execFileSync("git", ["-C", f.repository, "remote", "get-url", "origin"], { encoding: "utf8" }).trim()]);
  for (const invalid of [
    { ...parent, repository: foreign, workflow: { ...parent.workflow, root: foreign } },
    { ...parent, workflow: { ...parent.workflow, root: f.directory } },
    { ...parent, workflow: { ...parent.workflow, store: "shared" } },
    { ...parent, workflow: { ...parent.workflow, ref: "workflows/OTHER" } },
  ]) {
    const bytes = Bun.YAML.stringify(invalid);
    await writeFile(parentPath, bytes);
    const rejected = await publishPhase(child, input, f.repository, { RESULT_DELIVERY_CONTEXT: context.file });
    expect(rejected.code).toBe(1);
    expect(rejected.stderr).toContain("Phase parent does not match the resolved workflow");
    expect(await Bun.file(event).exists()).toBe(false);
    expect(await Bun.file(context.target).exists()).toBe(false);
    expect(await readFile(parentPath, "utf8")).toBe(bytes);
  }
  await writeFile(parentPath, retained);
  const published = await publishPhase(child, input, f.repository, { RESULT_DELIVERY_CONTEXT: context.file });
  expect(published.stderr).toBe("");
  expect(published.code).toBe(0);
  const receipt = Bun.YAML.parse(await readFile(event, "utf8")) as Record<string, unknown>;
  expect(receipt.workflow).toEqual({ store: "repository", root: f.repository, ref: f.workflow.ref });
  expect(receipt.worktree).toBe(source);
  expect(JSON.parse(await readFile(context.target, "utf8")).result).toEqual(receipt);
  expect(await readFile(parentPath, "utf8")).toBe(retained);
}, 120_000);

test.each(["blocked", "failed"])("phase writer delivers a %s review without inventing a verdict", async (status) => {
  const f = await fixture();
  const context = await f.context("worktree-receipt/v1", "review-" + status);
  const receipt = { ...f.receipt, phase: "review", status, receipt_id: "review-" + status };
  await writeFile(join(f.workflow.path, "events/start-0001.yaml"), Bun.YAML.stringify({ ...receipt, receipt_id: "start-0001", event: "phase-start", status: "started", parent_receipt: null }));
  const input = join(f.directory, "receipt.json");
  await writeFile(input, JSON.stringify(receipt));
  const published = await run(writer, ["--repository", f.repository, "--input", input], { RESULT_DELIVERY_CONTEXT: context.file });
  expect(published.code).toBe(0);
  const received = await run(delivery, ["read", "--context", context.file]);
  expect(received.code).toBe(0);
  const result = JSON.parse(received.stdout);
  expect(result.status).toBe(status);
  expect(Object.hasOwn(result, "verdict")).toBe(false);
  const event = Bun.YAML.parse(await readFile(join(f.workflow.path, "events", receipt.receipt_id + ".yaml"), "utf8"));
  expect(event).toMatchObject({ status });
  expect(event).not.toHaveProperty("verdict");
}, 120_000);

test.each([
  { name: "completed review without a verdict", status: "completed", verdict: undefined },
  { name: "blocked review with an invalid verdict", status: "blocked", verdict: "PARTIAL" },
])("phase writer rejects $name before publication", async ({ status, verdict }) => {
  const f = await fixture();
  const context = await f.context("worktree-receipt/v1", "invalid-review");
  const input = join(f.directory, "receipt.json");
  await writeFile(input, JSON.stringify({ ...f.receipt, phase: "review", status, verdict, receipt_id: "invalid-review" }));
  const rejected = await run(writer, ["--repository", f.repository, "--input", input], { RESULT_DELIVERY_CONTEXT: context.file });
  expect(rejected.code).not.toBe(0);
  expect(await Bun.file(join(f.workflow.path, "events/invalid-review.yaml")).exists()).toBe(false);
  expect(await Bun.file(context.target).exists()).toBe(false);
}, 120_000);

test("phase writer records the current time when the result omits created_at", async () => {
  const f = await fixture();
  const { created_at: _omitted, ...receipt } = f.receipt;
  const input = join(f.directory, "receipt.json");
  await writeFile(input, JSON.stringify(receipt));
  const before = Date.now();
  const published = await run(writer, ["--repository", f.repository, "--input", input]);
  const after = Date.now();
  expect(published.code).toBe(0);
  const event = Bun.YAML.parse(await readFile(join(f.workflow.path, "events/implementation-0002.yaml"), "utf8")) as Record<string, unknown>;
  const recorded = Date.parse(String(event.created_at));
  expect(recorded).toBeGreaterThanOrEqual(before);
  expect(recorded).toBeLessThanOrEqual(after);
}, 120_000);

test.each([
  { name: "a start phase", change: { phase: "start" }, message: "implementation, review or fix" },
  { name: "a finish phase", change: { phase: "finish" }, message: "implementation, review or fix" },
  { name: "a created_at one hour ahead", change: { created_at: new Date(Date.now() + 3_600_000).toISOString() }, message: "created_at" },
  { name: "a created_at one hour behind", change: { created_at: new Date(Date.now() - 3_600_000).toISOString() }, message: "created_at" },
  { name: "a created_at that is not a timestamp", change: { created_at: "today" }, message: "created_at" },
])("phase writer rejects $name before publication", async ({ change, message }) => {
  const f = await fixture();
  const input = join(f.directory, "receipt.json");
  await writeFile(input, JSON.stringify({ ...f.receipt, ...change }));
  const rejected = await run(writer, ["--repository", f.repository, "--input", input]);
  expect(rejected.code).not.toBe(0);
  expect(rejected.stderr).toContain(message);
  expect(await Bun.file(join(f.workflow.path, "events/implementation-0002.yaml")).exists()).toBe(false);
}, 120_000);

test("phase writer rejects a changed source or target schema before creating an event", async () => {
  const f = await fixture();
  const context = await f.context("tracker-result/v1", "wrong-owner");
  const input = join(f.directory, "receipt.json");
  await writeFile(input, JSON.stringify(f.receipt));
  const wrongOwner = await run(writer, ["--repository", f.repository, "--input", input], { RESULT_DELIVERY_CONTEXT: context.file });
  expect(wrongOwner.code).not.toBe(0);
  await writeFile(input, JSON.stringify({ ...f.receipt, source_commit: "0".repeat(40) }));
  const changedSource = await run(writer, ["--repository", f.repository, "--input", input]);
  expect(changedSource.code).not.toBe(0);
  expect(changedSource.stderr).toContain("source commit or tree");
  expect(await Bun.file(join(f.workflow.path, "events/implementation-0002.yaml")).exists()).toBe(false);
}, 120_000);

test("phase writer rejects another repository even when its source commit and tree match", async () => {
  const f = await fixture();
  const foreign = join(f.directory, "foreign");
  execFileSync("git", ["clone", "--quiet", "--local", f.repository, foreign]);
  const input = join(f.directory, "foreign-receipt.json");
  await writeFile(input, JSON.stringify({ ...f.receipt, worktree: foreign, workspace_path: foreign }));
  const rejected = await run(writer, ["--repository", f.repository, "--input", input]);
  expect(rejected.code).not.toBe(0);
  expect(rejected.stderr).toContain("same Git repository");
  expect(await Bun.file(join(f.workflow.path, "events/implementation-0002.yaml")).exists()).toBe(false);
}, 120_000);

test("a failure after event publication preserves prepared recovery data without claiming success", async () => {
  const f = await fixture();
  const input = join(f.directory, "receipt.json");
  const preload = join(f.directory, "post-publication-fault.ts");
  await writeFile(input, JSON.stringify(f.receipt));
  await writeFile(preload, `import { mock } from "bun:test";
import * as filesystem from "node:fs/promises";
const realLink = filesystem.link;
mock.module("node:fs/promises", () => ({
  ...filesystem,
  link: async (source, destination) => {
    await realLink(source, destination);
    if (String(destination).endsWith("implementation-0002.yaml")) throw new Error("Injected failure after publication");
  }
}));`);
  const result = await run(process.execPath, ["--install=fallback", "--preload", preload, writer, "--repository", f.repository, "--input", input]);
  expect(result.code).not.toBe(0);
  expect(result.stderr).toContain("publication is unconfirmed");
  expect(JSON.parse(result.stdout)).toEqual(f.receipt);
  const event = await readFile(join(f.workflow.path, "events/implementation-0002.yaml"), "utf8");
  expect(Bun.YAML.parse(event)).toEqual(f.receipt);
}, 120_000);

test("intermediate ticket checks do not consume a phase handoff", async () => {
  const f = await fixture();
  const context = await f.context("worktree-receipt/v1", "reserved-final-result");
  const flags = ["check", "--repository", f.repository, "--initiative", "check"];
  const intermediate = await run(records, flags, { RESULT_DELIVERY_CONTEXT: context.file });
  expect(intermediate.code).toBe(0);
  expect(JSON.parse(intermediate.stdout).schemaVersion).toBe("tracker-result/v2");
  expect(await Bun.file(context.target).exists()).toBe(false);
  const wrongBinding = await run(records, [...flags, "--deliver"], { RESULT_DELIVERY_CONTEXT: context.file });
  expect(wrongBinding.code).not.toBe(0);
  expect(await Bun.file(context.target).exists()).toBe(false);
}, 120_000);

async function generatedFixture(version: 2 | 3 = 3) {
  const f = await fixture(false);
  const config = join(f.directory, "wt.toml");
  await writeFile(config, "");
  const created = await run("wt", ["--config", config, "-C", f.repository, "switch", "--create", "feature/TASK-1", "--base", "main", "--no-cd", "--no-hooks"]);
  if (created.code !== 0) throw new Error(created.stderr);
  const listed = await run("wt", ["--config", config, "-C", f.repository, "list", "--format=json"]);
  const rows = JSON.parse(listed.stdout);
  const row = (Array.isArray(rows) ? rows : rows.items).find((item: { branch: string }) => item.branch === "feature/TASK-1");
  const source: string = row.worktree?.path ?? row.path;
  const input = join(f.directory, "generated.json");
  const { schema: _retained, ...identity } = f.receipt;
  const start = { ...identity, ...(version === 3 ? { schemaVersion: "worktree-receipt/v3" } : { schema: "worktree-receipt/v2" }), receipt_id: "start-0001", event: "phase-start", phase: "start", status: "started", parent_receipt: null, worktree: source, workspace_path: source, source_branch: "feature/TASK-1", pane_id: null };
  if (version === 2) {
    await mkdir(join(f.workflow.path, "events"), { recursive: true });
    await writeFile(join(f.workflow.path, "events/start-0001.yaml"), Bun.YAML.stringify(start));
  } else {
    const published = await publishPhase(start, input, f.repository, {}, true);
    if (published.code !== 0) throw new Error(published.stderr);
  }
  const delivery = await f.context(`worktree-receipt/v${version}`, "generated-result");
  const phase = {
    ...(version === 3 ? { schemaVersion: "worktree-phase-context/v2" } : { schema: "worktree-phase-context/v1" }), receipt_schema: `worktree-receipt/v${version}`, receipt_id: "implementation-0002",
    workflow_id: "TASK-1", ticket: f.receipt.ticket as { backend: string; id: string; ref: string }, parent_receipt: "start-0001", event: "phase-result", phase: "implementation", attempt: 1,
    source: { worktree: source, branch: "feature/TASK-1", base_branch: "main" },
    session: { muxer: "tmux", agent: "omp", pane_id: "child-pane", session_id: "child-session", run_id: "integration-run", operation_id: "generated-result" },
  };
  const outcome = { status: "completed", inputs: [{ kind: "receipt", ref: "start-0001" }], outputs: [{ kind: "receipt", ref: "implementation-0002" }] };
  async function publish(context: Record<string, unknown> = phase, result: Record<string, unknown> = outcome, parent = false) {
    await writeFile(input + ".phase.json", JSON.stringify(context));
    await writeFile(input, JSON.stringify(result));
    return run(writer, [...(parent ? ["--parent-event"] : []), "--repository", f.repository, "--phase-context", input + ".phase.json", "--input", input], { RESULT_DELIVERY_CONTEXT: delivery.file }, f.directory);
  }
  return { ...f, source, phase, outcome, publish, delivery };
}

test("generated publication rejects absent or inconsistent authorization before event and delivery writes", async () => {
  const f = await generatedFixture();
  const { session: _session, ...missingSession } = f.phase;
  const cases = [
    missingSession,
    { ...f.phase, ticket: { ...f.phase.ticket, id: "OTHER" } },
    { ...f.phase, ticket: { ...f.phase.ticket, ref: "tracker/tickets/OTHER.md" } },
    { ...f.phase, receipt_schema: "worktree-receipt/v1" },
    { ...f.phase, attempt: 2 },
    { ...f.phase, parent_receipt: null },
    { ...f.phase, session: { ...f.phase.session, operation_id: "another-operation" } },
    { ...f.phase, source: { ...f.phase.source, worktree: f.repository } },
    { ...f.phase, goal_run_id: "unpaired-goal" },
  ];
  const prior = await readFile(join(f.workflow.path, "events/start-0001.yaml"), "utf8");
  for (const phase of cases) {
    expect((await f.publish(phase)).code).not.toBe(0);
    expect(await Bun.file(join(f.workflow.path, "events/implementation-0002.yaml")).exists()).toBe(false);
    expect(await Bun.file(f.delivery.target).exists()).toBe(false);
  }
  const override = await f.publish(f.phase, { ...f.outcome, source_commit: f.receipt.source_commit });
  expect(override.code).not.toBe(0);
  expect(override.stderr).toContain("Outcome must not supply receipt identity");
  expect(await readFile(join(f.workflow.path, "events/start-0001.yaml"), "utf8")).toBe(prior);
}, 120_000);

test("generation observes implementation Git state from another cwd and preserves parent finish source", async () => {
  const f = await generatedFixture();
  execFileSync("git", ["-C", f.source, "-c", "user.name=Delivery Tests", "-c", "user.email=delivery@example.invalid", "-c", "commit.gpgsign=false", "-c", "core.hooksPath=/dev/null", "commit", "--quiet", "--allow-empty", "-m", "test: changed implementation"]);
  const observed = execFileSync("git", ["-C", f.source, "rev-parse", "HEAD", "HEAD^{tree}"], { encoding: "utf8" }).trim().split("\n");
  const published = await f.publish();
  expect(published.code).toBe(0);
  const child = Bun.YAML.parse(await readFile(join(f.workflow.path, "events/implementation-0002.yaml"), "utf8")) as Record<string, unknown>;
  expect(child).toMatchObject({ worktree: f.source, workspace_path: f.source, source_branch: "feature/TASK-1", source_commit: observed[0], source_tree: observed[1], session_id: "child-session" });
  const delivered = await readFile(f.delivery.target, "utf8");
  const finish = { ...f.phase, receipt_id: "finish-checkpoint", phase: "finish", event: "phase-start", parent_receipt: child.receipt_id, source: { ...f.phase.source, commit: observed[0], tree: observed[1] }, session: { muxer: "tmux", agent: "omp", session_id: "parent-session", pane_id: null } };
  expect((await f.publish(finish, { ...f.outcome, status: "started" }, true)).code).toBe(0);
  const parent = Bun.YAML.parse(await readFile(join(f.workflow.path, "events/finish-checkpoint.yaml"), "utf8"));
  expect(parent).toMatchObject({ repository: f.repository, worktree: f.source, workspace_path: f.source, source_commit: observed[0], session_id: "parent-session" });
  expect(await readFile(f.delivery.target, "utf8")).toBe(delivered);
}, 120_000);

test("review publication rejects changed commit and dirty source instead of re-pinning review identity", async () => {
  const f = await generatedFixture();
  expect((await f.publish()).code).toBe(0);
  const start = { ...f.receipt, created_at: undefined, schema: undefined, schemaVersion: "worktree-receipt/v3", worktree: f.source, workspace_path: f.source, source_branch: "feature/TASK-1", receipt_id: "review-start", parent_receipt: "implementation-0002", phase: "review", event: "phase-start", status: "started", pane_id: null };
  const started = await publishPhase(start, join(f.directory, "review-start.json"), f.repository, {}, true);
  expect(started.code).toBe(0);
  const review = { ...f.phase, receipt_id: "review-result", phase: "review", parent_receipt: "review-start", source: { ...f.phase.source, commit: f.receipt.source_commit, tree: f.receipt.source_tree } };
  const outcome = { ...f.outcome, status: "blocked" };
  await writeFile(join(f.source, "uncommitted"), "changed review input");
  const dirty = await f.publish(review, outcome);
  expect(dirty.code).not.toBe(0);
  expect(dirty.stderr).toContain("uncommitted changes");
  await rm(join(f.source, "uncommitted"));
  execFileSync("git", ["-C", f.source, "-c", "user.name=Delivery Tests", "-c", "user.email=delivery@example.invalid", "-c", "commit.gpgsign=false", "-c", "core.hooksPath=/dev/null", "commit", "--quiet", "--allow-empty", "-m", "test: stale review"]);
  const changed = await f.publish(review, outcome);
  expect(changed.code).not.toBe(0);
  expect(changed.stderr).toContain("differs from phase expectations");
  expect(await Bun.file(join(f.workflow.path, "events/review-result.yaml")).exists()).toBe(false);
}, 120_000);

test("generated v1 identity requires a retained phase-start and its assigned live handoff", async () => {
  const f = await fixture(false);
  const input = join(f.directory, "retained-v1.json");
  const start = { ...f.receipt, receipt_id: "start-0001", event: "phase-start", phase: "start", status: "started", parent_receipt: null };
  const initial = await publishPhase(start, input, f.repository, {}, true);
  expect(initial.code).not.toBe(0);
  expect(await Bun.file(join(f.workflow.path, "events/start-0001.yaml")).exists()).toBe(false);
  await mkdir(join(f.workflow.path, "events"), { recursive: true });
  const retained = Bun.YAML.stringify(start);
  await writeFile(join(f.workflow.path, "events/start-0001.yaml"), retained);
  const delivery = await f.context("worktree-receipt/v1", "retained-result");
  const mismatched = await publishPhase({ ...f.receipt, receipt_id: "fix-mismatched", phase: "fix" }, input, f.repository, { RESULT_DELIVERY_CONTEXT: delivery.file });
  expect(mismatched.code).not.toBe(0);
  expect(mismatched.stderr).toContain("matching parent phase");
  expect(await Bun.file(join(f.workflow.path, "events/fix-mismatched.yaml")).exists()).toBe(false);
  expect(await Bun.file(delivery.target).exists()).toBe(false);
  const result = await publishPhase(f.receipt, input, f.repository, { RESULT_DELIVERY_CONTEXT: delivery.file });
  expect(result.code).toBe(0);
  expect(Bun.YAML.parse(await readFile(join(f.workflow.path, "events/implementation-0002.yaml"), "utf8"))).toEqual(f.receipt);
  expect(await readFile(join(f.workflow.path, "events/start-0001.yaml"), "utf8")).toBe(retained);
  const fixStart = { ...start, receipt_id: "fix-start", phase: "fix", parent_receipt: "implementation-0002" };
  const fixRetained = Bun.YAML.stringify(fixStart);
  await writeFile(join(f.workflow.path, "events/fix-start.yaml"), fixRetained);
  const fixDelivery = await f.context("worktree-receipt/v1", "retained-fix");
  const fix = { ...f.receipt, receipt_id: "fix-result", phase: "fix", parent_receipt: "fix-start" };
  const matching = await publishPhase(fix, input, f.repository, { RESULT_DELIVERY_CONTEXT: fixDelivery.file });
  expect(matching.code).toBe(0);
  expect(Bun.YAML.parse(await readFile(join(f.workflow.path, "events/fix-result.yaml"), "utf8"))).toEqual(fix);
  expect(await Bun.file(fixDelivery.target).exists()).toBe(true);
  expect(await readFile(join(f.workflow.path, "events/fix-start.yaml"), "utf8")).toBe(fixRetained);
  expect(await readFile(join(f.workflow.path, "events/start-0001.yaml"), "utf8")).toBe(retained);
}, 120_000);

test("outcome-only publication cannot proceed without phase context", async () => {
  const f = await generatedFixture();
  const input = join(f.directory, "outcome-only.json");
  await writeFile(input, JSON.stringify(f.outcome));
  const rejected = await run(writer, ["--repository", f.repository, "--input", input], { RESULT_DELIVERY_CONTEXT: f.delivery.file });
  expect(rejected.code).not.toBe(0);
  expect(rejected.stderr).toContain("requires --phase-context");
  expect(await Bun.file(join(f.workflow.path, "events/implementation-0002.yaml")).exists()).toBe(false);
  expect(await Bun.file(f.delivery.target).exists()).toBe(false);
}, 120_000);

test("full v1 repairs require a retained checksum-bound operator approval", async () => {
  const f = await fixture();
  const input = join(f.directory, "repair.json");
  const receipt: Record<string, unknown> = { ...f.receipt, session_id: "repair-session" };
  const bytes = JSON.stringify(receipt);
  await writeFile(input, bytes);
  const approvalPath = join(f.workflow.path, "events/repair-approval.yaml");
  const approval = { ...f.receipt, receipt_id: "repair-approval", event: "operator-approval", status: "approved", envelope_repair: { receipt_id: receipt.receipt_id, sha256: createHash("sha256").update(bytes).digest("hex") } };
  await writeFile(approvalPath, Bun.YAML.stringify({ ...approval, status: "blocked" }));
  const flags = ["--repository", f.repository, "--repair-authorization", "repair-approval", "--input", input];
  expect((await run(writer, flags)).code).not.toBe(0);
  await writeFile(approvalPath, Bun.YAML.stringify(approval));
  await writeFile(input, JSON.stringify({ ...receipt, status: "blocked" }));
  expect((await run(writer, flags)).code).not.toBe(0);
  expect(await Bun.file(join(f.workflow.path, "events/implementation-0002.yaml")).exists()).toBe(false);
  await writeFile(input, bytes);
  const result = await run(writer, flags);
  expect(result.stderr).toBe("");
  expect(result.code).toBe(0);
  expect(Bun.YAML.parse(await readFile(join(f.workflow.path, "events/implementation-0002.yaml"), "utf8"))).toEqual(receipt);
}, 120_000);

test.each([
  { phase: "start", status: "failed", dirty: true, version: 3 },
  { phase: "implementation", status: "blocked", dirty: false, version: 3 },
  { phase: "fix", status: "failed", dirty: false, version: 3 },
  { phase: "fix", status: "blocked", dirty: true, version: 3 },
  { phase: "start", status: "failed", dirty: true, version: 2 },
  { phase: "implementation", status: "blocked", dirty: false, version: 2 },
])("generation observes implementation Git state for v$version $status $phase closure with partial source", async ({ phase, status, dirty, version }) => {
  const f = await generatedFixture(version as 2 | 3);
  let parentId = "start-0001";
  if (phase === "fix") {
    expect((await f.publish()).code).toBe(0);
    parentId = "fix-start";
    const start = { ...f.phase, receipt_id: parentId, parent_receipt: "implementation-0002", phase: "fix", event: "phase-start" };
    expect((await f.publish(start, { ...f.outcome, status: "started" }, true)).code).toBe(0);
  }
  const prior = await readFile(join(f.workflow.path, "events", parentId + ".yaml"), "utf8");
  await writeFile(join(f.source, "partial-source"), "retained committed work\n");
  execFileSync("git", ["-C", f.source, "add", "partial-source"]);
  execFileSync("git", ["-C", f.source, "-c", "user.name=Delivery Tests", "-c", "user.email=delivery@example.invalid", "-c", "commit.gpgsign=false", "-c", "core.hooksPath=/dev/null", "commit", "--quiet", "-m", "test: partial implementation"]);
  if (dirty) await writeFile(join(f.source, "partial-source"), "retained dirty work\n");
  const observed = execFileSync("git", ["-C", f.source, "rev-parse", "HEAD", "HEAD^{tree}"], { encoding: "utf8" }).trim().split("\n");
  const closure = { ...f.phase, receipt_id: "partial-complete", parent_receipt: parentId, phase, event: "phase-complete", source: { ...f.phase.source, commit: f.receipt.source_commit, tree: f.receipt.source_tree } };
  const outcome = { status, result_missing: true, failure_reason: "Child exited without a result", inputs: [{ kind: "receipt", ref: parentId }], outputs: [{ kind: "receipt", ref: "partial-complete" }] };
  const success = await f.publish(closure, { ...outcome, status: "completed" }, true);
  expect(success.code).not.toBe(0);
  expect(await Bun.file(join(f.workflow.path, "events/partial-complete.yaml")).exists()).toBe(false);
  const wrongBranch = await f.publish({ ...closure, source: { ...closure.source, branch: "feature/OTHER" } }, outcome, true);
  expect(wrongBranch.code).not.toBe(0);
  expect(wrongBranch.stderr).toContain("does not match its parent");
  const published = await f.publish(closure, outcome, true);
  expect(published.stderr).toBe("");
  expect(published.code).toBe(0);
  const result = Bun.YAML.parse(await readFile(join(f.workflow.path, "events/partial-complete.yaml"), "utf8"));
  expect(result).toMatchObject({ phase, status, result_missing: true, source_commit: observed[0], source_tree: observed[1], source_dirty: dirty, parent_receipt: parentId });
  expect(await readFile(join(f.source, "partial-source"), "utf8")).toBe(dirty ? "retained dirty work\n" : "retained committed work\n");
  expect(await readFile(join(f.workflow.path, "events", parentId + ".yaml"), "utf8")).toBe(prior);
}, 120_000);

test.each([2, 3] as const)("owning start/result/inspection preserves v%i history and recovers without replay", async version => {
  const f = await generatedFixture(version);
  const startPath = join(f.workflow.path, "events/start-0001.yaml");
  const startBytes = await readFile(startPath);
  const before = await run(inspector, ["tracker/tickets/TASK-1.md", "--json"], {}, f.repository);
  expect(before.code).toBe(0);
  expect(JSON.parse(before.stdout).decision).toMatchObject({ action: "start", mode: "takeover" });
  const published = await f.publish();
  expect(published.code).toBe(0);
  const resultPath = join(f.workflow.path, "events/implementation-0002.yaml");
  const resultBytes = await readFile(resultPath);
  const after = await run(inspector, ["tracker/tickets/TASK-1.md", "--json"], {}, f.repository);
  expect(after.code).toBe(0);
  const inspected = JSON.parse(after.stdout);
  expect(inspected.workflow.inspection.historyValid).toBe(true);
  expect(inspected.decision).toMatchObject({ action: "start", mode: "reconcile" });
  const envelope = JSON.parse(await readFile(f.delivery.target, "utf8"));
  expect(envelope.result).toEqual(Bun.YAML.parse(resultBytes.toString()));
  expect(inspected.workflow.receipts.find((receipt: { id: string }) => receipt.id === "implementation-0002").fields).toEqual(envelope.result);
  const rejected = await f.publish(f.phase, { ...f.outcome, schemaVersion: "worktree-receipt/v99" });
  expect(rejected.code).not.toBe(0);
  expect(await readFile(startPath)).toEqual(startBytes);
  expect(await readFile(resultPath)).toEqual(resultBytes);
}, 120_000);

test("a current v3 child can reconcile a retained v2 start without relabeling either record", async () => {
  const f = await generatedFixture(2);
  const start = join(f.workflow.path, "events/start-0001.yaml");
  const original = await readFile(start);
  const { schema: _historical, ...fields } = f.phase as Record<string, unknown>;
  const context = await f.context("worktree-receipt/v3", "mixed-v3-result");
  const phase = { ...fields, schemaVersion: "worktree-phase-context/v2", receipt_schema: "worktree-receipt/v3", session: { ...f.phase.session, operation_id: "mixed-v3-result" } };
  const input = join(f.directory, "mixed-outcome.json");
  await writeFile(input + ".phase.json", JSON.stringify(phase));
  await writeFile(input, JSON.stringify(f.outcome));
  const published = await run(writer, ["--repository", f.repository, "--phase-context", input + ".phase.json", "--input", input], { RESULT_DELIVERY_CONTEXT: context.file });
  expect(published.code).toBe(0);
  const inspection = await run(inspector, ["tracker/tickets/TASK-1.md", "--json"], {}, f.repository);
  expect(inspection.code).toBe(0);
  expect(JSON.parse(inspection.stdout).decision).toMatchObject({ mode: "reconcile", action: "start" });
  expect(await readFile(start)).toEqual(original);
}, 120_000);

test("v2 output requires retained authorization rather than a fresh start or unassigned child", async () => {
  const f = await generatedFixture(2);
  const startPath = join(f.workflow.path, "events/start-0001.yaml");
  const retained = await readFile(startPath);
  await rm(startPath);
  const start = Bun.YAML.parse(retained.toString());
  if (!start || typeof start !== "object" || Array.isArray(start)) throw new Error("Retained start must be a mapping");
  const input = join(f.directory, "fresh-v2.json");
  const fresh = await publishPhase({ ...start }, input, f.repository, {}, true);
  expect(fresh.code).not.toBe(0);
  expect(await Bun.file(startPath).exists()).toBe(false);
  expect(await Bun.file(f.delivery.target).exists()).toBe(false);
  await writeFile(startPath, retained);
  const unassigned = await publishPhase({ ...start, ...f.outcome, receipt_id: "unassigned", phase: "implementation", event: "phase-result", parent_receipt: "start-0001" }, input, f.repository);
  expect(unassigned.code).not.toBe(0);
  expect(await Bun.file(join(f.workflow.path, "events/unassigned.yaml")).exists()).toBe(false);
  const mismatch = await f.publish({ ...f.phase, phase: "fix" });
  expect(mismatch.code).not.toBe(0);
  expect(await Bun.file(f.delivery.target).exists()).toBe(false);
  expect((await f.publish()).code).toBe(0);
  const resultPath = join(f.workflow.path, "events/implementation-0002.yaml");
  const resultBytes = await readFile(resultPath);
  const complete = { ...f.phase, receipt_id: "start-complete", event: "phase-complete", parent_receipt: "implementation-0002", source: { ...f.phase.source, commit: f.receipt.source_commit, tree: f.receipt.source_tree } };
  expect((await f.publish(complete, f.outcome, true)).code).toBe(0);
  const nextStart = { ...complete, receipt_id: "review-start", phase: "review", event: "phase-start", parent_receipt: "start-complete" };
  expect((await f.publish(nextStart, { ...f.outcome, status: "started" }, true)).code).not.toBe(0);
  expect(await Bun.file(join(f.workflow.path, "events/review-start.yaml")).exists()).toBe(false);
  expect(await readFile(startPath)).toEqual(retained);
  expect(await readFile(resultPath)).toEqual(resultBytes);
}, 120_000);
