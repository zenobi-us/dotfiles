# Setup contract upgrade procedure

## Declared edges

- `tracker-setup-answers/v1` to `tracker-setup-answers/v2`.
- `tracker-setup-state/v1` to `tracker-setup-state/v2`.

The procedure reference is `file:references/setup-contracts/upgrade-v1-v2.md`. The installed owner adapter is the default export of `file:scripts/setup.ts`. The shared `skill-contracts` engine selects declared paths, validates both contracts, compares preservation values, and owns atomic single-artifact persistence. No numeric version ordering selects a path.

## Source validation

Historical answers and state use numeric `schema: 1` with no `schemaVersion`. Current answers and state use their exact v2 `schemaVersion` and forbid `schema`. Identify the historical record kind from its validated content: state has a managed `files` array; answers have tracker decisions. Reject mixed or unknown explicit identities, unsupported operations, missing required fields, unknown answer keys, unknown state keys, unknown managed-file keys, and mismatched state/answer generations. No unsupported property may disappear through conversion.

## Safe conversion

Answers replace only the contract identity and normalize the documented effective defaults: single domain mode, enabled triage, the five default labels, and an empty domains list. Domain IDs represent an unordered collection and use canonical sorted order. Validate distinct safe labels and domain requirements before conversion. Preserve every supplied decision.

State replaces its contract identity and converts its nested historical answers by the same rule. Preserve version, Copier version, template hash, every managed path/root/hash/kind, managed-file ordering, and directory ordering. The pure conversion does not render templates or update hashes. Its preservation value is the complete validated state with contract identities normalized and effective answer defaults applied. It never omits an accepted field. Destination validation and shared deep equality must pass before persistence.

## Owning transaction

Setup can modify multiple managed files, so it does not call shared single-file persistence on the live state before applying its plan. Instead, it copies historical input to an owned temporary artifact and calls shared `safeUpgrade` with this installed adapter and operation `upgrade`. The shared engine resolves this declared procedure, validates preservation, and commits only the temporary artifact. Setup reads that validated current content and removes the temporary directory.

Read-only plan/check never change source bytes. Approved init alone may persist regenerated state and managed-file changes through the existing setup transaction, after conflict detection and freshness checks. Any deliberate regenerated values appear in the exact approval plan; they are not part of contract conversion. Neither historical interpretation nor conversion grants setup approval.

## Boundaries

The adapter supports pure `upgrade` only. Mutation requests fail. It refuses event, snapshot, and review paths. Unknown or unsafe input fails without live writes. External shared-context route/layout formats, hosted tracker API formats, and Copier configuration remain under their existing owners.


The declared shared single-file upgrade rejects non-JSON YAML containing `#` before persistence. The JSON converter cannot retain authored YAML comments. This conservative guard also rejects `#` inside YAML strings. Rejection preserves the original bytes; use a comment-preserving editor for those files. Valid JSON strings containing `#` remain supported. Normal setup reads the answers without rewriting their source; plan/check stay read-only, and authorized init can still use commented historical answers.
