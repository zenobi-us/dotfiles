# Implementation review

## Scope

This review checks the implementation of the recommendations in these three agent review files against the changes in commits `ce0a6e90`, `268b57f7`, and `29e82158`.

The review covers committed changes only. It does not include the existing unstaged changes in:

- `.mise/conf.d/devtools-agent/bundles/developer/skills/worktree/scripts/router.mjs`
- `.mise/conf.d/devtools-zot/mise.toml`

No source file was edited for this review. This report is the only new file.

## Commit list

| Commit | Subject |
|---|---|
| `ce0a6e90` | `fix(shared-context): resolve roots through CLI` |
| `268b57f7` | `docs(worktree): use CLI for shared-context paths` |
| `29e82158` | `docs(matt-pocock): use CLI for alignment roots` |

The reviewed range is `ce0a6e90^..29e82158`.

## Recommendation status

The source review files contain 24 top-level findings. This table expands compound findings into 27 atomic checks so each requested implementation point has an explicit result.

| # | Source recommendation | Status | Evidence and assessment |
|---:|---|---|---|
| 1 | Remove publishing references to an undefined `$ALIGNMENT_ROOT`. | **Implemented** | `references/publishing.md` now resolves `ROOT` with `cli.ts root` and uses the reported path. No shell assignment to `$ALIGNMENT_ROOT` remains in the reviewed publishing instructions. |
| 2 | Remove the same undefined variable from ingest instructions. | **Implemented** | `references/ingest.md:13-16,46-47` uses the CLI-reported `root` and does not use an ambient variable. |
| 3 | Reject `index` targets outside the active root. | **Implemented** | `lib.ts:407-411` resolves both paths and checks containment. `cli.ts:113` passes `context.root` into `buildContextIndex`. |
| 4 | Reject symlink escapes for the index target and source files. | **Implemented** | `lib.ts:407-414,428-434,461-468` uses `realpath` checks for the directory, source files, and index file. |
| 5 | Require indexed directories to come from `anchor`, unless trusted mode exists. | **Partially implemented** | The CLI validates containment, but `cli.ts index` accepts any directory below `context.root`. It does not prove that the directory came from `anchor`, and it has no explicit trusted mode. See `cli.ts:108-119` and `lib.ts:407-415`. |
| 6 | Make public-link guidance require remote, visibility, and access-boundary checks. | **Implemented in documentation** | `SKILL.md:79-93` and `references/publishing.md:124-131` require a public repository, a usable remote, a matching access boundary, and a pushed file before a public URL. |
| 7 | Make the private/local fallback consistent with the public-link rule. | **Implemented** | Both documents specify `SharedContext/<relative-path>` for private, local-only, missing-remote, or uncertain cases. |
| 8 | Resolve the storage repository through the CLI. | **Implemented** | `references/publishing.md:9-18,78-81,115` resolves the active root through `cli.ts report` or `cli.ts root`. It no longer reconstructs the root from `dirname` or a shell variable. |
| 9 | Allow local-only ingest and report its publication state. | **Partially implemented** | The procedure allows repository storage and local-only shared storage at `ingest.md:13-17,34-35`. However, the success checklist still requires `storage: shared` at `ingest.md:39`. This contradicts the procedure and can mark a valid repository-local ingest as unsuccessful. |
| 10 | Use an anchored path for screenshots and binary assets. | **Not implemented** | `references/layout.md:150-154` still gives the hand-built path `<root>/<KEY>/screenshot-<subject>.png`. This bypasses `cli.ts anchor` and does not place the asset in the returned source directory. |
| 11 | Use one source-name grammar in code and documentation. | **Implemented** | `layout.md:29-30` documents lowercase letters, numbers, and dashes. `lib.ts:10` and `lib.ts:376-379` enforce the same grammar. |
| 12 | Do not treat shell quoting as path safety. | **Implemented** | The CLI now performs canonical root and symlink checks. Quoted arguments remain in examples, but quoting is no longer the safety control. |
| 13 | Define the relationship between `ALIGNMENT_ROOT`, `root`, and shared storage. | **Implemented** | `shared-context/SKILL.md:34-48` defines the CLI output, and `ALIGNMENT-ROOT.md:7-17` defines `root` as the source of `ALIGNMENT_ROOT` and `repository-root` as the source path. |
| 14 | Discover manual reports through a CLI-resolved ticket anchor. | **Implemented** | `submit.md:54-67` calls `cli.ts anchor --source local --key ... --dry-run` and searches the returned directory. |
| 15 | Make submit publishing conditional on storage mode, remote, and access boundary. | **Implemented** | `submit.md:69-76` separates public, private, local-only, and no-remote cases. |
| 16 | Make every worktree playbook use the CLI for root resolution. | **Implemented** | The start, fix, review, finish, and submit playbooks all state that the CLI is authoritative and forbid derived paths. Example: `start.md:17-21`. |
| 17 | Make `new-report.ts` use an anchored destination instead of a hand-built root. | **Implemented as guidance** | `new-report.ts:16-27` documents the CLI anchor command and access-boundary rule. The script itself still accepts any destination, so the guarantee is procedural rather than enforced by code. |
| 18 | Remove unresolved `$ALIGNMENT_ROOT` from issue-tracker guidance. | **Implemented** | `worktree/references/issue-tracker.md:14-32` uses the CLI-reported root and anchor. |
| 19 | Keep `ALIGNMENT-ROOT.md` as classification guidance, not root resolution. | **Implemented** | The playbooks now use the CLI first and refer to `ALIGNMENT-ROOT.md` only after resolution. |
| 20 | Do not trust prompt-injected context as the root resolver. | **Implemented** | `ALIGNMENT-ROOT.md:7-15` explicitly makes the CLI the source of truth and rejects prompt or environment-derived paths. |
| 21 | Replace the repeated Matt Pocock boilerplate with a CLI-first procedure. | **Partially implemented** | The repeated blocks run the shared-context procedure and use `root`, for example `code-review/SKILL.md:121-125`. They do not themselves say to stop on a non-zero CLI result. They rely on the shared-context skill for that safety rule. |
| 22 | Require an explicit failure stop in the repeated boilerplate. | **Partially implemented** | `ALIGNMENT-ROOT.md:15` has the stop rule, but the 25 repeated skill blocks only say “run the procedure”. A caller that reads only one skill does not see the failure handling in that block. |
| 23 | Remove obsolete `/agent-core context init` and `migrate` commands. | **Implemented** | `setup-matt-pocock-skills/SKILL.md:49-55` now points to the documented CLI procedures and forbids unrequested storage changes. |
| 24 | Remove manually derived shared paths from setup. | **Implemented** | Setup now uses the CLI-reported root at `setup-matt-pocock-skills/SKILL.md:34-42,54-57`; the `<storage_path>/<origin-slug>/` formula is gone. |
| 25 | Add current-path, anchor, index, and publication guards to setup writes. | **Implemented** | `setup-matt-pocock-skills/SKILL.md:96-106` requires the current CLI root, `anchor`, `index`, and publication handling. |
| 26 | Make ticket routing use CLI output and stop on CLI failure. | **Partially implemented** | `reading-and-writing-tickets/SKILL.md:19-28` requires `cli.ts report` and uses its root, but it does not repeat the mandatory stop-on-non-zero rule. The rule exists only in the shared-context skill and `ALIGNMENT-ROOT.md`. |
| 27 | Add CLI write guardrails to domain, architecture, and prototype skills, and refresh setup after storage changes. | **Implemented** | Domain and prototype instructions require CLI resolution, anchor/index, and publication handling. Setup requires a fresh report after `init` or `migrate` at `setup-matt-pocock-skills/SKILL.md:140-143`. Architecture writes remain in the OS temp directory as documented, so no anchor is needed for that artifact. |

