# Web-design metadata review

This review gives the parent coordinator a source-bound verdict. Date: 2026-11-26T21:13:12.184Z.

## Overview

FAILURE. Four documented prose-standard violations block completion. Native behavior passes all 56 expected command outcomes. Spec has no findings.

Low severity does not waive a hard standard. The findings do not identify a runtime defect. No repository override applies. Parent owns acceptance and closure.

## Contents

- **Scope:** [Frozen source](#scope).
- **Contracts:** [Affected contracts](#contracts).
- **Standards:** [Independent Standards report](#standards).
- **Spec:** [Independent Spec report](#spec).
- **Validation:** [Fresh execution and preservation](#validation).
- **Provenance:** [Inputs and capture correction](#provenance).
- **Limits:** [Coordination and resources](#limits).

## Scope

Ticket: `tracker/tickets/skill-contract-manifests-16-web-design-metadata.md`. Initiative: `tracker/initiatives/skill-contract-manifests/index.md`.

Source branch: `feature/skill-contract-manifests-16-web-design-metadata`. Base branch: `master`.

Reviewed commit: `fb4104c7ea2e27f215fab95ec69682b71b101c1b`. Tree: `c7ecc92e759b7720f1ffadc4d2377473ff481403`.

Review base commit: `8591d69b747ff0af6f6b8af2eab86ddd8f1dcc9f`. Attempt 4. Parent receipt: `review-start-0016`.

Source workspace: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-16-web-design-metadata`. Publication checkout: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles`. All routes use repository storage.

The whole-feature committed three-dot diff is nonempty. Base-only workflow metadata is not a source deletion.

```sh
git diff 8591d69b747ff0af6f6b8af2eab86ddd8f1dcc9f...fb4104c7ea2e27f215fab95ec69682b71b101c1b
```

```text
fb4104c7 fix: skill-contract-manifests-16-web-design-metadata utf-8
96891691 feat: adopt skill-contract-manifests-16-web-design-metadata
```

- **Changed path:** `mise/conf.d/devtools-agent/bundles/creator/skills/web-design/SKILL.md`.
- **Changed path:** `mise/conf.d/devtools-agent/bundles/creator/skills/web-design/assets/sources.json`.
- **Changed path:** `mise/conf.d/devtools-agent/bundles/creator/skills/web-design/contracts.json`.
- **Changed path:** `mise/conf.d/devtools-agent/bundles/creator/skills/web-design/references/style-selection.md`.
- **Changed path:** `mise/conf.d/devtools-agent/bundles/creator/skills/web-design/references/source-metadata.md`.
- **Changed path:** `mise/conf.d/devtools-agent/bundles/creator/skills/web-design/references/source-metadata-upgrade.md`.
- **Changed path:** `mise/conf.d/devtools-agent/bundles/creator/skills/web-design/scripts/source-metadata.ts`.
- **Changed path:** `mise/conf.d/devtools-agent/bundles/creator/skills/web-design/scripts/sources.ts`.
- **Changed path:** `mise/conf.d/devtools-agent/bundles/creator/skills/web-design/tests/source-metadata-smoke.ts`.
- **Changed path:** `mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json`.
- **Changed path:** `mise/conf.d/devtools-agent/bundles/creator/.claude-plugin/plugin.json`.

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

Four low-severity hard prose-standard findings remain in the frozen source. These are not runtime blockers.

**standards-002:** `references/source-metadata.md:53` exceeds the ASD-STE100 rule 6.3 descriptive sentence limit. Its inventory cells at lines 9-10 and identity explanation at line 20 also violate rule 8.1. Split the coverage sentence and remove semicolons.

**standards-003:** `references/source-metadata-upgrade.md:11,17` violates rule 8.1. Replace the semicolons in the authority and integrity statements with periods.

**standards-004:** `references/style-selection.md:54` adds another rule 8.1 breach: 'A checksum mismatch stops consumption; do not repair or refresh content implicitly.' Use two sentences.

**standards-005:** `references/source-metadata.md:26-29` lacks the bold bullet lead-ins required by iso-24495-1, Scannability & Layout. New inline prose series also need vertical lists. Examples occur at metadata lines 3 and 53 and upgrade lines 5 and 7. Preserve identifiers and command syntax.

The governing code-review Language section requires ASD-STE100 and iso-24495-1. No applicable repository override was found. The only indexed architecture decision concerns Pi Ink cleanup and does not govern this change.

I independently inspected all eleven committed paths through the supplied three-dot diff. The raw-byte check precedes catalog parsing and retains valid Unicode support. I found no additional substantiated code-standard breach or Fowler smell. Tests and runtime verification belong to the primary reviewer and were not run by this leaf.

These four hard-rule findings block completion under the supplied review contract. Each has `NO ADR` because the indexed Pi Ink decision is unrelated.

The complete typed findings retain the file, line, rule, required change, and validation command in [Standards evidence](../evidence/review-0017/standards-axis.json).

## Spec

No specification findings. Reviewed the full canonical ticket and initiative against all 11 paths in the committed three-dot diff, 8591d69b747ff0af6f6b8af2eab86ddd8f1dcc9f...fb4104c7ea2e27f215fab95ec69682b71b101c1b. Both feature commits are included.

The manifest declares one owner, current production, both accepted contracts, authoritative definitions, and one explicit conversion edge. The historical reader recognizes numeric 1, not the historical contract string. Unsupported, missing, mixed, and duplicate identities fail interpretation or conversion.

The catalog change preserves capture time and all five ordered style, asset, provenance, and checksum associations. Selection uses installed assets rather than provenance locations. Equal checksums do not merge entries. Conversion replaces only the identity token and preserves unknown authored lexemes. Pure owner hooks delegate persistence to shared safe and bulk operations. Read-only consumption and installation do not upgrade catalogs. Guidance and native scenarios cover these boundaries without independently versioning prose or opaque assets. No scope creep identified.

The UTF-8 repair checks raw-byte round-trip equality before parsing. It preserves valid Unicode and existing BOM rejection. Reviewed the six source-bound parent encoding outcomes: malformed-byte validation and selection reject input; historical and current Unicode validation and selection succeed. Recorded fixture bytes remain unchanged. These are retained parent observations, not commands run by this leaf.

Read-only review only. No builds, tests, probes, source edits, or further agents. The primary owns fresh execution. Historical publication and verifier failures remain workflow history, not current source defects. The indexed Pi Ink ADR does not govern this slice.

Standards: 4 findings, worst severity low. Spec: 0 findings. The reports remain separate and retain their original ordering.

## Validation

The primary ran the absolute owning native runner from unrelated cwd `/tmp` on the frozen committed source.

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-16-web-design-metadata/mise/conf.d/devtools-agent/bundles/creator/skills/web-design/tests/source-metadata-smoke.ts
```

- **Observed outcome:** exit 0, actual 56 command records, all actual exits match their expected outcomes. Stderr is empty.
- **Execution timing:** started `2026-11-26T21:06:10.638Z`, duration 7.895426 seconds.
- **Complete capture:** [Native stdout, stderr, status, and source binding](../evidence/review-0017/native-smoke.json).
- **Observed boundaries:** public manifest resolution, current and historical consumers, all five associations, malformed-byte refusal, valid Unicode, conversion, rejection preservation, and partial bulk outcomes.
- **Source preservation:** all eleven working blobs match the frozen commit. Catalog bytes differ from the review-base catalog only at the identity token.
- **Asset preservation:** all five asset blobs match the review base. Their SHA-256 values match the catalog. Capture time remains `2026-10-22T10:12:43.516Z`.
- **Detailed bindings:** [Source and catalog preservation evidence](../evidence/review-0017/source-bindings.json).

Both exact anchored Git commands returned the same absolute common directory. Their real paths matched before axes and native verification.

```sh
git -C /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles rev-parse --path-format=absolute --git-common-dir
git -C /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-16-web-design-metadata rev-parse --path-format=absolute --git-common-dir
```

Observed output for each: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles/.git`. No relative path was resolved against the Eval cwd.

The prior UTF-8 source defect is resolved. The fresh runner exercises malformed-byte rejection before parsing and valid Unicode selection, including literal U+FFFD.

The planned candidate-cwd integration check is not an integration run:

```json
[
  {
    "argv": [
      "mise/conf.d/devtools-agent/bundles/creator/skills/web-design/tests/source-metadata-smoke.ts"
    ]
  }
]
```

## Provenance

Canonical ticket, full initiative, CONTEXT-MAP, CONTEXT, domain configuration, ADR index, and the indexed Pi Ink ADR were read. That ADR does not govern metadata.

Standards used the full Fowler baseline, hard-rule distinction, TypeScript, code-comments, ASD-STE100, ISO guidance, and shared manifest/upgrade rules. No tooling-enforced noise was promoted.

Consumed fix11, parent12, review14, parent15, approval92, review-start16, and the source-bound review-start13 draft. Historical blocked records remain blocked.

The usable draft is `workflows/skill-contract-manifests-16-web-design-metadata/artifacts/snapshots/pr-draft-review-start-0013.md`. Its historical producer receipt identifies preparation provenance, not a different source.

The malformed fix11 draft was not used or rewritten. The fixer suite remains pre-commit evidence. This review's 56 outcomes are a fresh post-commit primary execution.

A resource-capture helper parsed abbreviated tool display text and failed with `Unterminated string`. No source or native check failed.

The primary stopped and notified the parent before publication. Canonical `workflows/goal-skill-contract-manifests/events/checkpoint-0095.yaml` authorized capture-only correction within approval92.

The original abbreviated files and [capture error](../evidence/review-0017/capture-error.json) remain unchanged. Full original output was recovered under new filenames.

[Capture correction](../evidence/review-0017/evidence-capture-correction.json) links raw artifacts35/37, failed files, and corrected files. Captured checks were not repeated.

## Limits

The supplied fresh 107.15-second coordination assessment reports no hard blockers or record diagnostics. Parent `t2dv` is the sole owner.

Reservation87 was verified reconciled to parent15. Incomplete other inventory remains unknown. Generated plugin/marketplace overlap remains a future integration risk in distinct worktrees.

No integration, source edit, dependency setup, lockfile change, tracker mutation, projection update, snapshot mutation, commit, or push occurred. Relocation remains escalation-only.

Both fresh leaves ran concurrently through the installed muxer router at depth 2. Their exact `review-axis/v1` objects and hashes were validated and acknowledged.

The reports contain 205 and 234 words. Both leaves skipped builds, lint, tests, probes, and formatters. The primary alone ran verification.

Only owned leaf terminals received normal `hc kill` and `hc rm`. Both registered leaf processes are stopped. Both leaf tabs are absent.

- **Spec shutdown:** [Original full stopped observation](../evidence/review-0017/spec-resources-after-full.json).
- **Standards shutdown:** [Full stopped observation](../evidence/review-0017/standards-resources-after-full.json).
- **Desktop absence:** [Post-close desktop observation](../evidence/review-0017/desktop-after.json).
- **Axis validation:** [Separate schema and hash validation](../evidence/review-0017/axis-validation.json).

The source space retains only primary tab `skill-contract-manifests-16-web-design-metadata · review4`. Parent owns its normal closure. Unrelated resources remain untouched.

No owned services were created. This review does not establish current-base integration compatibility or authorize acceptance despite the passing runtime checks.

Parent can use this completed FAILURE result to select a scoped prose fix. No source acceptance or tracker completion follows from this review.
