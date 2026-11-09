// Exercises actual operation CLIs, retained transport files and authoritative YAML in isolated repositories.
import { afterEach, expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("../../../../../", import.meta.url));
const records = join(root, "matt-pocock/skills/reading-and-writing-tickets/scripts/records.ts");
const delivery = join(root, "agent-core/skills/result-delivery/scripts/router.ts");
const contextCli = join(root, "agent-core/skills/shared-context/scripts/shared-context/cli.ts");
const writer = fileURLToPath(new URL("./write-result.ts", import.meta.url));
const temporary: string[] = [];
afterEach(async () => { await Promise.all(temporary.splice(0).map((directory) => rm(directory, { recursive: true, force: true }))); });

async function run(command: string, args: string[], env: Record<string, string | undefined> = {}, cwd = tmpdir()) {
  const child = Bun.spawn([command, ...args], { cwd, env: { ...process.env, RESULT_DELIVERY_CONTEXT: undefined, MUXER_SUBAGENT_ROLE: undefined, MUXER_SUBAGENT_RUN_ID: undefined, MUXER_SUBAGENT_PARENT_RUN_ID: undefined, ...env }, stdout: "pipe", stderr: "pipe" });
  const [stdout, stderr, code] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
  return { stdout, stderr, code };
}

async function fixture() {
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
  await markdown("tracker/initiatives/check/index.md", { schema: "tracker-initiative/v1", id: "check", title: "Check delivery" }, "# Check delivery\n\n## Tickets\n");
  const resolved = await run(contextCli, ["resolve", "workflow", "--id", "TASK-1", "--json"], {}, repository);
  if (resolved.code !== 0) throw new Error(resolved.stderr);
  const workflow = JSON.parse(resolved.stdout);
  const commit = execFileSync("git", ["-C", repository, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  const tree = execFileSync("git", ["-C", repository, "rev-parse", "HEAD^{tree}"], { encoding: "utf8" }).trim();
  async function context(schema: string, operationId: string) {
    const file = join(directory, operationId + ".context.json");
    const target = join(directory, operationId + ".result.json");
    await writeFile(file, JSON.stringify({ schema: "result-delivery/v1", kind: "context", audience: "agent", mode: "artifact-reference", runId: "integration-run", operationId, target: { path: target, ref: pathToFileURL(target).href, schema } }));
    return { file, target };
  }
  const receipt: Record<string, unknown> = { schema: "worktree-receipt/v1", event: "phase-result", receipt_id: "implementation-0002", workflow_id: "TASK-1", phase: "implementation", attempt: 1, parent_receipt: "start-0001", repository, worktree: repository, source_branch: "main", base_branch: "main", source_commit: commit, source_tree: tree, created_at: "2026-01-01T00:00:00Z", muxer: "tmux", workspace_path: repository, pane_id: "test-pane", agent: "omp", session_id: "test-session", ticket: { backend: "local-markdown", id: "TASK-1", ref: "tracker/tickets/TASK-1.md" }, workflow: { store: workflow.store, root: workflow.root, ref: workflow.ref }, ticket_ref: "tracker/tickets/TASK-1.md", inputs: [{ kind: "receipt", ref: "start-0001" }], outputs: [{ kind: "receipt", ref: "implementation-0002" }], status: "completed", changed_files: [], validation: [{ command: "smoke", result: "passed" }], summary: "Checked the delivery workflow", open_questions: [] };
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
  const context = await f.context("tracker-result/v1", "ticket-check");
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
  expect(JSON.parse(intermediate.stdout).schema).toBe("tracker-result/v1");
  expect(await Bun.file(context.target).exists()).toBe(false);
  const wrongBinding = await run(records, [...flags, "--deliver"], { RESULT_DELIVERY_CONTEXT: context.file });
  expect(wrongBinding.code).not.toBe(0);
  expect(await Bun.file(context.target).exists()).toBe(false);
}, 120_000);
