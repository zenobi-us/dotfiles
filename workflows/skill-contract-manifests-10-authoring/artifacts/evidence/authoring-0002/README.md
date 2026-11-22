# Implementation verification

## Scope and source

Ticket: [skill-contract-manifests-10-authoring](../../../../../tracker/tickets/skill-contract-manifests-10-authoring.md).
Source: `e3f54b7b2a8e71b12b70399c95261128a95468f2`; tree `1b993463da850f5d389927a481609980ff972001`.
Canonical authoring remains writing-skills. The compatibility alias is in matt-pocock, not agent-core. Shared contract implementation was consumed unchanged.

## Behavioral sessions

| Run | Guidance | Actual outcome |
| --- | --- | --- |
| e7754cba-a1e2-478c-8694-f1fc52620045 | Existing installed guidance, no proposed changes | Persisted invented external-note-schema/v1 support with an unresolved definition. Public validation failed. Already refused lossy conversion. The child correctly marked the requested policy-free experiment invalid because mandatory existing policy loaded. |
| a976134a-4c58-4251-be6b-698d41747846 | Controlled current-installed-guidance baseline | Valid known-subset manifests; already refused largest-version ranking, stamping on read, metadata loss and invented external authority. Passing safety baseline, not evidence that new guidance caused those refusals. |
| ec802f1a-c3ae-4928-bb5b-acdfb837fb4c | Updated source router and contract references | Valid independent accepts/produces and empty prose sibling; no invented external declaration or image/prose identity. External authority remained an explicit scenario blocker. Exercised public rename/bulk and rejected unknown, legacy-zero and immutable records. |

The initial observed failure motivated the explicit prohibition on unresolved placeholder support. There is no policy-free baseline claim or claim that every refusal is newly learned. The controlled baseline and treatment also received real example definitions, so their comparison alone cannot isolate a causal improvement over the first draft.

Exact choices, loaded-policy limitations and retained envelopes are in baseline-initial-result.json, baseline-current-result.json and pressure-result.json. The corresponding *-decisions.txt and *-contracts.json files preserve actual drafts. Example identities demonstrate declaration behavior; they are not claimed as a deployed note-writing skill.

## Public command observations

22 parent smoke invocations ran from /tmp through the installed skill-contracts public router. See [public-command-results.json](public-command-results.json) for full argv, cwd, exit codes, exact errors, persisted successful values and pre/post SHA-256 values. [fixture-snapshot.json](fixture-snapshot.json) retains temporary fixture content.

- Both authoring manifests validated; built-in definition resolved without a competing contract definition.
- Read-only resolution preserved source bytes. Authorized rename moved title/body into the current nested shape, retained body and nested authored metadata, and changed only the requested title.
- Current valid upgrade remained byte-identical. Explicit bulk conversion returned nonzero partial: mutable item converted, immutable item unchanged.
- Unknown explicit versions, zero and multiple legacy matches, non-round-trippable numbers, relabel-only content, invalid destinations and no declared path were rejected.
- Multiple operation destinations and multiple paths returned ambiguity errors. lossless:false and requiresDecision:true were rejected. Silent metadata dropping failed preservation comparison.
- Every single-file pre-commit rejection retained identical SHA-256 bytes. Moving Git pins and unavailable full pins failed resolution; an exact existing historical pin resolved successfully.

Child pressure invocation evidence complements, but does not replace, the parent fixture-policy checks. The pressure child honestly did not execute each refusal variant; the parent smoke did. No source-text tests or helper tests substitute for these observations.

## Coordination and cleanup

The source commit hook generated three version metadata changes. Parent approved retaining them; [coordination.json](coordination.json) records exact paths and provenance. No review verdict or merge exists. All experiment child results were verified and acknowledged; owned child processes were closed and shutdown observations retained. Temporary fixtures and scaffolds were removed after snapshot retention. Source remains committed and clean; publication artifacts live only in the designated publication checkout.
