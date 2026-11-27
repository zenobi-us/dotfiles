# Web-design metadata review

This review gives the parent coordinator a verdict for the frozen source.

Reader: the parent coordinator. Date: 2026-11-27T00:30:08.979Z.

For integration decisions, use the parent workflow after receipt reconciliation.

## Overview

FAILURE. Two low-severity hard Standards findings block completion. Spec has no findings. Native validation passed.

The parent must route the findings to a fresh fix phase. This review authorizes no source change or integration.

The document-design rules cited here are project house rules. ISO 24495-5 is an unpublished working draft, not a conformance claim.

## Contents

- **Review boundary:** [Scope](#scope).
- **Affected interfaces:** [Contracts](#contracts).
- **Standards result:** [Standards](#standards).
- **Specification result:** [Spec](#spec).
- **Observed behavior:** [Validation](#validation).
- **Retained history:** [Provenance](#provenance).
- **Owned resources:** [Coordination and resources](#coordination-and-resources).

## Scope

Ticket: `tracker/tickets/skill-contract-manifests-16-web-design-metadata.md`. Initiative: `tracker/initiatives/skill-contract-manifests/index.md`.

Source branch: `feature/skill-contract-manifests-16-web-design-metadata`. Base branch: `master`.

Reviewed commit: `14705f57e663196bc211fbf394a8829820dcf9fc`. Reviewed tree: `77df53d39098775775469a221d525467d1c3e35a`.

Frozen review base: `d72457183fadb7c48a0557c602947b4b467f031d`. Review attempt: 7. Parent receipt: `review-start-0034`.

Source checkout: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-16-web-design-metadata`.

Publication checkout: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles`.

Both checkout-anchored absolute Git common-directory commands returned `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles/.git`. Their absolute realpaths match.

The complete three-dot diff is nonempty. Base-only metadata movement does not change this frozen review boundary.

```sh
git diff d72457183fadb7c48a0557c602947b4b467f031d...14705f57e663196bc211fbf394a8829820dcf9fc
```

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

Full diff and commit list: [Diff capture](../evidence/review-0035/review-diff.stdout) and [commit list](../evidence/review-0035/review-log.stdout).

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

FAILURE: two low-severity hard house-rule faults remain. Reviewed all eleven changed paths in the complete d72457183fadb7c48a0557c602947b4b467f031d...14705f57e663196bc211fbf394a8829820dcf9fc diff. Read the canonical publication ticket, full initiative, context, domain rules, and ADR index. No listed ADR governs this feature. Used mq for local Markdown inspection. Prior findings standards-006–010 are corrected: labelled lists replace the identified inline series, paragraphs are separated, and both new references contain purpose, reader, date, and referral blocks. No published ISO5 conformance claim appears. The remaining faults concern the new metadata reference: comparison tables have no named minimum presentation width, and its conversion referral uses British spelling. Both violate explicit supplied house rules. No additional Fowler-smell judgement finding is reported. Numeric historical acceptance, pure conversion, byte preservation, installed asset consumption, and synchronized plugin versions show no additional standards fault in source inspection. Baseline prose and tooling-enforced concerns are excluded. No source, configuration, test, tracker, or view changes were made. No builds, lint, tests, formatters, runtime probes, remote source access, or refresh ran. Native behavioral proof remains the primary reviewer's responsibility. Historical checkpoint110 and user-approved correction111 are not new source defects.

### standards-011

NOADR. Severity: low. This documented house-rule breach blocks completion.

[mise/conf.d/devtools-agent/bundles/creator/skills/web-design/references/source-metadata.md:19](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-16-web-design-metadata/mise/conf.d/devtools-agent/bundles/creator/skills/web-design/references/source-metadata.md#L19).

Hard house-rule breach. iso-24495-5/SKILL.md, rule 4, requires a named minimum presentation width for comparison tables and a read-back at that width. Without a named width, it requires repeated labelled records. The new Inventory and Exact identities tables at lines 19–24 and 28–31 have no named presentation width anywhere in the document.

Required change: Replace both tables with repeated labelled records. Alternatively, obtain a minimum target width, name it, and record the required read-back. Preserve every boundary, wire identity, ownership statement, and support restriction.

```sh
mise exec -- mq --allow-http-import --no-lockfile -I raw -F raw 'import "github.com/harehare/okf.mq" | .' mise/conf.d/devtools-agent/bundles/creator/skills/web-design/references/source-metadata.md; manually inspect Inventory and Exact identities against iso-24495-5 rule 4.
```

### standards-012

NOADR. Severity: low. This documented house-rule breach blocks completion.

[mise/conf.d/devtools-agent/bundles/creator/skills/web-design/references/source-metadata.md:7](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-16-web-design-metadata/mise/conf.d/devtools-agent/bundles/creator/skills/web-design/references/source-metadata.md#L7).

Hard house-rule breach. asd-ste100/SKILL.md, rule 1.14, requires American English spelling. The new referral says 'For authorised conversion'. 'authorised' uses British spelling. This prose is neither a technical identifier nor a quoted error.

Required change: Change 'authorised' to 'authorized'. Preserve the link and separate conversion authority.

```sh
mise exec -- mq --allow-http-import --no-lockfile -I raw -F raw 'import "github.com/harehare/okf.mq" | .' mise/conf.d/devtools-agent/bundles/creator/skills/web-design/references/source-metadata.md; manually inspect the opening referral against asd-ste100 rule 1.14.
```


Exact raw result: [Standards axis](../evidence/review-0035/standards-axis.json).

## Spec

No evidence-backed spec faults found. Reviewed all 11 changed paths for d72457183fadb7c48a0557c602947b4b467f031d...14705f57e663196bc211fbf394a8829820dcf9fc against the canonical ticket and full initiative. Read publication context, domain configuration, ADR index, and the sole ADR; that device-specific ADR does not apply. The manifest separates current production from historical acceptance and declares the numeric-1 conversion. Readers reject unsupported, missing, mixed, null, and duplicate identities without fallback. Validation and selection use installed bundled assets, preserve distinct associations and provenance, and reject checksum failures and malformed UTF-8. Valid encoded U+FFFD remains accepted. Pure owner hooks use shared safeUpgrade/bulkUpgrade persistence, preserve nonidentity bytes, refuse immutable/history paths and unsupported operations, and retain partial bulk outcomes. Catalog changes preserve all five associations, capture metadata, source locations, and checksums. Both new references include purpose, reader, date, and cross-reference blocks without independent prose identities. Creator release versions match. Inspected native regression coverage and retained parent encoding evidence; ran no builds, tests, formatters, runtime probes, or remote refreshes. Native acceptance proof remains with the primary reviewer. Checkpoint 111 remains historical input, not a new source defect. No published ISO5 conformance claim was found.

Exact raw result: [Spec axis](../evidence/review-0035/spec-axis.json).

Standards: 2 findings, worst severity low and hard. Spec: 0 findings. The axes retain their separate results and order.

## Validation

The primary ran the absolute owning executable once from unrelated cwd `/tmp`, after the frozen commit existed.

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-16-web-design-metadata/mise/conf.d/devtools-agent/bundles/creator/skills/web-design/tests/source-metadata-smoke.ts
```

Outer exit: 0. Stderr: empty. Duration: 9.182837190 seconds.

The primary parsed the 56 JSON outcome rows separately from the final non-JSON PASS summary.

- **Successful commands:** 21 rows returned 0.
- **Expected refusals:** 35 rows returned 1.
- **Expected outcomes:** All 56 matched their expected exit codes.

[Full stdout](../evidence/review-0035/native.stdout), [full stderr](../evidence/review-0035/native.stderr), [timing and status](../evidence/review-0035/native.json), and [row validation](../evidence/review-0035/native-validation.json) retain the actual run.

Integration check, from the repository root:

```sh
mise/conf.d/devtools-agent/bundles/creator/skills/web-design/tests/source-metadata-smoke.ts
```

All eleven working blobs match frozen source objects before review and immediately before publication. Seven protected runtime and guidance paths match dab2338e. The two reference documents changed only their opening insertions.

All five bundled assets match baseline bytes and catalog checksums. The catalog differs from the numeric baseline only in its identity token. Capture time, ordered associations, provenance, and nonidentity bytes remain unchanged.

Evidence: [Final bindings](../evidence/review-0035/bindings-final.json), [seven protected paths](../evidence/review-0035/protected-seven.json), [asset and catalog preservation](../evidence/review-0035/preservation.json), and [opening-only diff](../evidence/review-0035/opening-only-diff.stdout).

## Provenance

Canonical ticket, initiative, context, domain, workflow, and evidence reads came from the publication checkout. ADR0001 concerns Pi Ink cleanup and does not govern this feature: NOADR.

Consumed fix32, parent33, valid immutable snapshot32, review29, and retained UTF-8 failure and correction evidence. The old9689 failing case was not rerun. Original provenance locations were not accessed.

Snapshot32 and its validation remain historical inputs. The retained current-draft link validation reports 38 valid targets. Prior review29 remains FAILURE for dab2338e, not this source.

The child fix32 native observation is precommit evidence: 9.079340 seconds. It is not this primary's fresh postcommit execution.

User-approved journal correction111 preserves erroneous110. Neither record is a new source defect. Parent launch-reader correction concerns a capture wrapper, not a failed launch.

Reader usage corrections preserve original captures under new corrected filenames. No source or axis run repeated for a capture correction.

## Coordination and resources

Both fresh leaf launches have depth2, the exact assigned run/operation identities, and primary parent run0418c7c3-103c-4afe-bff8-384759f9ff8b. Their manifests name the frozen source checkout.

- **Standards acknowledgement:** `28b1782fe9af7b2df86a27f69941f9bbd2fd6a67693b1f99bcae84949a4a95ee` for run `4f0425d9-7fe1-4cef-8481-2491c5a3dcd1`.
- **Spec acknowledgement:** `95a2795c4e4f38b7fca38266b9b59fb2b12d9615747811b62510da1d7d85475e` for run `eac7e16a-1ec6-4db2-9268-3d42e67d9472`.
- **Leaf shutdown:** Both normal owned closures have confirmed nested resource observations.

Evidence: [Complete launch validation](../evidence/review-0035/launch-validation-complete.json), [Standards ACK](../evidence/review-0035/standards-ack.stdout), [Spec ACK](../evidence/review-0035/spec-ack.stdout), [Standards resources](../evidence/review-0035/standards-resources-after.stdout), and [Spec resources](../evidence/review-0035/spec-resources-after.stdout).

The primary remains live for normal parent closure. Its recorded process shutdown is pending, separate from both completed leaf closures. No extra services or infrastructure changes occurred.

The supplied coordination assessment has no hard blocker. Incomplete unrelated inventory remains unknown. Generated metadata overlaps are future integration risks, not shared source writes.

The parent owns acknowledgement, tracker comment, reconciliation, acceptance, integration, and publication commits. No source, configuration, tests, generated output, tracker, views, snapshots, or goal journal changed during this review.
