# Review review-0005

## Verdict

FAILURE. Standards: 2 blocking findings, highest severity high. Spec: 5 blocking findings, highest severity high.

## Identity and scope

Timestamp: 2026-11-22T04:08:41.938278+00:00

Ticket: tracker/tickets/skill-contract-manifests-07-shared-context.md

Initiative: tracker/initiatives/skill-contract-manifests/index.md

Source branch: feature/skill-contract-manifests-07-shared-context. Base branch: master.

Frozen source commit: 2d5779034ef9f36b24356632a327070ae61daea0

Frozen source tree: dc28c302db0cd500e2ca3f11ba9771ec884b328d

Fixed review base: a377108e5df4f6eef8c3d259812c2cdab71dd4de

Three-dot merge base: 28f60a5c73df236962d8dfcea159f59c56a95ee9

The exact source was clean before review. The final identity check is recorded below. Publication uses the designated context checkout, not the frozen source.

The actual two-dot comparison contains 224 paths. The ticket-specific three-dot comparison contains 16 paths and one commit, 2d577903. Base-only muxer integration and context/workflow records are not source regressions. Base movement does not change this verdict's frozen target.

### Changed scope

- **Path:** `mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json`
- **Path:** `mise/conf.d/devtools-agent/bundles/agent-core/.claude-plugin/plugin.json`
- **Path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/SKILL.md`
- **Path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/contracts.json`
- **Path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/references/changelog.md`
- **Path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/references/configuration-upgrades.md`
- **Path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/references/contracts.md`
- **Path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/references/layout.md`
- **Path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/README.md`
- **Path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/cli.ts`
- **Path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/config.ts`
- **Path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/contracts.ts`
- **Path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/layout.ts`
- **Path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/lib.ts`
- **Path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/test/contracts.test.ts`
- **Path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/test/shared-context.test.ts`

### Contracts and integration hazards

- **Contract:** `shared-context-routes/v2`
- **Contract:** `shared-context-routes/v3`
- **Contract:** `shared-context-layout/v1`
- **Contract:** `shared-context-layout/v2`
- **Contract:** `shared-context-config/v1`
- **Contract:** `shared-context-project/v1`
- **Contract:** `shared-context-source/v1`
- **Contract:** `shared-context-index/v1`
- **Contract:** `shared-context-resolution/v1`
- **Contract:** `skill-contract-manifest/v1`
- **Contract:** `skill-contracts safeUpgrade/bulkUpgrade`
- **Contract:** `shared-context resolution consumers: worktree and tracker`

Resolution retains location field names and adds schemaVersion. Tracker and worktree formats remain externally owned. Source resolution and canonical worktree inspection ran successfully. The concurrent worktree-08/evidence-09 streams were not changed or merged. Integration must combine this frozen source with the current base and rerun consumer checks. A clean textual merge alone is insufficient.

## Standards

Standards review requires changes. Two migration correctness findings remain. Alignment migration can discard effective independent routing. Empty-kind migration can commit a route and then fail because the identity directory does not exist.

I inspected the full 16-file ticket diff, the canonical ticket and parent initiative, repository context, the ADR index, shared-context rules, and the shared upgrade implementation. Findings use static source traces, not executed scenarios. No tests, builds, formatters, or runtime verification were executed. The parent owns verification.

Reviewed commit: 2d5779034ef9f36b24356632a327070ae61daea0. Reviewed tree: dc28c302db0cd500e2ca3f11ba9771ec884b328d. Fixed base: a377108e5df4f6eef8c3d259812c2cdab71dd4de. The full commit list contains one ticket commit: 2d577903 feat: skill-contract-manifests-07-shared-context adopt contracts. The three-dot merge base is 28f60a5c73df236962d8dfcea159f59c56a95ee9. I also inspected the actual two-dot comparison. Its unrelated base-only advancement is not attributed to this ticket.

The findings below cite shared-context storage rules. No applicable ADR exists. No smell-only finding blocks this review.

### Standards-1 — high — NO ADR

File: `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/lib.ts:707`

Alignment migration can silently redirect every record kind to shared storage. With a repository route manifest and no shared policy, migration copies AGENTS.md into the shared root but now updates only the repository manifest. On the next resolution, loadRoutes sees shared instructions and skips that manifest. It returns defaultRoutes('shared'), although tickets, workflows, evidence, and sources were not migrated.

Required change: Keep the updated explicit routing policy authoritative after alignment migration. Preserve authored text and all unselected routes. Make the loader and migration agree on policy precedence.

Validation command/scenario: `In an isolated repository with repository routes and a nonempty AGENTS.md, run shared-context migrate alignment --to shared. Then run resolve tickets --json, resolve workflow --id TASK-1 --json, and resolve sources --json. Confirm that all three retain repository storage and alignment alone uses shared storage.`

