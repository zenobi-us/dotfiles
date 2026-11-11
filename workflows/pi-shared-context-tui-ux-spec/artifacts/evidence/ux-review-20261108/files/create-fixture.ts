// Creates disposable, real file-backed records for cancelled OMP handoff demonstrations.
import { mkdir, mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

async function run(command: string, args: string[], cwd?: string): Promise<string> {
  const child = Bun.spawn([command, ...args], { cwd, stdout: "pipe", stderr: "pipe" });
  const [stdout, stderr, code] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
  if (code) throw new Error(`${command} exited ${code}: ${stderr || stdout}`);
  return stdout.trim();
}

const root = await mkdtemp(join(tmpdir(), "shared-context-ux-evidence-"));
await run("git", ["init", "--quiet", "-b", "main", root]);
await run("git", ["-C", root, "config", "user.name", "UX evidence fixture"]);
await run("git", ["-C", root, "config", "user.email", "fixture@example.invalid"]);
await run("git", ["-C", root, "remote", "add", "origin", "https://github.com/example/shared-context-ux-evidence.git"]);
const routes = ["schema = 2", ...["alignment", "tickets", "initiatives", "workflows", "evidence", "sources"].map(kind => `\n[records.${kind}]\nadapter = "${kind === "tickets" ? "local-markdown" : ["alignment", "initiatives"].includes(kind) ? "markdown" : "files"}"\nstore = "repository"`)];
await writeFile(join(root, ".context-routes.toml"), routes.join("\n") + "\n");
await writeFile(join(root, ".gitignore"), "/workflows/\n");
await writeFile(join(root, "source.txt"), "Stable source for UX evidence. No workflow action is executed.\n");
for (const directory of ["docs/agents", "docs/adr", "tracker/tickets", "tracker/initiatives/UX-DEMO", "workflows", "sources"]) await mkdir(join(root, directory), { recursive: true });
const definitions = [
  { id: "R-1", title: "Research: understand navigation choices", type: "research", status: "draft", body: "## Question\n\nWhich navigation model makes record identity clearest?\n\n## Findings\n\nCompare Detail, DAG and queues before changing the interface.\n\n## Open questions\n\nShould copy modes be explicit actions?" },
  { id: "P-1", title: "Prototype: compare navigation layouts", type: "prototype", status: "draft", body: "## Question\n\nCompare a compact list and a split-pane layout.\n\n## Acceptance criteria\n\nKeep identity, freshness and action consequences visible." },
  { id: "T-READY", title: "Inspect existing work before starting", type: "task", status: "unclaimed", body: "## What to build\n\nChoose an executable ticket and inspect its current state. This fixture does not start an agent." },
  { id: "T-REVIEW", title: "Review a recorded implementation", type: "task", status: "implemented", body: "## What to build\n\nA validated implementation receipt makes review the next phase." },
  { id: "T-FIX", title: "Fix recorded review findings", type: "task", status: "claimed", body: "## What to build\n\nA completed failed review provides current findings for a new fixer." },
  { id: "T-FINISH", title: "Finish or submit reviewed source", type: "task", status: "claimed", body: "## What to build\n\nA successful source-bound review permits finish and the submit alternative. Neither executes in this evidence run." },
  { id: "T-BLOCKED", title: "Resolve an unfinished prerequisite", type: "task", status: "unclaimed", blockers: ["T-READY"], body: "## What to build\n\nDo not start until the direct prerequisite is complete." },
  { id: "T-INVALID", title: "Inspect a deliberately invalid event", type: "task", status: "claimed", body: "## What to build\n\nThe invalid event is evidence test data. It must remain visible and cannot authorize a transition." },
];
const markdown = [
  { path: join(root, "docs/agents/issue-tracker.md"), kind: "Configuration", fields: { title: "UX evidence tracker", backend: "local-markdown" }, body: "Local Markdown fixture. Read-only demonstration; cancel every confirmation." },
  { path: join(root, "tracker/initiatives/UX-DEMO/index.md"), kind: "initiative", fields: { id: "UX-DEMO", title: "UX evidence fixture — cancelled workflows", phase: "planning" }, body: "## Purpose\n\nDemonstrate the real shared-context TUI with controlled, disposable records.\n\n## Tickets\n\n" + definitions.map(item => `- [${item.id}](../../tickets/${item.id}.md)`).join("\n") + "\n\n## Feedback\n\nDescribe unclear labels and missing next steps. No production record is changed." },
  { path: join(root, "docs/adr/0001-navigation.md"), kind: "adr", fields: { title: "Keep identity visible", status: "accepted" }, body: "## Decision\n\nShow the canonical target before any action. This is fixture content, not a repository decision." },
  ...definitions.map(item => ({ path: join(root, `tracker/tickets/${item.id}.md`), kind: item.type, fields: { id: item.id, title: item.title, work_status: item.status, blocked_by: item.blockers ?? [], parent: "UX-DEMO" }, body: item.body })),
];
async function writeMarkdown(documents: typeof markdown): Promise<void> {
  const input = join(root, "fixture-markdown-input.json");
  await writeFile(input, JSON.stringify(documents));
  try {
    await run("mq", ["--allow-http-import", "--no-lockfile", `--allow-write=${root}`, "-I", "json", "-F", "json", 'import "github.com/harehare/okf.mq" | map(fn(item): write_file(item["path"], okf::okf_stringify(okf::okf_new(item["kind"], item["fields"], item["body"])));)', input]);
  } finally { await rm(input, { force: true }); }
}
await writeMarkdown(markdown);
await run("git", ["-C", root, "add", "."]);
await run("git", ["-C", root, "commit", "--quiet", "-m", "Create disposable UX evidence records"]);
const commit = await run("git", ["-C", root, "rev-parse", "HEAD"]);
const tree = await run("git", ["-C", root, "rev-parse", `${commit}^{tree}`]);
async function receipt(ticket: string, name: string, phase: string, event: string, parent: string | null, extra: Record<string, unknown> = {}): Promise<void> {
  const record = {
    schema: "worktree-receipt/v1", receipt_id: name, workflow_id: ticket, phase, event, status: "completed", attempt: 1,
    parent_receipt: parent, repository: root, worktree: root, workspace_path: root, source_branch: "main", base_branch: "main",
    source_commit: commit, source_tree: tree, muxer: "hrdx", agent: "omp", pane_id: "evidence-fixture", session_id: "fixture-record-not-a-live-session",
    created_at: name.endsWith("complete") ? "2026-11-08T01:02:00Z" : "2026-11-08T01:01:00Z",
    ticket: { id: ticket, backend: "local-markdown", ref: `tracker/tickets/${ticket}.md` }, ticket_ref: `tracker/tickets/${ticket}.md`,
    workflow: { store: "repository", root, ref: `workflows/${ticket}` }, inputs: [], outputs: [], ...extra,
  };
  const file = join(root, `workflows/${ticket}/events/${name}.json`);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(record, null, 2));
}
await receipt("T-REVIEW", "implementation", "implementation", "phase-complete", null);
for (const [ticket, verdict] of [["T-FIX", "FAILURE"], ["T-FINISH", "SUCCESS"]]) {
  const artifact = `workflows/${ticket}/artifacts/reviews/review-result.md`;
  const file = join(root, artifact);
  await mkdir(dirname(file), { recursive: true });
  await writeMarkdown([{ path: file, kind: "Review", fields: { title: "Fixture review", verdict }, body: `Reviewed ${commit}. ${verdict}.\n\nThis is controlled evidence fixture content, not a real review verdict.` }]);
  await receipt(ticket, "review-result", "review", "phase-result", null, { verdict, outputs: [{ kind: "review-artifact", ref: artifact }] });
  await receipt(ticket, "review-complete", "review", "phase-complete", "review-result");
}
await mkdir(join(root, "workflows/T-INVALID/events"), { recursive: true });
await writeFile(join(root, "workflows/T-INVALID/events/invalid.json"), JSON.stringify({ schema: "wrong-schema", receipt_id: "invalid-event", phase: "review", status: "completed", summary: "Deliberately invalid fixture event" }));
console.log(JSON.stringify({ root, commit, tree, records: definitions.map(({ id, type }) => ({ id, type })), safety: "Disposable fixture only. Cancel every OMP action confirmation. No remote push or workflow execution." }));
