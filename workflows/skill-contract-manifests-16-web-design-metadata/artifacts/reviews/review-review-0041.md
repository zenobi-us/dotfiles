# Web-design metadata review

This review gives the parent coordinator a verdict for the exact frozen source.

Reader: the parent coordinator. Date: 2026-11-27T09:17:34.580969+00:00. Review attempt: 8.

For integration or source correction, use the parent worktree workflow after receipt reconciliation.

## Overview

FAILURE. Standards has two low-severity hard house-rule findings. Spec has no findings. The native command scenario passed.

The first-use acronym rule applies to both newly added references. Prior standards-011 and standards-012 are resolved.

The parent must route current findings to a fresh fix phase. This source review approves no integration or source change.

The cited document-design rules are project house rules. ISO 24495-5 is an unpublished working draft, not a conformance claim.

## Contents

- **Frozen boundary:** [Scope](#scope).
- **Affected interfaces:** [Contracts](#contracts).
- **Standards result:** [Standards](#standards).
- **Specification result:** [Spec](#spec).
- **Observed behavior:** [Validation](#validation).
- **Retained authority:** [Provenance](#provenance).
- **Integration boundary:** [Integration risks](#integration-risks).
- **Owned resources:** [Resources and delivery](#resources-and-delivery).

## Scope

Ticket: `tracker/tickets/skill-contract-manifests-16-web-design-metadata.md`. Initiative: `tracker/initiatives/skill-contract-manifests/index.md`.

Source branch: `feature/skill-contract-manifests-16-web-design-metadata`. Base branch: `master`.

Reviewed source commit: `b039c503841014575faf26c16d3dfa61e9c63db6`. Reviewed source tree: `29ef53bfe84e272f0ea7e965bc554f33f21f194c`.

Frozen review base: `b53b4acc9a478c9794645b6ef627f418432135d7`. Parent receipt: `review-start-0040`.

Source checkout: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-16-web-design-metadata`.

Publication checkout: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles`.

Both checkout-anchored `git rev-parse --path-format=absolute --git-common-dir` commands returned `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles/.git`. Their absolute realpaths match.

The three-dot diff is nonempty and contains exactly these eleven paths:

- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/creator/skills/web-design/SKILL.md`.
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/creator/skills/web-design/assets/sources.json`.
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/creator/skills/web-design/contracts.json`.
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/creator/skills/web-design/references/style-selection.md`.
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/creator/skills/web-design/references/source-metadata.md`.
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/creator/skills/web-design/references/source-metadata-upgrade.md`.
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/creator/skills/web-design/scripts/source-metadata.ts`.
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/creator/skills/web-design/scripts/sources.ts`.
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/creator/skills/web-design/tests/source-metadata-smoke.ts`.
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json`.
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/creator/.claude-plugin/plugin.json`.

```sh
git diff b53b4acc9a478c9794645b6ef627f418432135d7...b039c503841014575faf26c16d3dfa61e9c63db6
```

The [complete diff](../evidence/review-0041/review-diff.stdout) and [initial identity and commit list](../evidence/review-0041/primary-preflight.stdout) retain the source boundary.

## Contracts

- **Affected contract:** `design-source-metadata/v1`.
- **Affected contract:** `design-source-metadata/v2`.
- **Affected contract:** `skill-contract-manifest/v1`.
- **Affected contract:** `UpgradeOwner/safeUpgrade/bulkUpgrade`.
- **Affected contract:** `bundled asset SHA-256 and style/provenance associations`.
- **Affected contract:** `readCatalog/selectSource`.
- **Affected contract:** `worktree-receipt/v3`.
- **Affected contract:** `Creator plugin/marketplace version synchronization`.

## Standards

FAILURE: two low-severity hard house-rule findings. Reviewed all eleven paths against the complete frozen three-dot diff, not only the final repair. Read canonical ticket, full initiative, context, domain configuration, ADR index, retained review35, fix38/parent39, snapshot38, and native failure/correction evidence. No applicable ADR exists.

Prior standards-011/012 are resolved. Five Inventory records preserve all twenty cells. Two identity records preserve all six cells. Five sections remain, with no per-record headings, invented width, or third list level. The authorized referral retains its link and separate conversion authority.

The newly added references still omit first-use acronym definitions required by iso-24495-3 rule 3. These are documented-rule breaches, not Fowler-smell judgments. No additional smell finding is reported. Baseline prose and tooling-enforced concerns are excluded. No published ISO5 conformance claim appears.

Actual router output confirms depth2, assigned child run/operation/context, and exact primary parent. Bash confirms the source cwd. No source, configuration, tests, or workflow records changed. No tests, setup, services, or runtime probes ran. Primary owns behavioral verification. Historical116/120 are not new defects; moving-base conflict remains inference.

### standards-013

NOADR. Severity: low. This documented house-rule breach blocks completion.

[mise/conf.d/devtools-agent/bundles/creator/skills/web-design/references/source-metadata.md:35](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-16-web-design-metadata/mise/conf.d/devtools-agent/bundles/creator/skills/web-design/references/source-metadata.md#L35).

Hard house-rule breach: iso-24495-3/SKILL.md rule 3 requires acronym definitions at first use. Added prose uses CLI (35), JSON (43), UTC/ISO (62), and UTF-8/BOM/SHA-256 (86) without definitions.

Required change: Define these acronyms at first use, or replace them with clear full terms. Preserve technical literals, all record meanings, historical restrictions, and separate conversion authority.

```sh
mise exec -- mq --allow-http-import --no-lockfile -I raw -F raw 'import "github.com/harehare/okf.mq" | .' mise/conf.d/devtools-agent/bundles/creator/skills/web-design/references/source-metadata.md; manually check first-use acronym definitions against iso-24495-3 rule 3.
```

### standards-014

NOADR. Severity: low. This documented house-rule breach blocks completion.

[mise/conf.d/devtools-agent/bundles/creator/skills/web-design/references/source-metadata-upgrade.md:13](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-16-web-design-metadata/mise/conf.d/devtools-agent/bundles/creator/skills/web-design/references/source-metadata-upgrade.md#L13).

Hard house-rule breach: iso-24495-3/SKILL.md rule 3 requires acronym definitions at first use. This entirely added reference uses UTF-8 (13) and JSON (59) without definitions.

Required change: Define UTF-8 and JSON at first prose use. Preserve conversion guarantees, commands, and contract identifiers.

```sh
mise exec -- mq --allow-http-import --no-lockfile -I raw -F raw 'import "github.com/harehare/okf.mq" | .' mise/conf.d/devtools-agent/bundles/creator/skills/web-design/references/source-metadata-upgrade.md; manually check first-use acronym definitions against iso-24495-3 rule 3.
```

Exact raw domain report: [Standards axis](../evidence/review-0041/standards-axis.json).

## Spec

No evidence-backed specification findings. Reviewed the complete eleven-path frozen diff and current source against the full canonical ticket and initiative. Read canonical context, domain configuration, ADR index, retained review35, fix38, parent39, snapshot38, and native UTF-8 failure/correction evidence. NOADR: the listed Pi Ink decision does not govern this feature.

The manifest separates current string-v2 production from historical numeric-1 acceptance and declares one conversion edge. Readers reject unsupported, absent, null, mixed, and duplicate identities without fallback. String-v1 and unversioned input remain unsupported. Validation and selection resolve installed bundled assets independently of cwd, retain distinct associations and provenance, verify checksums, and reject malformed UTF-8. Valid Unicode, including encoded U+FFFD, remains supported.

Pure owner hooks delegate persistence to shared safeUpgrade/bulkUpgrade. Conversion changes only the identity token, preserves other authored bytes, refuses immutable/history paths and unsupported operations, and retains partial bulk outcomes. No original provenance access, remote refresh, competing framework, or independent prose identity was added. Creator release versions both equal 0.1.9.

Direct byte comparisons bind all eleven working files to frozen objects. Eight protected paths equal14705f57. All five assets equal baseline bytes and match catalog hashes. Catalog nonidentity bytes, capture time, provenance, and ordered associations remain unchanged. The revised reference preserves all boundary and identity meanings.

Actual Bash session contracts confirmed depth2, assigned child/parent/run/operation/context identities; cwd matches the assigned source. No source, workflow, dependency, service, or test changes occurred. No tests or runtime probes ran in this leaf; fresh native proof belongs to the primary. Historical116/120 are not source findings. Moving-base conflict remains an integration inference, not an observed source defect.

Exact raw domain report: [Spec axis](../evidence/review-0041/spec-axis.json).

Standards: 2 findings, worst severity low and hard. Spec: 0 findings. These axes retain their separate findings and order.

## Validation

The primary ran the absolute owning executable once from unrelated cwd `/tmp`, after the frozen source commit existed.

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-16-web-design-metadata/mise/conf.d/devtools-agent/bundles/creator/skills/web-design/tests/source-metadata-smoke.ts
```

Start: `2026-11-27T09:10:00.553Z`. Duration: `8.224796019` seconds. Outer exit: 0. Standard error: empty.

The primary parsed 56 JavaScript Object Notation (JSON) rows separately from the final non-JSON PASS summary.

- **Successful commands:** 21 returned 0.
- **Expected refusals:** 35 returned 1.
- **Matched expectations:** All 56 rows matched their expected exit codes.

[Full native capture](../evidence/review-0041/native-smoke.json), [full standard output](../evidence/review-0041/native-stdout.txt), [full standard error](../evidence/review-0041/native-stderr.txt), and [row validation](../evidence/review-0041/native-validation.json) retain the actual execution.

No native smoke or axis rerun occurred. Fix38's retained 8.352266530-second run is precommit evidence, not this fresh execution.

All eleven working blobs match frozen objects. The initial clean source observation and explicit object bindings establish the reviewed boundary. Final object bindings immediately precede publication.

Eight protected nonhook paths equal `14705f57e663196bc211fbf394a8829820dcf9fc`. All five working assets match catalog checksums and frozen baseline objects.

The catalog differs from its numeric baseline only in the identity token. Capture time, ordered associations, provenance, and all nonidentity authored bytes remain unchanged.

The primary manually compared all twenty Inventory cells and six identity cells. Five sections and at most two list levels remain. No per-record heading or presentation width was added. The authorized referral retains its link and separate conversion authority.

Evidence: [Working bindings](../evidence/review-0041/binding-validation.json), [protected paths](../evidence/review-0041/protected-eight.stdout), [preservation](../evidence/review-0041/preservation.json), and [manual prose inspection](../evidence/review-0041/manual-prose-inspection.json).

The required integration check remains nonempty:

```sh
mise/conf.d/devtools-agent/bundles/creator/skills/web-design/tests/source-metadata-smoke.ts
```

## Provenance

Canonical ticket, initiative, context, domain, receipt, snapshot, and evidence reads used the designated publication checkout. The listed Pi Ink architecture decision does not govern this feature: NOADR.

Consumed fix38, parent39, valid snapshot38, review35, and retained malformed-encoding failure and correction evidence. No old failing source was rerun. No original provenance location was accessed.

User-approved116 preserves the mixed commit and staging-owner acknowledgement. User-approved120 aligned two stale owned index entries without source-byte, commit, or native-proof changes. These records are historical coordination, not new source defects.

The retained [wait bridge failure](../evidence/review-0041/wait-bridge-failure.json) returned no native wait result or exit status. Parent [checkpoint0124](../../../goal-skill-contract-manifests/events/checkpoint-0124.yaml) authorized a read-only correction within this same attempt.

Process and tool-handle accounting found no active native wait. First confirmed waits then used actual Bash tools. Both original axes completed, with no new launches or reruns. Original and corrected captures remain retained under distinct names.

The earlier stopped handoff established no source verdict. This completed review supersedes that unavailable observation, without changing source identity.

## Integration risks

The [parent interface assessment](../evidence/integration-preflight-0001/base-interface-assessment.json) records independent base movement. Frozen source has Creator `0.1.9` and Developer `0.2.82`. Frozen base has Creator `0.1.4` and Developer `0.2.84`.

Both metadata merge attributes are unspecified. A mechanical conflict is an INFERENCE only. No integration prepare, merge, or conflict-resolution candidate was run during this review.

The parent owns current-base assessment and owning integration preparation. Preserve independent Developer updates. Do not select an arbitrary metadata copy.

If an actual product-code conflict needs resolution, preserve this source and obtain scoped candidate authority. An independent review must cover the resolved candidate. Candidate-bound checks must record its actual commit and tree, including the native metadata scenario.

Incomplete unrelated ownership inventory remains unknown. The supplied coordination assessment has no hard blocker. Generated metadata overlaps remain integration risks, not source findings.

## Resources and delivery

Both fresh leaf launches prove depth2, assigned run/operation/context, and this primary parent run `89d908dd-1ac0-4b5e-8efd-609dca52204c`.

- **Standards run:** `c4273e7e-f69e-42f1-a130-31c4600d37eb`. Verified transport hash: `46c005cbc28aaadc0fe48184be5203d2aebba6a82f5e946d2637f4ab4fcb673b`.
- **Spec run:** `6a99cd59-571b-4594-b54d-19d29209b9e2`. Verified transport hash: `8f306f14f407fc57e09b718c45a6a429a272b5262c0377e601171e75e8f75c0c`.
- **Leaf closure:** Both acknowledged leaves received normal exact owned closure. Both nested `.resources.shutdown` observations are `confirmed`.

[Axis validation](../evidence/review-0041/axis-validation.json), [Standards acknowledgement](../evidence/review-0041/standards-ack-corrected.stdout), [Spec acknowledgement](../evidence/review-0041/spec-ack-corrected.stdout), and [shutdown proof](../evidence/review-0041/axis-shutdown-validation.json) retain these gates.

The primary remains live for normal parent closure. Its resource observation remains pending. No services, source changes, environment repair, extra process signals, or infrastructure changes occurred.

The parent owns final transport acknowledgement, ticket comment, reconciliation, acceptance, integration, and publication commits. This phase writes only evidence, this sole immutable review body, and its final event.