Observed evidence: Observed migrate alignment --to shared exit 0. Later tickets, workflow TASK-1, and sources resolution all returned store=shared, although the persisted explicit policy kept those kinds in repository storage. Only AGENTS.md was copied.

### Standards-2 — medium — NO ADR

File: `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/lib.ts:714`

Migration of an empty record kind can fail after it has committed the route. With repository routing and no shared root, the explicit-manifest branch no longer creates candidateSharedRoot. If sources do not exist, the copy loop creates nothing. safeUpgrade commits sources=shared, then writeProjectIdentity writes into a missing directory and fails with ENOENT. A retry then refuses because the route already uses shared storage.

Required change: Create the required shared identity directory before committing the routing change. Keep empty-kind migration successful, and avoid reporting failure after a predictable missing-directory error has left the route changed.

Validation command/scenario: `In an isolated repository with repository routes, no sources directory, and no shared context directory, run shared-context migrate sources --to shared. Require exit zero. Inspect the identity file and run resolve sources --json to confirm the committed shared route.`

Observed evidence: Observed empty sources migration exit 1 with ENOENT for .context-project.json after routes were upgraded to v3 and sources=shared persisted. Resolution used shared; retry failed with sources already uses shared.

## Spec

FAILURE: five Spec findings. Migration can copy records before rejecting an unsafe conversion. Markdown mutation lacks complete identity/content validation. Lexical history guards permit in-store symlink aliases. Source ingestion and identity recovery do not complete the new-output identity cutover.

Reviewed frozen commit 2d5779034ef9f36b24356632a327070ae61daea0 against fixed base a377108e5df4f6eef8c3d259812c2cdab71dd4de. Read the complete 16-file ticket-specific three-dot diff. Inspected the actual 224-file two-dot comparison and separated the 212-file base-only advancement from merge-base 28f60a5c73df236962d8dfcea159f59c56a95ee9. Apparent muxer and workflow removals belong to reverse base advancement, not this ticket. The shared plugin version advancement overlaps both sides.

Route/layout manifests, explicit legacy numeric readers, resolution identity, safe configure-route integration, explicit bulk selection, and read-only default configuration handling are present. Tracker and workflow formats remain under their existing owners. No relevant contract ADR appears in the ADR index.

Read both complete canonical requirement records through mq, plus domain context and owning guidance. This was a read-only static review. No source edits, tests, builds, formatters, operation scenarios, or workflow receipts were produced. Validation commands describe required follow-up checks; they were not exercised.

### SPEC-01 — high — NO ADR

File: `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/lib.ts:701`

Storage migration persists copied files before it checks whether the route content can be upgraded. A valid legacy TOML header written as "schema" = 2 passes readConfiguration and the mutate-only preflight. The header converter later rejects that syntax. The command then fails after creating target directories and copying records.

Requirement and source evidence: Exact ticket requirement: "Reject unknown, ambiguous, or unsafe conversion without persisted changes." Parent requirement: "Run automatic upgrades before an otherwise authorised mutation." Source: lib.ts:696-700 calls loadContracts and configurationOwner.mutate only; :701-704 creates directories and copies files; :708 invokes safeUpgrade afterward. contracts.ts:49-53 requires an unquoted, column-zero schema assignment and throws otherwise. contracts.ts:86 validates TOML but does not run that header conversion. This is static control-flow evidence; no scenario was executed.


Required change: Preflight the complete source identification, upgrade path, conversion, preservation, destination validation, and requested route mutation before copying any records. Keep the final guarded commit, and ensure a rejected conversion leaves the target store unchanged.

Validation command/scenario: `"$SHARED_CONTEXT_SKILL_ROOT/scripts/shared-context/cli.ts" migrate sources --to shared # Fixture: repository source record, absent shared target, legacy route header "schema" = 2. Expect rejection and no copied target files.`

Reviewer evidence: Observed legacy schema = 0x2 resolve exit 0. migrate workflows --to shared exited 1: Configuration header syntax requires an explicit decision. Route bytes stayed unchanged, but target workflows/SMOKE/payload.txt existed.

### SPEC-02 — high — NO ADR

File: `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/lib.ts:919`

Index mutation does not validate the declared Markdown contract. The line parser silently overwrites duplicate keys, so an index with schemaVersion: shared-context-index/v99 followed by schemaVersion: shared-context-index/v1 is accepted and rewritten. Source fields are also converted to strings without YAML type checks. A declared v1 index with missing metadata or generated_by belonging to another owner is accepted when markers exist.

