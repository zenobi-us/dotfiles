import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";

const directory = dirname(new URL(import.meta.url).pathname);
const config = JSON.parse(await readFile(join(directory, "finalizer-config.json"), "utf8"));
const assessment = JSON.parse(await readFile(join(directory, config.assessment), "utf8"));
const template = JSON.parse(await readFile(join(directory, config.template), "utf8"));
const launch = JSON.parse(await readFile(join(directory, config.launch), "utf8"));
const checks = JSON.parse(await readFile(join(directory, "checks.json"), "utf8"));
const smoke = JSON.parse(await readFile(join(directory, "smoke-command.json"), "utf8"));
if (assessment.stage_completed !== true || typeof assessment.summary !== "string") throw new Error("State stage is not assessed complete.");
if (checks.commands.length !== 2 || checks.commands.some(row => row.code !== 0) || smoke.code !== 0) throw new Error("Required observed checks did not pass.");

async function command(argv, cwd = config.worktree) {
  const child = Bun.spawn(argv, { cwd, stdout: "pipe", stderr: "pipe" });
  const [stdout, stderr, code] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
  if (code !== 0) throw new Error(`${argv[0]} exited ${code}: ${stderr}`);
  return stdout;
}
const identity = (await command(["git", "rev-parse", "HEAD", "HEAD^{tree}"])).trim().split("\n");
if ((await command(["git", "branch", "--show-current"])).trim() !== template.source_branch) throw new Error("Source branch changed.");
if ((await command(["git", "status", "--porcelain", "--untracked-files=no"])).trim()) throw new Error("Tracked source is not clean after commit.");
const files = (await command(["git", "diff", "--name-only", config.base, "HEAD"])).trim().split("\n").filter(Boolean);
const allowed = ["mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/", "mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/"];
if (!files.length || files.some(file => !allowed.some(prefix => file.startsWith(prefix)))) throw new Error("No committed state change or out-of-scope source.");
const result = {
  ...template,
  created_at: new Date().toISOString(),
  session_id: launch.session_id,
  source_commit: identity[0],
  source_tree: identity[1],
  code_stage_completed: true,
  source_dirty: false,
  changed_files: files,
  validation: [...checks.commands.map(row => ({ command: row.argv, cwd: row.cwd, exit_code: row.code, evidence_ref: config.evidenceRef + "/" + row.name + "-command.json" })), { command: smoke.argv, cwd: smoke.cwd, exit_code: smoke.code, evidence_ref: config.evidenceRef + "/smoke-command.json" }],
  implementation_summary: assessment.summary,
  open_questions: ["Structured presentation/recorded activity, complete public-modal tests, full native terminal acceptance, post-smoke documentation and independent reviews remain required."],
  inputs: [...template.inputs, { kind: "evidence", ref: config.evidenceRef + "/assessment.json" }, { kind: "evidence", ref: config.evidenceRef + "/checks.json" }, { kind: "evidence", ref: config.evidenceRef + "/smoke-command.json" }],
  outputs: [...template.outputs, { kind: "snapshot", ref: config.workflowRef + "/artifacts/snapshots/" + config.snapshot }, ...["manifest.yaml", "projections/latest-status.yaml", "projections/pr-draft.md", "projections/implementation-log.md"].map(path => ({ kind: "projection", ref: config.workflowRef + "/" + path }))],
};
await mkdir(join(config.workflow, "events"), { recursive: true });
const resultPath = join(config.workflow, "events", config.result + ".json");
await writeFile(resultPath, JSON.stringify(result, null, 2) + "\n", { flag: "wx" });
if (JSON.parse(await readFile(resultPath, "utf8")).source_commit !== identity[0]) throw new Error("Result readback mismatch.");

const rows = await Promise.all((await readdir(join(config.workflow, "events"))).filter(name => name.endsWith(".json")).map(async name => ({ name, row: JSON.parse(await readFile(join(config.workflow, "events", name), "utf8")) })));
rows.sort((a, b) => String(a.row.created_at ?? "").localeCompare(String(b.row.created_at ?? "")) || a.name.localeCompare(b.name));
const body = "## Status\n\nState/navigation code stage completed; the ticket remains BLOCKED on subsequent mandatory presentation/tests, native/docs and review gates. This is not complete ticket acceptance.\n\n" + assessment.summary + "\n\n- [Canonical ticket](../../../" + config.ticketRef + ")\n- [State result](../events/" + config.result + ".json)\n- [Observed checks](../artifacts/evidence/implementation-0011/checks.json)\n- [Actual public-modal smoke](../artifacts/evidence/implementation-0011/smoke-command.json)\n\nSource commit `" + identity[0] + "`; tree `" + identity[1] + "`. Four agent cycles reserved; earlier blocked attempts remain consumed. Full-session usage is audited by the parent after shutdown.\n\n## Append-only history\n\n| Receipt | Phase | Status |\n|---|---|---|\n" + rows.map(({ name, row }) => "| [" + (row.receipt_id ?? name) + "](../events/" + name + ") | " + (row.phase ?? "unrecorded") + " | " + (row.status ?? "unrecorded") + " |").join("\n") + "\n";
async function report(path, text, immutable = false) {
  await mkdir(dirname(path), { recursive: true });
  const args = ["mise", "exec", "--", "mq", "--allow-http-import", "-I", "null", "-F", "text", "--args", "body", text, "--output", path];
  if (immutable) args.push("--no-clobber");
  args.push('import "github.com/harehare/okf.mq" | okf::okf_new("Report", {title: "Ticket 06 state stage"}, body) | okf::okf_stringify(.)');
  await command(args, config.root);
}
await report(join(config.workflow, "projections", "pr-draft.md"), body);
await report(join(config.workflow, "projections", "implementation-log.md"), body);
const snapshot = body.replaceAll("](../../../", "](../../../../").replaceAll("](../events/", "](../../events/").replaceAll("](../artifacts/", "](../");
await report(join(config.workflow, "artifacts", "snapshots", config.snapshot), snapshot, true);
await writeFile(join(config.workflow, "manifest.yaml"), Bun.YAML.stringify({ schema: "worktree-workflow/v2", workflow_id: template.workflow_id, ticket_ref: template.ticket_ref, initiative: "pi-shared-context-tui-ux-spec", event_root: "events", artifact_root: "artifacts", projection_root: "projections", latest_receipt: config.result, state: "BLOCKED" }));
await writeFile(join(config.workflow, "projections", "latest-status.yaml"), Bun.YAML.stringify({ schema: "worktree-latest-status/v1", workflow_id: template.workflow_id, ticket: template.ticket, state: "BLOCKED", latest_receipt: config.result, latest_source_commit: identity[0], latest_source_tree: identity[1], code_stage_completed: true, pending_gate: result.pending_gate, cycles_consumed: 4, approved_ticket_cycle_limit: 10, source_dirty: false, goal_run_id: template.goal_run_id }));
console.log(JSON.stringify({ result: resultPath, source_commit: identity[0], source_tree: identity[1], code_stage_completed: true, full_ticket_acceptance: false }));
