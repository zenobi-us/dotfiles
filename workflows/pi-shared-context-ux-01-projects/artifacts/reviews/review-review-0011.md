---
title: Formal Projects worktree review attempt 2
type: Concept
---

# Formal worktree review — attempt 2

## Verdict

FAILURE. Standards: zero findings. Spec: two blocking P2 findings, SPEC-003 and SPEC-001. NO ADR applies.

## Scope

| Field | Value |
| --- | --- |
| Ticket and tracker reference | `tracker/tickets/pi-shared-context-ux-01-projects.md` |
| Parent specification | `tracker/tickets/pi-shared-context-tui-ux-spec.md` |
| Tracker backend | local-markdown |
| Canonical repository | `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles` |
| Source worktree | `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-pi-shared-context-ux-01-projects` |
| Source branch | `feature/pi-shared-context-ux-01-projects` |
| Base branch | `master` |
| Frozen base | `8a453ef5df4ad3e94e79005c4c12481792f3ba4d` |
| Frozen source | `f4dffcaebf159cb857eb6008fad80dfb03e214fc` |
| Frozen tree | `76467ed6e58b3a364a74a19c7f85bcd69c8975bb` |
| Timestamp | `2026-10-27T03:58:07.535376Z` |
| Reviewer | omp pi-context-projects-review-0002, Herdr w7A:p2 |
| Reviewer session | `01a17b79-3563-7446-8935-db01be641aa8` |

Exact diff: `git diff 8a453ef5df4ad3e94e79005c4c12481792f3ba4d...f4dffcaebf159cb857eb6008fad80dfb03e214fc`.

Commits: `26531a0a`, `afb6b874`, `f44a1ea9`, `f4dffcae`. The full diff contains nine files, 756 insertions and 78 deletions.

The review covers actions.ts, actions.test.ts, data.ts, explorer.ts, index.ts, modal.ts and projects.test.ts under `mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/`. It also covers lib.ts and README.md under `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/`.

Later tracker hierarchy and reader tickets remain outside scope. Known narrow tracker clipping and host shortcut conflicts are not findings.

## Inputs and authority

The canonical repository supplied the ticket, parent specification, CONTEXT-MAP.md, domain configuration, tracker configuration and ADR index. CONTEXT.md is absent. The ADR index contains no decisions. Source came only from the frozen source worktree.

The reviewer read review-start-0010, implementation-0002, fix-0008, fix-complete-0009 and review-0005 receipts. The reviewer also read the fix-0008 draft snapshot and review-review-0005 artifact. Historical failures remain established evidence, not claims that needed reconfirmation.

Workflow store: repository. Workflow reference: `workflows/pi-shared-context-ux-01-projects`. Evidence was resolved independently from the canonical repository to `workflows/pi-shared-context-ux-01-projects/artifacts/evidence/review-0011`.

## Standards

The fresh Standards session reviewed all nine files against the frozen base. It found zero documented-standard breaches and zero reportable heuristic smells. Repository rules override the complete smell baseline. Tooling-enforced issues were excluded. NO ADR applies.

The session ran the project and action suites: 23 tests passed, zero failed, 127 assertions. A separate runtime probe preserved `github.com/Owner-With-Hyphens/repo.with-dots_and-dashes` and returned `checkoutAvailable: false`.

The report states that no source or authoritative review record was written. It does not claim visual acceptance. The parent inspected the transport report before aggregation.

Session: `01a17b7c-1351-73f3-9f97-a7c9f64238e4`, pane `w7A:p5`, declared review depth 2. Herdr reported done, completion sequence 335. The pane was closed after completion.

## Spec

The fresh Spec session found two consumer-visible failures. It reported no separate scope-creep finding. Its project and action suites passed 23 tests. Its temporary-store probes reproduced both failures. The parent independently confirmed the failure paths below.

Session: `01a17b7a-bc40-72f9-a6b1-4609e841cb0b`, pane `w7A:p4`, declared review depth 2. Herdr reported done, completion sequence 339. The pane was closed after completion.

### SPEC-003 — P2 — The execution wrapper keeps the original session directory and its candidate shared root

**Axis:** Spec. **ADR:** NO ADR.

**Location:** `mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/index.ts:618-622`.

**Requirement:** Ticket acceptance criteria 3 and 8: the selected project owns tracker reads; a project without a usable checkout retains readable context.

**Description:** The execution wrapper keeps the original session directory and its candidate shared root. Repository-only project A need not have that shared root. After selecting shared project B and removing A, B Markdown reads fail because mq is launched in a missing directory.

**Required change:** Choose a verified surviving execution directory for selected-project reads without changing the Pi session directory. Cover repository-only A to shared B followed by removal of A.

