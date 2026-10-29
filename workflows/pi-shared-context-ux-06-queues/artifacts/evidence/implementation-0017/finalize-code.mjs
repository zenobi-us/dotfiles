import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const directory = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(await readFile(Bun.argv[2] ?? join(directory, "finalizer-config.json"), "utf8"));
const json = async path => JSON.parse(await readFile(path, "utf8"));
const assessment = await json(join(directory, "assessment.json"));
const template = await json(join(directory, "result-template.json"));
const launch = await json(join(directory, "launch-session.json"));
const checks = await json(join(directory, config.checksDirectory, "checks.json"));
const native = await json(join(directory, config.nativeDirectory, "native-smoke.json"));
const checksRef = config.evidenceRef + "/" + config.checksDirectory;
const nativeRef = config.evidenceRef + "/" + config.nativeDirectory + "/native-smoke.json";
if (assessment.stage_completed !== true || typeof assessment.summary !== "string") throw new Error("Code/verification/docs scope is not assessed complete.");
if (checks.commands.length !== 2 || checks.commands.some(row => row.code !== 0)) throw new Error("Recorded suite/compiler did not pass.");
if (native.status !== "passed" || native.cleanup.native_exit !== 0 || native.cleanup.temporary_root_exists) throw new Error("Actual native smoke or owned cleanup failed.");
async function command(argv, cwd = config.worktree) {
  const child = Bun.spawn(argv, { cwd, stdout: "pipe", stderr: "pipe" });
  const [stdout, stderr, code] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
  if (code !== 0) throw new Error(`${argv[0]} exited ${code}: ${stderr}`);
  return stdout;
}
const identity = (await command(["git", "rev-parse", "HEAD", "HEAD^{tree}"])).trim().split("\n");
if ((await command(["git", "branch", "--show-current"])).trim() !== template.source_branch) throw new Error("Source branch changed.");
if ((await command(["git", "status", "--porcelain"])).trim()) throw new Error("Commit all owned source/tests/docs before finalization.");
const files = (await command(["git", "diff", "--name-only", config.base, "HEAD"])).trim().split("\n").filter(Boolean);
const allowed = ["mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/", "mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/"];
if (!files.length || files.some(file => !allowed.some(prefix => file.startsWith(prefix)))) throw new Error("Missing or out-of-scope committed source.");
await command(["git", "merge-base", "--is-ancestor", native.source_commit, "HEAD"]);
const afterSmoke = (await command(["git", "diff", "--name-only", native.source_commit, "HEAD"])).trim().split("\n").filter(Boolean);
if (afterSmoke.length !== 1 || afterSmoke[0] !== config.documentationPath) throw new Error("Exactly the existing documentation must change after native smoke; runtime changes need fresh checks/commit/smoke.");
const result = {
  ...template,
  created_at: new Date().toISOString(),
  session_id: launch.session_id,
  source_commit: identity[0], source_tree: identity[1], source_dirty: false, source_committed: true,
  code_stage_completed: true, changed_files: files,
  validation: checks.commands.map(row => ({ command: row.argv, cwd: row.cwd, exit_code: row.code, evidence_ref: checksRef + "/" + row.name + "-command.json" })),
  native_smoke_ref: nativeRef, native_smoke_source_commit: native.source_commit, native_smoke_source_tree: native.source_tree,
  only_documentation_changed_after_native_smoke: true, documentation_updated: true,
  implementation_summary: assessment.summary,
  open_questions: ["Full final-source narrow/mono/native matrix and independent Standards, Spec and main reviews remain mandatory. Ticket is not merged/completed."],
  inputs: [...template.inputs, { kind: "evidence", ref: config.evidenceRef + "/assessment.json" }, { kind: "evidence", ref: checksRef + "/checks.json" }, { kind: "evidence", ref: nativeRef }],
  outputs: [...template.outputs, { kind: "snapshot", ref: config.workflowRef + "/artifacts/snapshots/" + config.snapshot }, ...["manifest.yaml", "projections/latest-status.yaml", "projections/pr-draft.md", "projections/implementation-log.md"].map(path => ({ kind: "projection", ref: config.workflowRef + "/" + path }))],
};
await mkdir(join(config.workflow, "events"), { recursive: true });
const resultPath = join(config.workflow, "events", config.result + ".json");
await writeFile(resultPath, JSON.stringify(result, null, 2) + "\n", { flag: "wx" });
if ((await json(resultPath)).source_commit !== identity[0]) throw new Error("Result readback mismatch.");
const rows = await Promise.all((await readdir(join(config.workflow, "events"))).filter(name => name.endsWith(".json")).map(async name => ({ name, row: await json(join(config.workflow, "events", name)) })));
rows.sort((a, b) => String(a.row.created_at ?? "").localeCompare(String(b.row.created_at ?? "")) || a.name.localeCompare(b.name));
const local = ref => "../" + ref.slice(config.workflowRef.length + 1);
const body = "## Current status\n\nSource, public-modal checks, scoped compiler, actual initial queue smoke and post-smoke documentation are complete. The full final-source terminal matrix and independent reviews remain pending; ticket acceptance/merge is not claimed.\n\n" + assessment.summary + "\n\n- [Canonical ticket](../../../" + template.ticket_ref + ")\n- [Actual code result](../events/" + config.result + ".json)\n- [Observed checks](" + local(checksRef) + "/checks.json)\n- [Actual native smoke](" + local(nativeRef) + ")\n\nSource `" + identity[0] + "`; tree `" + identity[1] + "`. " + config.cycle + " agent cycles consumed/reserved; stopped cycles remain consumed. Parent audits complete-session usage after shutdown. Only the existing README changed after actual native smoke.\n\n## Append-only history\n\n| Receipt | Phase | Status |\n|---|---|---|\n" + rows.map(({ name, row }) => "| [" + (row.receipt_id ?? name) + "](../events/" + name + ") | " + (row.phase ?? "unrecorded") + " | " + (row.status ?? "unrecorded") + " |").join("\n") + "\n";
async function report(path, text, immutable = false) {
  await mkdir(dirname(path), { recursive: true });
  const args = ["mise", "exec", "--", "mq", "--allow-http-import", "-I", "null", "-F", "text", "--args", "body", text, "--output", path];
  if (immutable) args.push("--no-clobber");
  args.push('import "github.com/harehare/okf.mq" | okf::okf_new("Report", {title: "Ticket 06 repaired source and native proof"}, body) | okf::okf_stringify(.)');
  await command(args, config.root);
}
await report(join(config.workflow, "projections", "pr-draft.md"), body);
await report(join(config.workflow, "projections", "implementation-log.md"), body);
await report(join(config.workflow, "artifacts", "snapshots", config.snapshot), body.replaceAll("](../../../", "](../../../../").replaceAll("](../events/", "](../../events/").replaceAll("](../artifacts/", "](../"), true);
await writeFile(join(config.workflow, "manifest.yaml"), Bun.YAML.stringify({ schema: "worktree-workflow/v2", workflow_id: template.workflow_id, ticket_ref: template.ticket_ref, initiative: "pi-shared-context-tui-ux-spec", event_root: "events", artifact_root: "artifacts", projection_root: "projections", latest_receipt: config.result, state: "BLOCKED" }));
await writeFile(join(config.workflow, "projections", "latest-status.yaml"), Bun.YAML.stringify({ schema: "worktree-latest-status/v1", workflow_id: template.workflow_id, ticket: template.ticket, state: "BLOCKED", latest_receipt: config.result, latest_source_commit: identity[0], latest_source_tree: identity[1], source_dirty: false, source_committed: true, code_stage_completed: true, pending_gate: result.pending_gate, cycles_consumed: config.cycle, approved_ticket_cycle_limit: 10, goal_run_id: template.goal_run_id }));
console.log(JSON.stringify({ result: resultPath, source_commit: identity[0], source_tree: identity[1], code_stage_completed: true, full_ticket_acceptance: false }));