## Findings

### High severity

#### H1 — `index` still does not enforce anchor provenance

**Severity:** High

The implementation fixed lexical and symlink containment. It did not implement the full recommendation. `cli.ts:108-119` accepts a caller-supplied directory and passes it to `buildContextIndex`. `validateIndexTarget` only checks that the directory is below the root (`lib.ts:407-415`). A caller can index an arbitrary subdirectory under the root without using `anchor`. This weakens the intended source-directory boundary and leaves the “anchor unless trusted mode exists” part unenforced.

#### H2 — Valid local-only ingest still fails its own success checklist

**Severity:** High

The procedure correctly allows repository-local and local-only writes (`ingest.md:13-17,34-35`). The checklist still says `cli.ts` must report `storage: shared` (`ingest.md:39`). This is a direct internal contradiction. Agents can perform a valid repository-local ingest and then report failure because the checklist cannot be satisfied.

### Medium severity

#### M1 — Screenshot guidance still bypasses the anchor contract

**Severity:** Medium

`layout.md:152` instructs callers to construct `<root>/<KEY>/screenshot-<subject>.png`. The shared-context skill requires `cli.ts anchor` for every target directory (`SKILL.md:104-105`). The binary asset rule should either use a CLI-managed asset anchor or require placement relative to the returned anchor. The current text can create files outside the indexed source directory and outside the documented frontmatter/index workflow.

