# Check and migrate tracker records

Use this procedure for record validation and explicit Local Markdown content migration. It does not relocate storage, migrate hosted issues, implement tickets, or grant execution ownership. Read [Tracker schemas](../schema.md) and the configured store procedure first.

## Resolve the command

Resolve the installed ticket skill directory as `TICKET_SKILL_ROOT`. `scripts/records.ts` is relative to that directory, not the target repository. Invoke its absolute path directly from the target repository; its shebang selects Bun through mise.

```sh
"$TICKET_SKILL_ROOT/scripts/records.ts" check --repository "$REPOSITORY_ROOT" --ticket T-1
"$TICKET_SKILL_ROOT/scripts/records.ts" check --repository "$REPOSITORY_ROOT" --initiative example-navigation
```

Read-only checks report record versions, validation failures, membership, and dependency issues. A check never writes schemas or repairs records. Standalone tickets can be checked before an initiative collection exists; missing blocker records still fail validation. Keep the explicit selector; do not silently expand into a whole-tracker migration.

## Plan before approval

```sh
"$TICKET_SKILL_ROOT/scripts/records.ts" migrate plan --repository "$REPOSITORY_ROOT" --ticket T-1 --output /tmp/ticket-migration-plan.json
"$TICKET_SKILL_ROOT/scripts/records.ts" migrate plan --repository "$REPOSITORY_ROOT" --spec-ticket example-navigation-spec --output /tmp/spec-migration-plan.json
"$TICKET_SKILL_ROOT/scripts/records.ts" migrate plan --repository "$REPOSITORY_ROOT" --initiative-spec example-navigation --output /tmp/index-migration-plan.json
```

The three selectors explicitly choose legacy ticket versioning, specification-ticket conversion, or consolidation of an initiative's separate `spec.md`. A filename suffix is not proof of record kind. Preserve the selected stable ID, including a `-spec` suffix. Never infer a new ID or reparent unrelated tickets.

Initiative conversions require source frontmatter `id` and `title`, with `id` matching the selector. Consolidation refuses an existing `index.md`; an authored destination requires a separate reviewed reconciliation decision. Group conversions version all affected legacy children without changing their IDs, parents, status, or blockers. `--ticket` versions only the selected executable ticket.

Plan generation reads the selected record, affected children, tracker references, routes, and source state. It writes no tracker, workflow, or schema state. An optional output is a JSON transport artifact outside tracker and workflow collections, not an applied migration journal. Without `--output`, inspect the JSON result. `--output` saves the plan object itself; apply expects that object, not the result envelope. An existing output file is a conflict.

Review exact before/after content and hashes, old/new references, affected stores, source Git provenance when available, link repairs, conflicts, validation requirements, reference-search coverage, and writer/publication risks. The scan covers resolved tracker collections, not arbitrary external documents or historical receipts. Report that limit explicitly.

## Apply only the approved plan

Before applying, inspect affected worktree/agent activity through the muxer contract. Arrange a safe pause or handoff for all affected writers. An idle pane is not proof of shutdown. Unknown liveness blocks operator approval. Preserve existing claims, source branches, review findings, run IDs, and consumed coordinator reservations.

```sh
"$TICKET_SKILL_ROOT/scripts/records.ts" migrate apply --repository "$REPOSITORY_ROOT" --plan /tmp/spec-migration-plan.json --acknowledge-writer-safety
```

The acknowledgement asserts that the caller coordinated writers; the CLI does not independently detect muxer liveness. It is not permission to steal claims, stop agents, bypass hooks, merge, push, or implement work.

Apply must re-resolve destinations, validate the plan, reject changed inputs and conflicts, validate staged records, and recognize an already-applied plan. Preserve custom fields, authored body and comments, child identity/status/dependencies, and relative link targets. A specification move removes only ticket-specific fields that have no executable meaning. Nonempty blockers or execution history on the specification require a human migration decision.

Record an immutable plan under the resolved `migration-<migration-id>` workflow's `artifacts/snapshots/` and append migration state events under `events/` with `tracker-migration/v1`. These are migration records, not ticket-phase receipts. Never rewrite existing workflow events, reviews, snapshots, or coordinator accounting. Store old/new references and source commit/blob provenance for historical lookup; do not leave an executable stub at the old specification path.

On partial failure, stop and report persisted changes, recovery state, and whether internal rollback restored the original records. Do not resume ticket execution while records or publication are inconsistent. A retry must reconcile the existing migration rather than append duplicate conversions.

## Verify and publish

```sh
"$TICKET_SKILL_ROOT/scripts/records.ts" migrate check --repository "$REPOSITORY_ROOT" --migration <migration-id>
```

Require saved hashes, schema validation, matching parent/index membership, an intact dependency graph, and successful normal tracker discovery. Copy canonical result references from the resolver's `ref`, not its physical `path`.

The CLI does not commit or push. Apply the configured store's commit and publication procedure separately and report actual status. Uncommitted Git records are not a successful publication. Cross-store changes require validation and publication in every affected store. A publication failure blocks implementation until reconciled.

For an unsupported hosted backend, report the missing content-migration operation without changing routes or creating substitute local records.