**Validation command:** `mise exec -- bun /tmp/review-0011-probe.ts /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-pi-shared-context-ux-01-projects`. Run from `/tmp`. The disposable program is included below.

**Observed result:** `BEFORE Surviving B ticket; after A removal ENOENT: no such file or directory, posix_spawn 'mq'; surviving-root control still reads Surviving B ticket.`

**Why this blocks completion:** Readable selected-project context becomes unavailable solely because an unrelated previous checkout disappears.

### SPEC-001 — P2 — Legacy shared GitHub stores have no .context-project.json

**Axis:** Spec. **ADR:** NO ADR.

**Location:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/lib.ts:285-294`.

**Requirement:** Ticket What to build: browse existing tracker and Files workspace; acceptance criterion 8: retain readable context without a usable checkout.

**Description:** Legacy shared GitHub stores have no .context-project.json. Enumeration provides no origin. Stored resolution then returns an empty canonicalOrigin, and the existing GitHub loader rejects it before issuing a request. New initialization metadata fixes newly initialized stores, not existing ones.

**Required change:** Provide an explicit identity-recovery path for existing hosted stores using an authoritative remote from a verified checkout or explicit user-supplied remote. Explain recovery when the identity is unavailable. Never reconstruct a remote from a lossy slug or scan unrelated repositories.

**Validation command:** `mise exec -- bun /tmp/review-0011-probe.ts /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-pi-shared-context-ux-01-projects`. Run from `/tmp`. The disposable program is included below.

**Observed result:** `LEGACY_ORIGIN ""; GitHub backend requires a github.com OWNER/REPO canonical origin.`

**Why this blocks completion:** The Projects feature cannot open an existing supported hosted tracker unless a new, unstated metadata prerequisite is met.

### Prior finding status

SPEC-002 is resolved for the reviewed direct-current-entry scenario. Current-project resolution now falls back to stored context and refreshes cached capabilities. The focused tests exercise that behavior.

SPEC-001 is only partly resolved. New stores retain authoritative origin metadata, but existing hosted stores still lack a recovery path. This review keeps the original finding ID for that remaining compatibility gap. SPEC-003 names the separate execution-directory defect.

## Validation

| Check | Observed result |
| --- | --- |
| Parent `mise exec -- bun test mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/projects.test.ts` | 11 passed, 0 failed, 58 assertions |
| Independent axis project/action suites | Each report records 23 passed, 0 failed, 127 assertions |
| Parent isolated failure probe | Both Spec failures reproduced; surviving-directory control passed |
| Actual Pi v1.1.0 terminal | `/shared-context` opened the Repo tracker; Esc opened Projects; the current canonical identity appeared; Enter returned to its tracker |
| Actual terminal resize | Observed 120x40, 80x24 and 40x12; known narrow tracker clipping remains outside scope |
| Pi shutdown | Terminal exited 0; no model request was sent |
| Source preservation | HEAD and tree matched the frozen target; porcelain status was empty |

Actual Pi launch:

```sh
termscope session --cols 120 --rows 40 -- /home/zenobius/.local/share/mise/installs/github-earendil-works-pi/latest/pi --offline --no-session --no-extensions --no-skills --no-prompt-templates --no-context-files --no-mcp -e /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-pi-shared-context-ux-01-projects/mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/index.ts
```

The runtime protocol is stored at `../evidence/review-0011/pi-runtime.json`. Confirmed probe output is stored at `../evidence/review-0011/failure-probes-confirmed.txt`. Earlier probe logs record a fixture argument error and a route/config mismatch; neither is a product finding.

The failure probe uses real route resolution and record loading. Its executor copies the exact execution-directory rule from index.ts:618-622. It does not claim a complete Pi reproduction of deleting the original checkout. The actual Pi smoke used the source checkout without deleting it.

The legacy probe changes only temporary fixture configuration and removes the new metadata to model a pre-feature store. Its GitHub identity failure occurs before network access.

The reviewer did not rerun known unrelated broader TypeScript failures. Prior fix receipts record 120 focused tests, scoped TypeScript, checkoutless GitHub loading and actual checkout-removal Pi smoke. Those are historical results, not new parent runs. This review does not claim a new colour/monochrome audit, mouse-coordinate audit or complete acceptance matrix.

## Reproduction program

Save the following as `/tmp/review-0011-probe.ts`, then run the validation command above. All fixture Markdown is created through mq. The program removes its temporary repositories and stores.

```typescript
import { mkdtemp, mkdir, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
const source = process.argv[2];
// The caller selects the frozen source worktree at runtime.
const lib = await import(`${source}/mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/lib.ts`);
const { loadExplorerSnapshot } = await import(`${source}/mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/data.ts`);
const root = await mkdtemp(join(tmpdir(), "review-0011-"));
async function run(command: string, args: string[], cwd = root) {
  const child = Bun.spawn([command, ...args], { cwd, stdout: "pipe", stderr: "pipe" });
  const [stdout, stderr, code] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
  return { stdout: code ? `${stdout}${stderr}` : stdout, code };
}
async function putMarkdown(file: string, text: string) {
  await mkdir(join(file, ".."), { recursive: true });
  const result = await run("mq", ["--allow-http-import", "-I", "null", "-F", "raw", "--argjson", "body", JSON.stringify(text), 'import "github.com/harehare/okf.mq" | body', "-o", file, "--no-clobber"]);
  if (result.code) throw new Error(result.stdout);
}
try {
  const base = join(root, "shared");
  const a = join(root, "a");
  const b = join(root, "b");
  for (const [repo, owner] of [[a, "a"], [b, "b"]]) {
    await mkdir(repo, { recursive: true });
    await run("git", ["init", "--quiet", repo]);
    await run("git", ["-C", repo, "remote", "add", "origin", `https://github.com/${owner}/repo.git`]);
  }
  const exec = (command: string, args: string[]) => run(command, args);
  const initialA = await lib.resolveSharedContext(exec, a, base);
  let sharedB = await lib.resolveSharedContext(exec, b, base);
  await lib.initializeSharedContext(sharedB);
  sharedB = await lib.resolveSharedContext(exec, b, base);
  await putMarkdown(join(sharedB.root, "docs/agents/issue-tracker.md"), "---\nbackend: local-markdown\n---\n");
  await putMarkdown(join(sharedB.root, "tracker/tickets/surviving.md"), "---\nid: surviving\ntitle: Surviving B ticket\nwork_status: open\nblocked_by: []\n---\n");
  const storedB = await lib.resolveStoredContext({ slug: sharedB.slug, root: sharedB.candidateSharedRoot });
  // This is the execution-directory rule in index.ts:618-622.
  const originalRun = async (command: string, args: string[]) => {
    const checkout = (await stat(a).catch(() => undefined))?.isDirectory();
    return run(command, args, checkout ? a : initialA.candidateSharedRoot);
  };
  console.log("BEFORE", (await loadExplorerSnapshot(storedB, originalRun)).tickets.map((t: { title: string }) => t.title));
  await rm(a, { recursive: true });
  try {
    await loadExplorerSnapshot(storedB, originalRun);
    throw new Error("Expected original-execution-root failure did not occur");
  } catch (error) { console.log("SPEC-003", String(error)); }
  console.log("SURVIVING_ROOT_CONTROL", (await loadExplorerSnapshot(storedB, exec)).tickets.map((t: { title: string }) => t.title));
  // Replace fixture configuration through mq. Source and canonical files stay untouched.
  await rm(join(sharedB.root, "docs/agents/issue-tracker.md"));
  await putMarkdown(join(sharedB.root, "docs/agents/issue-tracker.md"), "---\nbackend: github\n---\n");
  const routeFile = join(sharedB.root, ".context-routes.toml");
  const routes = await Bun.file(routeFile).text();
  await Bun.write(routeFile, routes.replace('[records.tickets]\nadapter = "local-markdown"\nstore = "shared"', '[records.tickets]\nadapter = "github"'));
  await rm(join(sharedB.candidateSharedRoot, ".context-project.json"));
  const legacy = await lib.resolveStoredContext({ slug: sharedB.slug, root: sharedB.candidateSharedRoot });
  console.log("LEGACY_ORIGIN", JSON.stringify(legacy.canonicalOrigin));
  try {
    await loadExplorerSnapshot(legacy, exec);
    throw new Error("Expected legacy-origin failure did not occur");
  } catch (error) { console.log("SPEC-001", String(error)); }
} finally { await rm(root, { recursive: true, force: true }); }
```

## Source and workflow preservation

No source, tests, configuration, generated files, tracker, manifest, projections or snapshots were changed. No commit, fix, push, merge or rebase ran. Old review artifacts remain untouched. Only this review artifact, its receipt and resolved validation evidence were created. Temporary handoffs and the probe program were removed after proof.

Both independent axes used fresh tabs in the existing workspace. A failed initial Standards startup launched a nested console rather than the review. That pane, w7A:p3, was closed and replaced with fresh w7A:p5. It supplied no review finding. No authoritative axis review body was created.

## Next step

Run `fix pi-shared-context-ux-01-projects` for SPEC-003 and the remaining SPEC-001 gap. The parent owns tracker verdict recording, phase completion and projections. This reviewer did not start those phases.

Standards: 0 findings. Spec: 2 blocking findings; worst severity P2.
