# Explicit grooming upgrades

Resolve this installed skill as `GROOMING_SKILL_ROOT`. Run its absolute scripts from the target repository.

```sh
"$GROOMING_SKILL_ROOT/scripts/grooming-report.ts" upgrade /absolute/selected-paths.json
```

The input is a JSON array of distinct artifact paths. The command uses shared `bulkUpgrade` with `scripts/report-owner.ts`. Each source must validate. Each destination must validate and preserve all authored content before shared atomic persistence. Partial results return nonzero and retain each item outcome. No upgrade command applies tracker actions.

Declared edges are `grooming-report/v1` to `grooming-report/v2`, and `grooming-actions/v1` to `grooming-actions/v2`. Reports gain an explicit identifier. Their YAML comments, unknown metadata, body, evidence, verdicts and actions remain byte-for-byte unchanged except the identifier line. Noncanonical explicit identifier syntax is refused instead of rewriting YAML. Actions gain the v2 envelope; all original ticket records and unknown fields remain intact. Ambiguous or non-round-tripping JSON content is refused.

Read-only `check`, `render` input reading, and `check-actions` use historical readers, not upgrades. Published history under `artifacts`, `events`, `receipts`, `evidence`, or `snapshots` is immutable and requires these readers. Symlinks and hard links are rejected by the shared writer. Unknown identifiers, invalid source or destination content, loss, and decision-dependent conversions preserve source bytes and return nonzero. Already-current valid artifacts remain byte-identical.

## Inventory

| Boundary | Direction | Definition and validator | Compatibility |
| --- | --- | --- | --- |
| Research report | Both | report-contract.md; parseReport | v1 historical reader; v2 output; declared safe upgrade |
| Proposed action record | Both | contracts/actions-v2.md; readActions | bare-array v1 reader; v2 envelope output; declared safe upgrade |
| contracts.json | Input | skill-contracts built-in manifest | shared loadContracts |
| HTML report and prose summary | Output | HTML and human-readable prose | no internal machine contract |
| tickets.txt | Input | newline-separated opaque ticket selectors | no injected identifier |
| selected-paths.json | Input | shared bulkUpgrade path list | shared API validation |
| applied.json | Output | user-selected ticket-operation audit, not compilation input | ticket skill owns mutation results; never inferred from proposed actions |

## Change log

- Added current report identities and action envelopes. Kept read-only historical readers. Added explicit shared safe upgrades and checked action consumption.
