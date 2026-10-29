---
title: Ticket05 verified guard and review-ready source
type: Report
---

# Ticket summary

[Inspect ticket events through readable history and evidence views](../../../tracker/tickets/pi-shared-context-ux-05-events.md)

## Problem statement

Ticket history must keep canonical identity, execution, review verdict, readable body and source evidence distinct without changing workflow authority.

## Implementation summary

- Added canonical ticket state and validated review/fix receipt totals above event history.
- Separated event identity, execution, verdict and source fields; added dedicated body-first detail with exact raw evidence.
- Preserved last readable history on refresh failure, stable event identity, ancestor return, action targets and independent Files.

Source: `eeb4e4f920bc5b556c515c63bb99af60e4a099d9`; tree: `870eee2ea7f04671913f447ff64c3608ad6c1906`. The source remains clean and unchanged.

## Changed files

- `mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/data.test.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/data.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/events.test.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/explorer.test.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/explorer.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/live.test.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/model.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/README.md`

## Validation results

| Check | Observed result | Evidence |
|---|---|---|
| Affected suite and scoped compiler | 147 tests pass; compiler exits0. Inherited exact-source checks, not rerun by cycle4. | [Implementation](../events/implementation-0002.json) |
| Native list/detail and exceptional states | Recorded source-cycle evidence at40x12,80x24,120x40 in colour/mono. | [Native protocol](../artifacts/evidence/implementation-0002/native-protocol.json) |
| Native loading history | Six actual loading frames and two released-history views; canonical T preserved; owned processes exit0. | [Real run](../artifacts/evidence/native-loading-0010/native-check-result.json) |
| Hard request guard | Verified before recovery; stopped cycles3/4 conservatively without another cap breach. | [Guard proof](../artifacts/evidence/budget-guard-0004/verification.json) |

Cycle1 exceeded the250000 ceiling at371234 work tokens. That breach remains [recorded](../events/implementation-complete-0003.json). Cycle4 used37498 full-session work tokens. Its real scenario passed and wrote evidence before the hard guard stopped the next inference; its native goal stayed active. No native completion acknowledgement is claimed.

Two failed fixture attempts are preserved. The successful v3 uses the actual mq command and waits for its held read before navigation. Metadata omissions in generated receipts11/12 are corrected by immutable receipts13/14; earlier records are not erased.

## Review history

Review attempt1 was execution-blocked; no valid source verdict or code finding exists. Its [immutable report](../artifacts/reviews/review-review-0022.md) remains preserved. The revised guard is now verified after the separately recorded transport interruption; three fresh reviewers are next.

## Resolved findings

No formal code-review findings have been issued. The documented loading-history acceptance gap is closed by [corrected validation](../events/validation-result-correction-0013.json) and [parent completion](../events/validation-complete-0014.json).

## Remaining findings

Independent exact-source main, Standards and Spec assessments remain pending. Cycles10–12 are available under the explicit total12 approval. Guard verification is not a code review, and does not authorize integration or completion.

## Latest reviewer verdict

Not assessed.

## Merge status

Not merged. The canonical ticket remains claimed. Workflow evidence publication is separate from source integration.

## Complete receipt history

