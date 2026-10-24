# Setup playbook

Use this playbook for the `setup` subcommand. It owns tracker and engineering-skill configuration, including the deterministic setup CLI, templates, conflict checks, and verification. It does not require an existing tracker document and does not mutate ticket records.

## Input and phases

Accept a handoff from `setup-matt-pocock-skills` or a direct request with:

- **Target:** An absolute repository directory.
- **Phase:** `plan`, `apply`, or `check`.
- **Answers:** The explicit questionnaire decisions, or an absolute answers-file path for plan and apply.
- **Approval:** For apply, the user's approval and the exact plan they approved. A plan request is not approval to initialize.

Use [Setup CLI reference](../setup/cli.md) for the authoritative answer schema, rendering capabilities, CLI flags, file policies, and exit codes. Preserve existing roots and labels. If required decisions are missing, return them to the caller for the questionnaire; do not invent answers or run initialization.

The setup CLI's rendering backends and operational store adapters are separate capabilities. Read the store router in [Usage](../usage.md) before claiming that ticket operations are available. Report unsupported combinations explicitly; do not invent an adapter.

## Resolve installed paths and current state

Resolve this skill's installed directory as `TICKET_SKILL_ROOT`. `scripts/` and `assets/` are relative to that directory, not to the repository. Resolve the installed shared-context skill directory as `SHARED_CONTEXT_SKILL_ROOT`.

Run the CLI from the target repository with absolute script paths. It requires mise, Bun, Git, and uv. Copier is pinned by the CLI; its first run can require network access.

Use `shared-context` to resolve the current route table and typed record targets. Keep existing stores. Explicit storage initialization or migration belongs to shared-context, not to this playbook. Use `mq-query` for existing Markdown configuration.

If the handoff contains an answers mapping, write it as YAML to a temporary file outside the target. Keep it for the approved phase and remove it when the handoff is complete. The setup skill does not write configuration or run the CLI itself.

## Plan

```bash
"$TICKET_SKILL_ROOT/scripts/setup.ts" plan "$PWD" \
  --answers /absolute/path/setup-answers.yml \
  --shared-context "$SHARED_CONTEXT_SKILL_ROOT/scripts/shared-context/cli.ts" \
  --json
```

Return the full route table, absolute alignment root, and exact before/after plan through the setup result contract. Preserve conflicts and errors. Ask the caller to obtain approval before apply.

If a plan reports authored-content conflicts, stop. Reconcile them with the user before a new plan. Do not bypass conflicts with direct writes, template overwrite flags, or edited setup-state hashes.

## Apply an approved plan

1. Require the user's approval of the exact plan. Retain the target, answers, and approved plan together.
2. Run plan again. Compare its routes, alignment root, file actions, and before/after content with the approved plan. If anything differs, return the new plan for approval instead of applying it.
3. Review any route-manifest copy. It must preserve existing routes when shared instructions change resolver precedence.
4. Run initialization, then check:

```bash
"$TICKET_SKILL_ROOT/scripts/setup.ts" init "$PWD" \
  --answers /absolute/path/setup-answers.yml \
  --shared-context "$SHARED_CONTEXT_SKILL_ROOT/scripts/shared-context/cli.ts" \
  --json
"$TICKET_SKILL_ROOT/scripts/setup.ts" check "$PWD" \
  --shared-context "$SHARED_CONTEXT_SKILL_ROOT/scripts/shared-context/cli.ts" \
  --json
```

5. Require successful initialization and a passing check. Confirm that a second identical initialization produces no changes. Do not report a successful plan as completed setup.
6. For each changed shared store, follow the shared-context publishing rules. The CLI does not commit or push. Report a non-Git shared store as local-only.

## Check without writes

For the check phase, run only `scripts/setup.ts check` as shown above. It uses saved state and needs no answers or approval. Return observed drift, missing configuration, and route mismatches. A check does not repair files.

## Result and maintenance

Return [Result contract](../result-contract.md) with `operation: setup`. Include the raw CLI result, validation, changed configuration paths, and actual publication state. The caller presents the result; it does not reconstruct generated documents.

Tell the user that `docs/agents/*.md` can be edited directly. A later setup run treats edits to managed content as conflicts.

All generated prose comes from this skill's `assets/`. Keep one persistent state file in the alignment store: `docs/agents/setup-state.json`. Do not copy Copier staging answers into the target. Keep the user-facing setup skill free of scripts, templates, backend operation rules, and duplicated CLI instructions.

After implementation changes, run the real CLI against disposable repositories and run `bun test scripts` from this installed skill directory. Verify no-write plans, idempotence, authored conflicts, configured roots, and path safety.


