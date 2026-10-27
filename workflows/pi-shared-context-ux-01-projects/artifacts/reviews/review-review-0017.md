---
title: Formal Projects worktree review attempt 3
type: Concept
---

# Formal worktree review — attempt 3

## Verdict

FAILURE. Standards has one P2 blocker. Spec has no supported blockers. NO ADR applies.

## Scope

| Field | Value |
| --- | --- |
| Ticket | `tracker/tickets/pi-shared-context-ux-01-projects.md` |
| Parent specification | `tracker/tickets/pi-shared-context-tui-ux-spec.md` |
| Tracker backend | local-markdown |
| Canonical repository | `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles` |
| Source worktree | `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-pi-shared-context-ux-01-projects` |
| Source branch | `feature/pi-shared-context-ux-01-projects` |
| Base branch | `master` |
| Frozen base | `b22bda0eb4c56c618487092b7fca68fc212632e2` |
| Frozen source | `34e28395c83826cdf46e1f09b8ad7761df2be219` |
| Frozen tree | `47c38e3a6260f875f97fcba05e7f83c0be62b4ec` |
| Timestamp | `2026-10-27T04:39:25.224307Z` |
| Reviewer | OMP pi-context-projects-review-0003, Herdr w7A:p7 |
| Reviewer session | `01a17ba1-8c61-7557-baf8-7a11e38f9d92` |

Exact diff: `git diff b22bda0eb4c56c618487092b7fca68fc212632e2...34e28395c83826cdf46e1f09b8ad7761df2be219`.
The full diff contains ten files, 930 insertions and 79 deletions. It includes commits `26531a0a`, `afb6b874`, `f44a1ea9`, `f4dffcae`, `c986abce` and `34e28395`.

The review covers actions.ts, actions.test.ts, data.ts, explorer.ts, index.ts, modal.ts and projects.test.ts under `mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/`.
It also covers cli.ts, lib.ts and README.md under `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/`.

Canonical records supplied the ticket, parent specification, domain map, domain configuration, tracker configuration and ADR index. CONTEXT.md is absent. The ADR index contains no decisions.
The review consumed implementation-0002, fix-0008, review-0011, fix-0014, fix-complete-0015 and review-start-0016 receipts, the prior review artifact, and the fix-0014 snapshot.
Source came only from the frozen source worktree. Canonical user edits outside these records were not inspected or changed.

Workflow and evidence both resolve to repository storage in the canonical repository. Evidence reference: `workflows/pi-shared-context-ux-01-projects/artifacts/evidence/review-0017`.

## Standards

The fresh Standards session reviewed the full ten-file diff against TypeScript, code-comment and Pi-extension standards and all twelve mandatory smell heuristics.
It reported one documented-standard blocker, STANDARDS-001, and no supported heuristic smells. Repository requirements override generic skill guidance. Tooling-enforced issues were excluded.

The new Projects list supports arrow navigation and Enter, but it has no fuzzy search input, filtered collection, active-query indicator or filtered/total result count.
The extension UX standard requires these controls. Users must traverse the complete stored-project list.

The axis also proposed clearing a filter before Escape closes the modal. That part conflicts with the ticket's explicit Escape contract and is excluded from the required change below.
This exception does not exempt the list from search and count requirements.

The axis performed static review only. It ran no tests, builds, lint, formatters or runtime probes. It changed no source or authoritative records.

Session: `01a17ba3-06dc-75d3-b883-510fbc273750`, pane `w7A:p8`, declared depth 2. Herdr reported `done`, completion sequence 363. The pane was closed.

### STANDARDS-001 — P2 — Projects omits required fuzzy search and result counts

**Axis:** Standards. **ADR:** NO ADR.

**Location:** `mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/modal.ts:186-190,212-223`.

**Requirement:** `creating-pi-extensions/references/ux-patterns.md`, “Lists & Filtering”: “Always provide fuzzy search”, “Show result count”, and “Indicate active filter”.
The standard defines substring and character-sequence matching and a filtered/total count such as `Items (12/45)`.

**Description:** The input branch accepts Escape, q, arrows and Enter only. The renderer slices the complete entries array and renders navigation hints, names and identities.
It renders no query or filtered/total count. This is a documented interaction-standard breach, not a heuristic smell or a missing ticket acceptance criterion.

**Required change:** Add fuzzy filtering over project names and identities. Show the active query and filtered/total count. Keep selection valid after filtering and explain zero results.
Preserve the ticket's explicit Escape-to-close behavior. Do not replace it with the generic skill's filter-clearing Escape behavior.

**Validation command:** `mise exec -- bun test mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/projects.test.ts`.
Add public-modal behavior coverage for subsequence matching, zero results and selection after filtering. Exercise the same path in `/shared-context` → Projects.

**Blocking reason:** The newly introduced list omits an explicit applicable extension interaction requirement. Project discovery becomes linear traversal as the stored-project collection grows.

## Spec

No supported blockers. No missing or partial requirement, scope creep, or wrong implementation was established across the full ten-file diff. NO ADR applies.

