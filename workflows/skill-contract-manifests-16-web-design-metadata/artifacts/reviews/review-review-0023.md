# Web-design metadata review

This review gives the parent coordinator a source-bound verdict. Date: 2026-11-26T21:46:31.663Z.

## Overview

FAILURE. Documented prose rules still block completion. Passing native behavior does not waive these hard rules. No source acceptance follows from this review.

## Contents

- **Frozen scope:** [Source and committed changes](#scope).
- **Affected contracts:** [Producer and consumer boundaries](#contracts).
- **Standards report:** [Independent Standards findings](#standards).
- **Spec report:** [Independent specification review](#spec).
- **Observed validation:** [Fresh execution and preservation](#validation).
- **Review provenance:** [Inputs and historical limits](#provenance).
- **Resource limits:** [Coordination and owned resources](#limits).

## Scope

Ticket: `tracker/tickets/skill-contract-manifests-16-web-design-metadata.md`. Initiative: `tracker/initiatives/skill-contract-manifests/index.md`.

Source branch: `feature/skill-contract-manifests-16-web-design-metadata`. Base branch: `master`.

Reviewed commit: `d50d3bb1719c03c53f9dc911a34017ca09cddfd6`. Tree: `bb15b43f805dbc4946d846862e16caddd485621a`.

Review base commit: `9d105f926b6885401732e62d187e0444260e6b61`. Attempt 5. Parent receipt: `review-start-0022`.

Source workspace: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-16-web-design-metadata`.

Publication checkout: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles`. All routes use repository storage. Publication and source identities remain separate.

The whole-feature committed three-dot diff is nonempty. Base-only workflow metadata is not a source deletion.

```sh
git diff 9d105f926b6885401732e62d187e0444260e6b61...d50d3bb1719c03c53f9dc911a34017ca09cddfd6
```

```text
d50d3bb1 docs: clarify skill-contract-manifests-16-web-design-metadata prose
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

Complete inputs: [Committed diff](../evidence/review-0023/committed.diff) and [actual commit list](../evidence/review-0023/commits.txt).

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

Reviewed the complete committed diff and all eleven paths for d50d3bb1719c03c53f9dc911a34017ca09cddfd6 against 9d105f926b6885401732e62d187e0444260e6b61. Three low-severity documented prose breaches remain. These are explicit house rules, not claims that ISO itself mandates these layouts. The metadata-consumption paragraph still contains inline three-item series.

No additional material Fowler-smell heuristic finding was identified. Excluded unchanged baseline and tooling-enforced noise. The supplied ADR concerns Pi Ink and does not govern this change. Used MQ for local Markdown inspection.

No source edits, builds, lint, tests, formatters, native checks, or probes were performed. Runtime outcomes remain for the primary reviewer.

**standards-006 — NO ADR:** `references/style-selection.md:55,57` adds inline three-item series. They describe selection actions, outputs, and reference topics. Line 55 also contains six sentences in one paragraph.

The ISO skill's Scannability & Layout house rule requires vertical lists for these series. Its Sentence & Paragraph Limits rule permits at most five sentences. Use labelled lists and shorter paragraphs. Preserve explicit companion selection and the checksum refusal.

**standards-007 — NO ADR:** `SKILL.md:38` adds an inline series of three definition topics. Convert it to a vertical list with bold lead-ins. Preserve the authoritative link and read-only boundary.

**standards-008 — NO ADR:** `references/source-metadata-upgrade.md:52` contains seven sentences in one paragraph. This exceeds the ISO skill's five-sentence limit and ASD-STE100 rule 6.6. Separate bulk outcomes from conversion and consumption integrity.

All three findings have low severity. Each blocks completion because it violates an explicit governing rule. These are house-rule findings, not ISO conformance claims. No applicable repository override exists.

Full paths, required changes, and manual validation commands remain in [typed Standards evidence](../evidence/review-0023/standards-axis.json). Finding order remains unchanged.

## Spec

No spec findings. Reviewed the full eleven-path committed diff for d50d3bb1719c03c53f9dc911a34017ca09cddfd6 against base 9d105f926b6885401732e62d187e0444260e6b61 and the supplied ticket and initiative. The manifest separates historical acceptance from current production. The owner declares numeric-1 historical interpretation, rejects unsupported identities, and exposes a pure conversion through shared persistence.

The catalog diff retains all five ordered associations, provenance, capture time, and checksums. Conversion preserves nonidentity authored bytes and numeric lexemes. Consumption verifies installed bundled assets without opening provenance locations. Guidance retains immutable/path refusals, independent bulk outcomes, and separate metadata validation and asset integrity checks.

No unnecessary prose or opaque-asset contracts were added. The command regression source covers current and historical consumption, rejected identities, preservation, and partial bulk outcomes. This was a read-only source review. No builds, lint, tests, formatters, or probes ran.

Fresh native verification remains the primary owner responsibility. Formatting questions belong to the Standards axis; no heuristic was treated as a spec requirement.

Standards: 3 findings, worst severity low and hard. Spec: 0 findings. The axes remain separate.

## Validation

The primary ran the absolute owning executable once from unrelated cwd `/tmp` on the frozen committed source.

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-16-web-design-metadata/mise/conf.d/devtools-agent/bundles/creator/skills/web-design/tests/source-metadata-smoke.ts
```

- **Observed outcome:** Exit 0. Actual 56 command rows. Every actual exit matches its expected exit. Stderr is empty.
- **Execution timing:** Started `2026-11-26T21:42:55.475Z`. Duration: 7.839245 seconds.
- **Complete capture:** [Native stdout](../evidence/review-0023/native-stdout.txt), [stderr](../evidence/review-0023/native-stderr.txt), and [source-bound execution record](../evidence/review-0023/native-smoke.json).
- **Outcome validation:** [Actual row count and comparisons](../evidence/review-0023/native-validation.json).

Fresh execution covers current and historical consumption through owning commands. It also exercises shared conversion and truthful partial bulk outcomes. Invalid identifiers and malformed bytes fail. Valid Unicode, including literal U+FFFD, remains usable.

All eleven reviewed working blobs equal frozen committed blobs. The three prose references changed between `fb4104c7` and `d50d3bb1`. They are not part of the unchanged-fb set.

The unchanged-fb set contains these files:

- **Runtime files:** `source-metadata.ts`, `sources.ts`, and `source-metadata-smoke.ts`.
- **Contract manifest:** `contracts.json`.
- **Source catalog:** `assets/sources.json`.
- **Skill guidance:** `SKILL.md`.
- **Bundled assets:** All five assets.

Catalog nonidentity bytes match the review base and the parent's numeric baseline. Capture remains `2026-10-22T10:12:43.516Z`. All five ordered associations remain exact. Each asset matches its checksum and both reviewed baselines. Equal hashes do not collapse entries.

Detailed byte bindings: [Source and asset preservation](../evidence/review-0023/source-bindings.json).

Both exact anchored Git commands returned the same absolute common directory before axes and native verification. Their real paths matched.

```sh
git -C /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles rev-parse --path-format=absolute --git-common-dir
git -C /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-16-web-design-metadata rev-parse --path-format=absolute --git-common-dir
```

Observed output for each: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles/.git`. [Absolute identity evidence](../evidence/review-0023/git-common-directories.json) retains both anchors.

The candidate integration command remains planned, not executed:

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

Canonical publication records supplied the ticket and full initiative. Source-copied workflow records were not authoritative. The primary read actual context, domain guidance, ADR index, and the indexed Pi Ink ADR. That ADR does not govern metadata.

Consumed implementation2, fix20, parent21, review17, and parent18. The current valid draft is `artifacts/snapshots/pr-draft-fix-0020.md`. Its actual header binds fix20 to the frozen source.

Prior findings standards-002 through standards-005 have their targeted corrections. Semicolons were removed. Coverage claims and identity rules survived the list changes. The original field bullets now have bold lead-ins. New findings do not relabel the prior findings.

The full-feature check still finds added prose violations. The parent question about selection triples is independently substantiated as standards-006. Unchanged baseline prose is not promoted.

Fix20's native evidence remains precommit evidence. This review's native capture is fresh postcommit execution. The six parent encoding outcomes remain historical observations on `fb4104c7`, not runs on `d50d3bb1`.

The parent separately observed all 26 immutable-history checksums pass. This is a retained parent observation, not primary execution. See [parent historical byte check](../evidence/review-0023/parent-historical-byte-check.json).

Historical blocked or unusable reviews remain historical. Bad snapshot11 was neither selected nor rewritten. No known old-source failure was rerun. Full subprocess bytes supplied native evidence, not abbreviated tool display text.

## Limits

The supplied fresh 96.04-second three-scope assessment reports no hard blockers or record diagnostics. Parent `t2dv` is the sole matching owner. Reservation97 is reconciled to parent21. Incomplete other inventory remains unknown.

Four generated-file overlaps in distinct worktrees remain future integration risks. They do not share this mutable source index. No merge or generator change occurred.

Two fresh leaves ran concurrently through the installed router at depth 2. Both exact `review-axis/v1` objects passed identity and hash validation before ACK. Their reports contain 92 and 151 words. Paragraph breaks are the only report presentation changes.

Both leaves skipped builds, lint, tests, formatters, and probes. The primary alone ran native verification. [Axis validation](../evidence/review-0023/axis-validation.json) retains the separate bindings.

Only exact owned leaf terminals received normal `hc kill` and `hc rm`. Both registered processes are stopped and shutdown is confirmed.

- **Standards shutdown:** [Full after-resource report](../evidence/review-0023/standards-resources-after.json).
- **Spec shutdown:** [Full after-resource report](../evidence/review-0023/spec-resources-after.json).
- **Desktop absence:** [Post-close desktop observation](../evidence/review-0023/desktop-after.json) shows no leaf tabs.

The source space retains only primary tab `skill-contract-manifests-16-web-design-metadata · review5`. Parent owns primary closure. No owned services were created. Unrelated resources remain untouched.

No source edit, dependency setup, configuration change, tracker write, snapshot rewrite, projection update, commit, push, or integration occurred. Relocation remains escalation-only.

Parent owns ACK, tracker comment, closure, acceptance, and the next scoped fix decision. This FAILURE is usable only for the exact frozen source.

