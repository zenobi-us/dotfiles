import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const directory = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(await readFile(join(directory, "finalizer-config.json"), "utf8"));
const assessment = JSON.parse(await readFile(join(directory, "assessment.json"), "utf8"));
const template = JSON.parse(await readFile(join(directory, "result-template.json"), "utf8"));
const launch = JSON.parse(await readFile(join(directory, "launch-session.json"), "utf8"));
const checks = JSON.parse(await readFile(join(directory, "checks.json"), "utf8"));
const native = JSON.parse(await readFile(join(directory, "native-basic", "native-smoke.json"), "utf8"));
if (assessment.stage_completed !== true || typeof assessment.summary !== "string") throw new Error("Full code stage is not assessed complete.");
if (checks.commands.length !== 2 || checks.commands.some(row => row.code !== 0)) throw new Error("Observed suite/compiler did not pass.");
if (native.status !== "passed" || native.cleanup.native_exit !== 0 || native.cleanup.temporary_root_exists) throw new Error("Actual changed-path native smoke or cleanup failed.");
async function command(argv, cwd = config.worktree) {
  const child = Bun.spawn(argv, { cwd, stdout: "pipe", stderr: "pipe" });
  const [stdout, stderr, code] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
  if (code !== 0) throw new Error(`${argv[0]} exited ${code}: ${stderr}`);
  return stdout;
}
const identity = (await command(["git", "rev-parse", "HEAD", "HEAD^{tree}"])).trim().split("\n");
if ((await command(["git", "branch", "--show-current"])).trim() !== template.source_branch) throw new Error("Source branch changed.");
if ((await command(["git", "status", "--porcelain"])).trim()) throw new Error("Commit complete source and docs before finalization.");
const files = (await command(["git", "diff", "--name-only", config.base, "HEAD"])).trim().split("\n").filter(Boolean);
const allowed = ["mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/", "mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/"];
if (!files.length || files.some(file => !allowed.some(prefix => file.startsWith(prefix)))) throw new Error("Missing or out-of-scope code change.");
const afterSmoke = (await command(["git", "diff", "--name-only", native.source_commit, "HEAD"])).trim().split("\n").filter(Boolean);
if (afterSmoke.some(file => file !== config.documentationPath)) throw new Error("Runtime or test source changed after native smoke; commit and smoke again before documentation.");
if (!files.includes(config.documentationPath)) throw new Error("Existing feature documentation was not updated.");
const result = {
  ...template,
  created_at: new Date().toISOString(),
  session_id: launch.session_id,
  source_commit: identity[0],
  source_tree: identity[1],
  code_stage_completed: true,
  source_dirty: false,
  changed_files: files,
  validation: checks.commands.map(row => ({ command: row.argv, cwd: row.cwd, exit_code: row.code, evidence_ref: config.evidenceRef + "/" + row.name + "-command.json" })),
  native_smoke_ref: config.evidenceRef + "/native-basic/native-smoke.json",
  native_smoke_source_commit: native.source_commit,
  native_smoke_source_tree: native.source_tree,
  only_documentation_changed_after_native_smoke: true,
  documentation_updated: true,
  implementation_summary: assessment.summary,
  open_questions: ["Coordinator must prove the full final-source narrow/mono/native acceptance matrix before independent Standards, Spec and main reviews. Ticket remains claimed and unmerged."],
  inputs: [...template.inputs, { kind: "evidence", ref: config.evidenceRef + "/assessment.json" }, { kind: "evidence", ref: config.evidenceRef + "/checks.json" }, { kind: "evidence", ref: config.evidenceRef + "/native-basic/native-smoke.json" }],
  outputs: [...template.outputs, { kind: "snapshot", ref: config.workflowRef + "/artifacts/snapshots/" + config.snapshot }, ...["manifest.yaml", "projections/latest-status.yaml", "projections/pr-draft.md", "projections/implementation-log.md"].map(path => ({ kind: "projection", ref: config.workflowRef + "/" + path }))],
};
await mkdir(join(config.workflow, "events"), { recursive: true });
const resultPath = join(config.workflow, "events", config.result + ".json");
await writeFile(resultPath, JSON.stringify(result, null, 2) + "\n", { flag: "wx" });
if (JSON.parse(await readFile(resultPath, "utf8")).source_commit !== identity[0]) throw new Error("Result readback mismatch.");
const rows = await Promise.all((await readdir(join(config.workflow, "events"))).filter(name => name.endsWith(".json")).map(async name => ({ name, row: JSON.parse(await readFile(join(config.workflow, "events", name), "utf8")) })));
rows.sort((a, b) => String(a.row.created_at ?? "").localeCompare(String(b.row.created_at ?? "")) || a.name.localeCompare(b.name));
const evidence = "../" + config.evidenceRef.slice(config.workflowRef.length + 1);
const body = "## Current status\n\nFull ticket06 source, public-modal automated checks, actual wide colour queue smoke and existing documentation are complete. Full final-source terminal matrix and independent reviews remain pending; this is not complete ticket acceptance or permission to merge.\n\n" + assessment.summary + "\n\n- [Canonical ticket](../../../" + template.ticket_ref + ")\n- [Code result](../events/" + config.result + ".json)\n- [Observed checks](" + evidence + "/checks.json)\n- [Actual native changed-path smoke](" + evidence + "/native-basic/native-smoke.json)\n\nSource `" + identity[0] + "`; tree `" + identity[1] + "`. Five reserved agent cycles; all earlier stopped cycles remain consumed. Full-session work is audited by parent after shutdown. Only the existing README changed after the native smoke snapshot.\n\n## Append-only history\n\n| Receipt | Phase | Status |\n|---|---|---|\n" + rows.map(({ name, row }) => "| [" + (row.receipt_id ?? name) + "](../events/" + name + ") | " + (row.phase ?? "unrecorded") + " | " + (row.status ?? "unrecorded") + " |").join("\n") + "\n";
async function report(path, text, immutable = false) {
  await mkdir(dirname(path), { recursive: true });
  const args = ["mise", "exec", "--", "mq", "--allow-http-import", "-I", "null", "-F", "text", "--args", "body", text, "--output", path];
  if (immutable) args.push("--no-clobber");
  args.push('import "github.com/harehare/okf.mq" | okf::okf_new("Report", {title: "Ticket 06 code and initial native proof"}, body) | okf::okf_stringify(.)');
  await command(args, config.root);
}
await report(join(config.workflow, "projections", "pr-draft.md"), body);
await report(join(config.workflow, "projections", "implementation-log.md"), body);
await report(join(config.workflow, "artifacts", "snapshots", config.snapshot), body.replaceAll("](../../../", "](../../../../").replaceAll("](../events/", "](../../events/").replaceAll("](../artifacts/", "](../"), true);
await writeFile(join(config.workflow, "manifest.yaml"), Bun.YAML.stringify({ schema: "worktree-workflow/v2", workflow_id: template.workflow_id, ticket_ref: template.ticket_ref, initiative: "pi-shared-context-tui-ux-spec", event_root: "events", artifact_root: "artifacts", projection_root: "projections", latest_receipt: config.result, state: "BLOCKED" }));
await writeFile(join(config.workflow, "projections", "latest-status.yaml"), Bun.YAML.stringify({ schema: "worktree-latest-status/v1", workflow_id: template.workflow_id, ticket: template.ticket, state: "BLOCKED", latest_receipt: config.result, latest_source_commit: identity[0], latest_source_tree: identity[1], code_stage_completed: true, pending_gate: result.pending_gate, cycles_consumed: 5, approved_ticket_cycle_limit: 10, source_dirty: false, goal_run_id: template.goal_run_id }));
console.log(JSON.stringify({ result: resultPath, source_commit: identity[0], source_tree: identity[1], code_stage_completed: true, full_ticket_acceptance: false }));