SPEC-001 and SPEC-003 are resolved by inspection. SPEC-002 remains resolved.
Existing hosted stores now have explicit identity recovery through a verified checkout or authoritative remote. Recovery validates store identity and preserves existing metadata and routes.
Commands use a verified surviving execution directory from the selected project, rather than the original session checkout.
Current-project stored fallback and cached capability refresh remain intact.

The recovery command directly repairs the existing-store compatibility blocker. It does not introduce unrelated migration or a second registry.
Workspace caching, selected action targets, focus traversal, the read-only alignment indicator and watcher suspension remain within this slice.

The axis performed static review only. It ran no tests, builds, lint, formatters or runtime probes. It changed no source or authoritative records.
Historical failures were accepted without rerunning. GitHub fixture evidence is not live-service acceptance.

Session: `01a17ba3-06df-75c3-876f-517b47b4ccc2`, pane `w7A:p9`, declared depth 2. Herdr reported `done`, completion sequence 365. The pane was closed.

## Prior finding status

| Finding | Status | Evidence |
| --- | --- | --- |
| SPEC-001 | Resolved | Explicit checkout/remote recovery; focused modal tests; parent CLI rejection, idempotence and byte-preservation probes |
| SPEC-002 | Remains resolved | Current-entry stored fallback and capability refresh remain in source; focused modal suite passes |
| SPEC-003 | Resolved | Selected-context execution wrapper; actual Pi live B refresh after both A and B checkouts were removed |

## Validation

| Check | Observed result |
| --- | --- |
| Focused project and action suites | 26 passed, 0 failed, 144 assertions |
| Explicit remote recovery | Exit 0; saved canonical `github.com/review-beta/repo` |
| Idempotent verified-checkout recovery | Exit 0; route bytes unchanged |
| Mismatched remote | Exit 1; selected store rejected |
| Both identity sources supplied | Exit 1; exactly-one-source check rejected input |
| Existing identity metadata after checkout removal | Exit 0; authored metadata bytes and route bytes unchanged |
| Actual Pi v1.1.0 | Opened Repo A; selected recovered shared B; B tracker and Files stayed readable after removing both checkouts |
| Actual Pi live update | B displayed `Both checkouts removed - live B` after an mq-authored ticket update |
| Actual Pi action restriction | Displayed `No usable checkout`; no action or model request was sent |
| Actual Pi session scope | Footer retained original A directory while B supplied tracker and Files |
| Actual terminal sizes | Observed 120×40, 80×24 and 40×12 with NO_COLOR=1 |
| Terminal shutdown | termscope close reported child exit 0; termscope process exited 0 |
| Source preservation | Frozen commit and tree matched; porcelain status was empty |

Focused command:

```sh
mise exec -- bun test mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/projects.test.ts mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/actions.test.ts
```

Actual Pi launch:

```sh
termscope session --cols 120 --rows 40 -- /home/zenobius/.local/share/mise/installs/github-earendil-works-pi/latest/pi --offline --no-session --no-extensions --no-skills --no-prompt-templates --no-context-files --no-mcp -e /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-pi-shared-context-ux-01-projects/mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/index.ts
```

The disposable CLI probe ran the source `cli.ts recover-identity SLUG` entry point with an isolated HOME and shared store.
It checked explicit remote recovery, repeated checkout recovery, mismatched identity, ambiguous sources and byte preservation of existing authored metadata.
The actual Pi probe used real temporary Git repositories, real route resolution, real mq and native filesystem watchers. It used local Markdown records, not a hosted-service substitute.
Focused modal tests use labelled GitHub fixtures. No live GitHub claim is made.

Evidence lives in [the resolved evidence directory](../evidence/review-0017/).
It includes `identity-boundary.json`, `focused-tests.txt`, `pi-runtime.json`, three Files snapshots and two Projects snapshots.
Temporary fixture stores and the setup script were removed after proof. No permanent tests or documentation were changed.

The first terminal wait searched for startup text `offline`, which Pi did not display. A snapshot established that Pi was ready.
A later exploratory typing probe occurred while Projects still displayed its loading state. It does not prove filtering behavior and is excluded from finding evidence.
The finding rests on the exact input/render branches and the applicable standard. Ready Projects snapshots confirm the visible list and missing counts.
A first shutdown wait timed out. A subsequent protocol close reported child exit 0 and the termscope process exited 0.

Both fresh Herdr launches returned startup timeouts despite running agents. Concrete pane reads confirmed the sessions; neither was relaunched.
Completion was established through Herdr `done` signals, not pane idleness. Both handoffs declared depth 2 and prohibited further children. Neither axis spawned a child.

The parent did not rerun broad compiler failures, known shortcut conflicts or historical failures on obsolete source.
Known narrow tracker clipping and host shortcut conflicts remain outside scope. Prior fix receipts report 123 focused tests and scoped TypeScript success; those are historical results, not new runs.

## Next step

Run `fix pi-shared-context-ux-01-projects` for STANDARDS-001. The parent owns tracker verdict publication and phase completion.
No fix, commit, merge, rebase, push, manifest update, projection update or later phase was executed.

Axis totals: Standards 1 finding, worst P2; Spec 0 findings, no blocking severity.