Requirement and source evidence: Exact parent requirement: "Validate artifact content against its declared source contract." Exact ticket requirement: "Reject unknown, ambiguous, or unsafe conversion without persisted changes." lib.ts:833-843 uses a regex line parser and assigns fields[entry[1]] repeatedly; :895-899 checks only a prefix and source pattern; :919-920 checks only the surviving schemaVersion string; :926-929 writes the managed block. The new authoritative references/contracts.md defines index source, scope, generated_by, generated_at and a string-valued source contract. Those metadata rules have no corresponding checks at this mutation boundary. Static evidence only.


Required change: Parse frontmatter with a structured parser that rejects duplicate keys. Validate explicit identity and the complete owned source/index contract before producing or rewriting the index. Keep externally owned source documents opaque. Reject ambiguous identities and invalid owned metadata without writes.

Validation command/scenario: `"$SHARED_CONTEXT_SKILL_ROOT/scripts/shared-context/cli.ts" index "$SOURCE_DIR" --kind source --source web --library # Fixture: managed index with conflicting duplicate schemaVersion keys. Expect nonzero and byte-identical index.`

Reviewer evidence: Observed managed index with v99 then v1 duplicate schemaVersion keys: index exited 0 and changed bytes. Separately, source schemaVersion: "shared-context-source/v99" # future contract indexed successfully and created index.md.

### SPEC-03 — high — NO ADR

File: `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/lib.ts:877`

The new immutable-history guard checks lexical path components, not the resolved target. An in-store alias such as sources/library/web -> workflows/TASK/artifacts/evidence/RUN passes the root containment check and lets index rewrite an immutable artifact. The configuration upgrade adapter has the same ancestor-symlink bypass for its events/artifacts guard.

Requirement and source evidence: Exact parent requirement: "Keep immutable historical artifacts unchanged. Use explicit historical readers; do not rewrite receipt or event chains to adopt current field names." Exact ticket requirement: "Preserve authored configuration and historical records." lib.ts:877 rejects events/artifacts only in the supplied directory string. :861-867 resolves symlinks but checks only that the target stays under the store. :880 resolves the real directory without applying the immutable guard; :928 and :940 write via the alias. contracts.ts:68-70 also checks lexical components only. skill-contracts/scripts/upgrades.ts:43 uses resolve rather than realpath; :49-54 checks only the final file, so an ancestor directory symlink is not rejected. Static evidence only.


Required change: Apply immutable-history checks to canonical filesystem targets, including ancestor symlinks, before any mutation. Use the same target identity for the upgrade lock, mutable check, and final write. Reject aliases into events/artifacts without changing history.

Validation command/scenario: `"$SHARED_CONTEXT_SKILL_ROOT/scripts/shared-context/cli.ts" index "$SOURCE_ALIAS" --kind source --source web --library # Fixture: alias points inside the same store to workflows/TASK/artifacts/evidence/RUN. Expect rejection and unchanged historical index.`

Reviewer evidence: Observed sources/library/web symlink to workflows/TASK/artifacts/evidence/RUN. Index exited 0 and changed the historical index through the alias.

### SPEC-04 — medium — NO ADR

File: `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/contracts.json:3`

Source ingestion remains an unversioned output that the manifest does not declare. The manifest accepts shared-context-source/v1 but omits it from produces. The owning ingest procedure still requires the old six-field frontmatter template, which contains no schemaVersion. New source records therefore do not adopt the initiative contract policy.

Requirement and source evidence: Exact ticket requirement: "Cover owned route, layout, source/index, resolution-result, and other independently consumed structured formats that apply." Exact parent requirements: "Use `schemaVersion` with the identifier form `{record-family}/v{positive-integer}` for new and explicitly migrated domain artifacts." and "`produces` lists output contracts." contracts.json:3 omits shared-context-source/v1, while :4 and :12 accept and define it. references/layout.md:53-62 still shows only source, id, title, url, fetched_at, linked_from. references/ingest.md step 7 requires that template, and the ticket diff updates only the layout TOML example in that file. Static procedure inspection; ingestion was not executed.


Required change: Declare the owned source output in produces and update the canonical ingest/frontmatter instructions and examples to emit its explicit schemaVersion. Keep old source copies readable under an explicit legacy rule. Do not relabel externally owned formats or rewrite source history during inspection.

Validation command/scenario: `"$SKILL_CONTRACTS_ROOT/scripts/router.ts" validate --skill "$SHARED_CONTEXT_SKILL_ROOT" # Also perform one actual ingest through the owning procedure and inspect the new source identity; manifest validation alone cannot prove this producer.`

Reviewer evidence: Static producer evidence only: manifest omits source from produces; ingest step 7 requires the layout frontmatter template, whose six fields omit schemaVersion. No ingestion operation was executed.

### SPEC-05 — medium — NO ADR

File: `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/lib.ts:328`

The project-identity producer cutover is incomplete. writeProjectIdentity stamps new records, but recoverStoredContextIdentity still creates a fresh .context-project.json containing only origin. The same owned operation family therefore emits both versioned and unversioned new identities.