#### M2 — CLI failure handling is not repeated where the new resolver is required

**Severity:** Medium

The Matt Pocock boilerplate and ticket router require a CLI call but do not state what to do on a non-zero result (`code-review/SKILL.md:123-125`; `reading-and-writing-tickets/SKILL.md:21-28`). The shared-context skill and `ALIGNMENT-ROOT.md` contain the rule, so this is not an immediate runtime defect. It is a documentation integration gap: a caller following a single skill can continue with no resolved root.

#### M3 — Root resolution fails for repositories without an `origin` remote

**Severity:** Medium

`resolveSharedContext` first resolves the Git worktree, then returns `undefined` when `git remote get-url origin` fails (`lib.ts:119-121`). The CLI therefore cannot report or use repository-local context for a repository with no `origin`, although the documentation describes repository storage as valid. `requireContext` then reports “No git repository with an origin remote found” (`cli.ts:51-54`). This is a new edge-case regression from making the CLI the mandatory resolver. A repository-local mode should not need an origin, or the documentation should state this restriction.

### Low severity

#### L1 — The report generator relies on procedural compliance

**Severity:** Low

`new-report.ts` documents the anchor command but does not validate that `<destination-dir>` is the CLI-returned anchor (`new-report.ts:41-60`). This is acceptable for a documentation-only recommendation, but it means the script cannot prevent a caller from writing a report to an arbitrary path. The same applies to public-link checks: the script records guidance but does not inspect repository visibility or remotes.

#### L2 — The recommendation count differs from the number of top-level findings

**Severity:** Low, documentation quality

The three source files contain 9, 6, and 9 top-level findings, for 24 total. The requested report format calls for rows 1–27. This report expands compound findings into 27 atomic checks and states that choice above. No implementation defect follows from the count difference, but the source review files should use stable recommendation IDs in future.

## Tests and validation

- `bun test .mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/test/shared-context.test.ts`
  - **Passed:** 21 tests, 0 failures, 74 expectations.
  - The tests cover origin normalization, context resolution, migration, anchor traversal rejection, frontmatter, index preservation, and CLI help.
- `git diff --check 29e82158^..HEAD`
  - **Passed:** no whitespace errors.
- `git status --short`
  - Found pre-existing unstaged changes in `.mise/conf.d/devtools-agent/bundles/developer/skills/worktree/scripts/router.mjs` and `.mise/conf.d/devtools-zot/mise.toml`. They were not included in this review or changed by it.
- No full repository test command was defined in the root `package.json`. The focused shared-context test was the available implementation test.

The focused tests do not cover the remaining H1, H2, or M1 cases. In particular, they do not assert anchor provenance, the ingest checklist, or screenshot placement.

## Verdict

**FAIL — changes are not ready to accept as a complete implementation of all recommendations.**

The commits make strong progress. The CLI now performs real root and symlink checks. The worktree and Matt Pocock guidance mostly uses the CLI, and the public-link rules are substantially safer. However, three material gaps remain: `index` does not enforce anchor provenance, ingest documentation still rejects valid local-only storage in its checklist, and screenshot guidance still bypasses the anchor rule. The origin-less repository case is an additional medium-severity compatibility risk. Resolve the high-severity findings and the screenshot rule before treating the recommendation set as complete.