| Receipt | Phase | Event | Status | Work tokens |
|---|---|---|---|---:|
| [start-0001](../events/start-0001.json) | start | phase-start | started | — |
| [implementation-0002](../events/implementation-0002.json) | implementation | phase-result | blocked | — |
| [implementation-complete-0003](../events/implementation-complete-0003.json) | implementation | phase-complete | failed | 371234 |
| [guard-start-0004](../events/guard-start-0004.json) | validate | phase-start | started | — |
| [guard-result-0005](../events/guard-result-0005.json) | validate | phase-result | completed | 3626 |
| [guard-complete-0006](../events/guard-complete-0006.json) | validate | phase-complete | completed | 3626 |
| [validation-start-0007](../events/validation-start-0007.json) | validate | phase-start | started | — |
| [validation-0008](../events/validation-0008.json) | validate | phase-result | blocked | 26928 |
| [validation-complete-0009](../events/validation-complete-0009.json) | validate | phase-complete | failed | 26928 |
| [validation-start-0010](../events/validation-start-0010.json) | validate | phase-start | started | — |
| [validation-0011](../events/validation-0011.json) | validate | phase-result | completed | — |
| [validation-complete-0012](../events/validation-complete-0012.json) | validate | phase-complete | completed | 37498 |
| [validation-result-correction-0013](../events/validation-result-correction-0013.json) | validate | phase-result | completed | 37498 |
| [validation-complete-0014](../events/validation-complete-0014.json) | validate | phase-complete | completed | 37498 |
| [review-start-0015](../events/review-start-0015.json) | review | phase-start | started | — |
| [standards-start-0016](../events/standards-start-0016.json) | review-standards | phase-start | started | — |
| [spec-start-0017](../events/spec-start-0017.json) | review-spec | phase-start | started | — |
| [standards-result-0018](../events/standards-result-0018.json) | review-standards | phase-result | blocked | 23315 |
| [spec-result-0019](../events/spec-result-0019.json) | review-spec | phase-result | blocked | 22744 |
| [standards-complete-0020](../events/standards-complete-0020.json) | review-standards | phase-complete | failed | 23315 |
| [spec-complete-0021](../events/spec-complete-0021.json) | review-spec | phase-complete | failed | 22744 |
| [review-0022](../events/review-0022.json) | review | phase-result | blocked | 23451 |
| [review-complete-0023](../events/review-complete-0023.json) | review | phase-complete | failed | 23451 |
| [guard-start-0024](../events/guard-start-0024.json) | validate | phase-start | started | — |
| [guard-input-ready-0025](../events/guard-input-ready-0025.json) | validate | phase-checkpoint | started | — |
| [guard-result-0026](../events/guard-result-0026.json) | validate | phase-result | blocked | 19867 reported; ≤167734 reserved upper bound |
| [guard-complete-0027](../events/guard-complete-0027.json) | validate | phase-complete | failed | 19867 reported; ≤167734 reserved upper bound |
| [guard-retry-start-0028](../events/guard-retry-start-0028.json) | validate | phase-start | started | — |
| [guard-retry-result-0029](../events/guard-retry-result-0029.json) | validate | phase-result | completed | 24213 |
| [guard-retry-complete-0030](../events/guard-retry-complete-0030.json) | validate | phase-complete | completed | 24213 |

## Supporting records

- [Full-session audit](../artifacts/evidence/native-loading-0010/parent-session-audit.json)
- [Guard ledger](../artifacts/evidence/native-loading-0010/agent-guard-audit.jsonl)
- [Narrow colour loading](../artifacts/evidence/native-loading-0010/color-loading-40x12.txt)
- [Narrow monochrome loading](../artifacts/evidence/native-loading-0010/mono-loading-40x12.txt)
- [Released history](../artifacts/evidence/native-loading-0010/color-history-released.txt)
- [Coordinator reservation](../../goal-pi-shared-context-tui-ux-spec/events/dispatch-reserved-0110.yaml)

## Verified request reservation

The unchanged candidate `16fa278cd110b863b2f6579e38e3f93b88ac8119c2b67dda49f089f3f73c7237` passed10 arithmetic/accounting cases and11 actual goal-mode native request settlements. Four admitted requests would have exceeded the old full-wire reservation. The oversized110000-byte inert prompt was rejected before HTTP; a later small prompt was permanently rejected. Exact complete-session work:24213. All network admissions settled; no bound violation occurred.

- [Complete native verification](../artifacts/evidence/budget-guard-0028/verification.json)
- [Exact session accounting](../artifacts/evidence/budget-guard-0028/parent-session-audit.json)
- [Actual guard ledger](../artifacts/evidence/budget-guard-0028/agent-guard-audit.jsonl)
- [Explicit total12 renewal](../../goal-pi-shared-context-tui-ux-spec/events/limits-renewed-0132.yaml)

The final intentional rejection prevents a native model acknowledgement; its goal remained active and the session was closed. Actual controlled verification is complete. Cycle8's Cloudflare520 failure and167734 conservative upper bound remain recorded; no allowance is reset or transferred. All source and canonical claim/ownership fields remain unchanged. Session usage repeated on result and parent receipts is not summable as distinct spending.