Requirement and source evidence: Exact parent requirement: "Use `schemaVersion` with the identifier form `{record-family}/v{positive-integer}` for new and explicitly migrated domain artifacts." Exact ticket requirement: "Introduce new versions for affected field-name changes and update producers, validators, consumers, examples, and guidance together." lib.ts:342 adds schemaVersion for initialization. The independent public producer at :326-328 writes JSON.stringify({ origin: ... }) with flag wx and no identifier; cli.ts:101-106 exposes it as recover-identity. contracts.json:3 declares shared-context-project/v1 as produced. Static evidence only.


Required change: Make identity recovery emit schemaVersion: shared-context-project/v1 for a newly created record. Keep its exclusive-create behavior and preserve existing historical identity bytes. Share the new-record serialization rule with initialization without making recovery rewrite old records.

Validation command/scenario: `"$SHARED_CONTEXT_SKILL_ROOT/scripts/shared-context/cli.ts" recover-identity "$SLUG" --remote "$ORIGIN" # Fixture: existing stored context with no .context-project.json. Inspect new schemaVersion; repeat and verify byte preservation.`

Reviewer evidence: Observed recover-identity exit 0 for an existing isolated context with no identity file. Persisted JSON was {"origin":"https://github.com/example/contracts"}, without schemaVersion.

## Validation

The independent axis reports above describe their static work. The aggregate reviewer then exercised owning commands in isolated temporary repositories.

| Check | Observed result |
|---|---|
| Frozen source identity before review | Assigned commit/tree; clean |
| Canonical worktree inspector | historyValid=true; no receipt diagnostics; exact clean source. Its generic recovery output cannot identify the active reviewer. The assigned review-start and run establish this session's ownership. |
| Source CLI resolve ticket --id skill-contract-manifests-07-shared-context --json | Exit 0; shared-context-resolution/v1; exact source ticket path |
| Source skill-contracts router validate --skill <source shared-context skill> | Exit 0; all nine definitions and both procedures resolve |
| Isolated read-only resolve workflow | Exit 0; legacy routing bytes unchanged |
| Isolated configure-route workflows/shared | Exit 0; v2 to v3; authored comment preserved; inherited evidence pinned to repository |
| Isolated bulk upgrade layout + future routes | Expected exit 1/partial; layout v1 to v2 with comment preserved; rejected route bytes unchanged |
| Targeted migration and index scenarios | Reproduced Standards-1, Standards-2, SPEC-01, SPEC-02, SPEC-03, SPEC-05 as detailed above |
| Scoped suite in frozen checkout | Runtime prerequisite failure: Bun test could not resolve version-qualified Ajv. NODE_PATH and an external preload did not repair this resolver limitation. Not a product failure. |
| Scoped suite from exact Git archive | 63 pass, 0 fail, 289 assertions across 4 files. Real dependencies installed outside source; versioned package aliases only in temporary sandbox. |

Executed passing suite: `mise exec -- bun test mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/test`, cwd was an isolated archive of shared-context and skill-contracts from the frozen source commit. No product or test file was edited. CLI reproductions used the original source shebang entrypoint. Temporary fixtures used isolated HOME and real Bun on PATH. The initial fixture lacked Bun on its isolated PATH; this harness prerequisite was corrected before observations above. An initial migration probe used incorrect flags; --help supplied the corrected `migrate workflows --to shared` form.

SPEC-04 is a static producer/guidance finding. No live source ingestion or live repository storage mutation occurred. Temporary reproduction scripts and dependency sandboxes were removed after capture. No source fixes, commits, tracker changes, or projections were made.

## Independent sessions

Standards child run: bffa6b1e-10fa-43e0-81c3-4881a9f28107. Verified result SHA-256: fa2cdd3f8b7d4494353fd279fd1b8f7b865d6e79248ec5d6c4f49acae9a84709. Acknowledged; owned tab removed; shutdown confirmed at 2026-11-22T04:03:53.435Z.

Spec child run: 40164927-0184-4954-8ad0-8cabae6d8d18. Verified result SHA-256: 2cfc475c8bd44cbee1d96c1168751aca25dcad311660d41faea5178762af8c8f. Acknowledged; owned tab removed. Normal closure left owned processes. Explicitly approved, identity-checked TERM and CONT completed termination. Shutdown confirmed at 2026-11-22T04:06:13.348Z.

These are research handoffs, not extra authoritative review artifacts. This file is the single review artifact.

## Final source identity

Final `git status --porcelain=v1` returned no entries. Branch, commit, and tree remained feature/skill-contract-manifests-07-shared-context, 2d5779034ef9f36b24356632a327070ae61daea0, and dc28c302db0cd500e2ca3f11ba9771ec884b328d. Source and publication checkout use the same Git common directory, /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles/.git.
