---
description: Delivers validated skill results through explicit caller handoffs, machine JSON or short human summaries. Use for operation output, child result artifacts, acknowledgements and interrupted delivery. Keeps domain receipts separate from transport and presentation.
name: result-delivery
---

# Result delivery

Produce the domain result once. Deliver it through the caller's contract. Show human sessions a short outcome, not a JSON dump.

## Common workflow

1. Let the owning skill validate its domain result. Keep its schema, references, checks and publication fields unchanged.
2. Resolve this installed skill directory as RESULT_DELIVERY_SKILL_ROOT. Script paths are relative to this directory, not the target repository. Invoke the absolute scripts/router.ts entrypoint from the caller's working directory. The mise shebang selects Bun. First-run dependency resolution can require network access.
3. At the selected result boundary, load the explicit context file or RESULT_DELIVERY_CONTEXT. Without a contract, use human presentation. An explicit child role without a context is an error, not permission to choose human output. A muxer name, depth, agent executable or TTY is not an audience decision.
4. Select one reference from the table. Keep a required parent artifact handoff even when a human presentation flag is present. Read the recovery reference if delivery fails.
5. Bind only the selected final operation. Intermediate checks must not fill the parent's final-result target. The ticket records CLI uses --deliver or an explicit --delivery-context to select that boundary. Use the operation CLI or import scripts/delivery.ts at the operation boundary. Do not add a second child reporting call merely to copy the result. The emit command is also available for prepared results and explicit delivery recovery.
6. Keep transport status separate from domain outcome, phase receipts and process completion. Never repeat a completed mutation to repair delivery.

## Reference router

| Condition | Read | Output |
|---|---|---|
| Human session without a required handoff | references/human-session.md | Short outcome and canonical references |
| Child with an artifact contract | references/delegated-agent.md | Immutable result and a small reference |
| Explicit machine JSON | references/machine-client.md | One JSON document on stdout |
| Missing, conflicting or interrupted handoff | references/delivery-recovery.md | Retained state and a precise delivery error |

## Ownership

The domain skill owns result validation and authoritative receipts. The caller owns the expected schema, operation identity and approved result target. Muxer-subagents owns run identity and completion signals. This skill owns transport validation, immutable envelope storage, acknowledgements and presentation. It does not claim tickets, approve actions, commit, push or publish.

Artifact I/O currently requires Linux with /proc/self/fd and existing target parent directories. It rejects symlink paths. Human and JSON presentation do not require that artifact backend. Do not claim a native structured-result transport that the harness has not implemented.

## Common mistakes

- **Raw JSON for humans:** Use the human reference. Keep the canonical result available to its actual consumer.
- **Exit zero means success:** Validate domain checks, source identity and publication separately.
- **Lost notification means rerun:** Recover the existing result and acknowledge it after validation.
- **Temporary signal owns lifetime:** Keep result targets outside muxer signal cleanup. Acknowledgement does not delete authoritative records.
- **Parent cannot read the target:** Stop delivery. Do not substitute an inaccessible child-local path.
- **Completed review means success:** Show the review verdict and blocking findings. A completed review can have verdict FAILURE.

Read references/validation.md when changing the route or checking the observed baseline, pressure cases and regression coverage.

