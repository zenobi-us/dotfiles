# Result delivery validation

Version: result-delivery/v1. Reader: skill maintainers. Purpose: record the observed output failure and the checks that prevent its return.

- [Observed baseline](#observed-baseline)
- [Pressure cases and counters](#pressure-cases-and-counters)
- [Checks and review](#checks-and-review)
  - [Standards review](#standards-review)
  - [Design review](#design-review)
- [Change record](#change-record)

## Observed baseline

The user received a complete tracker-result/v1 object after a successful initiative publication. The earlier ticket contract required: "Return one JSON object with `schema: tracker-result/v1` for every operation, including setup, check, migration plans, failures, and publication results." That historical rule controlled final chat as well as machine output. It is not the current output instruction.

The first human formatter replaced JSON syntax with a full nested field dump. A real tracker check printed schema, null fields, discovery metadata and empty collections. This still failed the short-summary requirement. The corrected command prints the operation outcome, record reference and validation in three lines.

A second smoke used a completed review with verdict FAILURE. Its human output preserved the failed verdict, blocking finding R1, file and line, and failed validation command. Review completion did not become implementation success.

## Pressure cases and counters

| Pressure or failure | Required response | Coverage |
|---|---|---|
| Human asks for a readable result after a successful operation | Give an outcome, references, checks and actual publication | Human CLI smoke and formatter regressions |
| Parent requires an artifact but a presentation flag requests human output | Keep the bound artifact handoff | Public ticket CLI workflow |
| An intermediate check inherits a phase result context | Leave the final slot untouched; bind only the selected final operation | Public intermediate-command regression |
| Process exits zero while publication is still required | Verify domain state and withhold acknowledgement where publication is required | Independent skill pressure walkthrough |
| A review completes with verdict FAILURE | Show the failed verdict and blocking findings | Formatter API and CLI regressions |
| A result notification or acknowledgement is lost | Re-read the existing result and repeat only matching acknowledgement | Durable read/ack regressions and recovery playbook |
| Event publication fails after its filesystem link exists | Preserve prepared recovery data and state that publication is unconfirmed | Public writer post-publication fault regression |
| Source worktree belongs to another repository | Reject it even if commit and tree match | Public writer repository-identity regression |
| Environment text appears in a generated launch | Execute the launch and inspect what the child actually receives | Isolated fake-agent launch regressions |

Do not rationalize a raw field dump as human output. Do not interpret a completed process as a passed review. Do not reuse a result slot for intermediate operations. Do not rerun a mutation to repair delivery. These are the common red flags.

## Checks and review

The real tracker CLI was exercised from /tmp. A separate isolated Git repository exercised the worktree writer: authoritative YAML, transported worktree-receipt/v1 and actual source identities agreed. Human output was concise. Explicit artifact binding survived --format human. The delivered result was read back and acknowledged. The immutable result remained after acknowledgement. The failed-review presentation was exercised through the actual delivery CLI.

The agent-core TypeScript project and a scoped cross-bundle compiler check passed during implementation. The final scoped run passed 90 tests across six files, with 502 assertions and no failures. The regression suites cover the public result and operation boundaries. Fixture repositories are temporary. No real model agent was launched, and no remote Git operation ran. Native muxer programs are not claimed as end-to-end verified by fake-agent tests.

Review context: direct approved user request; no tracker record was created or changed. Source branch: master. Baseline: 522b119a. Reviewed state: the scoped working-tree changes for result-delivery, muxer handoffs, ticket output and worktree result writing. Review recheck recorded at 2026-11-09T00:24:21.642Z.

### Standards review

- **P1, corrected:** Publication could succeed before a later filesystem error. Preserve prepared recovery JSON and report uncertain publication instead of losing the result.
- **P2, corrected:** Compare real Git common-directory identities for the caller, receipt repository and source worktree. Reject unrelated repositories before an event write.
- **P2, corrected:** Replace generated shell-source assertions with executed fake-agent launches and child-observed context.

Verdict after the independent recheck: no remaining blockers. The reviewer did not run checks or change files.

### Design review

- **P2, corrected:** Show verdict FAILURE, blocking findings and failed validation even when the review process status is completed.
- **Additional boundary, corrected:** Bind only the selected final ticket operation. Intermediate checks must not consume a phase result target.

Verdict after the independent recheck: no remaining blockers. The reviewer did not run checks or change files.

The human-session walkthrough chose references/human-session.md and retained local-only publication status. The delegated pressure walkthrough retained the required artifact, rejected process completion as proof of success, and withheld acknowledgement while required publication was incomplete.

## Change record

This cutover adds the result-delivery router and four delivery playbooks. It adds immutable transport envelopes and acknowledgements without changing tracker-result/v1 or worktree-receipt/v1. It adds explicit muxer session metadata and retained parent-assigned targets. The ticket CLI binds only selected terminal operations. The worktree result writer stores authoritative YAML and transports the same object in one command.

Artifact storage currently requires Linux, /proc/self/fd and shared filesystem access. Other artifact backends and native structured-result adapters are not implemented or advertised. Transport does not commit, push or replace domain publication rules.

