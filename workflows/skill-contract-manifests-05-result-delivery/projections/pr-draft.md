# Adopt contracts in result delivery

## Ticket

tracker/tickets/skill-contract-manifests-05-result-delivery.md

## Problem

Transport records used an unmanifested schema field. Consumers could not resolve one authoritative definition or verify historical references explicitly.

## Implementation

Declared authoritative delivery v1/v2 definitions and manifest. New context, envelope, reference and acknowledgement output uses schemaVersion: result-delivery/v2. Explicit v1 readers and validated duplicate recovery preserve stored bytes. Added read --reference verification and rejected unknown, dual, absent and relabelled identities. Cut over muxer context creation, tracker defaults, consumer references, integration fixtures and guidance. Kept domain payload validation with its owner. The commit hook updated four bundle-version metadata files. No merge, push, ticket completion or formal review was run.

Source commit: `ffe96b173909ba6836cc2ef419d97055582df8bc`. Source tree: `d42d9df13c95d06d05d1f13d2ca3d1e0dd762d23`. Branch: `feature/skill-contract-manifests-05-result-delivery`. Base: `master`.

## Changed files

- `mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json`
- `mise/conf.d/devtools-agent/bundles/agent-core/.claude-plugin/plugin.json`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/muxer-subagents/scripts/session-context.test.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/muxer-subagents/scripts/spawn.test.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/muxer-subagents/scripts/spawn.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/result-delivery/SKILL.md`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/result-delivery/contracts.json`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/result-delivery/references/contracts.md`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/result-delivery/references/contracts/delivery-v1.json`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/result-delivery/references/contracts/delivery-v2.json`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/result-delivery/references/delegated-agent.md`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/result-delivery/references/delivery-recovery.md`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/result-delivery/references/human-session.md`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/result-delivery/references/validation.md`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/result-delivery/scripts/delivery.test.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/result-delivery/scripts/delivery.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/result-delivery/scripts/router.test.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/result-delivery/scripts/router.ts`
- `mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/delivery-integration.test.ts`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/.claude-plugin/plugin.json`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/contracts.json`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/result-contract.md`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/records.ts`

## Validation

- Coordinated regression: 147 passed, 0 failed, 916 assertions across six files.
- Owner typecheck: passed.
- Delivery manifest validation and v1/v2 resolution: passed from /tmp. Tracker consumer manifest validation: passed.
- Real router commands: human and machine output; required child emit despite human format; read and ack; interrupted v1 read/re-emit/ack recovery: passed.
- Retained v1 context, envelope, reference and acknowledgement bytes stayed unchanged. Conflicting payload, wrong hash and dual identity were rejected with exit 1 and no replacement.
- Initial regression environment failure: Bun could not resolve versioned Ajv. Ignored local dependency links resolved it. No source dependency workaround was committed.
- Source status after commit: clean. The commit hook updated bundle versions.

## Review history

No formal review was requested or launched. The parent owns the next phase.

## Resolved findings

None. This implementation has no review findings.

## Remaining findings

None recorded.

## Latest reviewer verdict

Not reviewed.

## Merge status

Not merged. Not pushed. The ticket remains claimed.

## Resources

No smoke service was started. Smoke commands exited and temporary smoke files were removed. Session and tool processes remain running until parent pane closure. Router shutdown is pending, not confirmed. Preserve unrelated processes.

## Supporting records

- [Start receipt](../events/start-0001.yaml)
- [Implementation result](../events/implementation-0002.yaml)
- [Immutable implementation snapshot](../artifacts/snapshots/pr-draft-implementation-0002.md)

