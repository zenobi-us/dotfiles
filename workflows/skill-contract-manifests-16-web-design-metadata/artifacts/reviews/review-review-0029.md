# Web-design metadata review

This review gives the parent coordinator a verdict for the frozen source. Reader: the parent coordinator. Date: 2026-11-26T22:15:14.340569+00:00.

## Overview

FAILURE. Two documented opening-block rules remain unmet. Their low severity does not waive a hard rule. The native checks passed, but they do not establish source acceptance.

The parent must resolve the findings before a new independent review. This review makes no source changes and authorizes no integration.

## Contents

- **Frozen source:** [Scope](#scope).
- **Affected boundaries:** [Contracts](#contracts).
- **Standards axis:** [Standards](#standards).
- **Specification axis:** [Spec](#spec).
- **Observed checks:** [Validation](#validation).
- **Historical boundaries:** [Provenance](#provenance).
- **Ownership limits:** [Coordination and resources](#coordination-and-resources).

## Scope

Ticket: `tracker/tickets/skill-contract-manifests-16-web-design-metadata.md`. Initiative: `tracker/initiatives/skill-contract-manifests/index.md`.

Source branch: `feature/skill-contract-manifests-16-web-design-metadata`. Base branch: `master`.

Reviewed commit: `dab2338e6be69e208c39c6c05164c0a1a066dbf7`. Reviewed tree: `85f6c82ecdf7dd5d51f6d4552ea933b7ab82a78f`.

Review base commit: `ad499c679ba1c414430bc674750ce1ae541316e6`. Attempt: 6. Parent receipt: `review-start-0028`.

Source workspace: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-16-web-design-metadata`.

Publication checkout: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles`. All routes use repository storage. These are separate checkout identities with the same physical Git common directory.

Both actual checkout-anchored commands returned absolute paths before axis review or native verification:

```sh
git -C /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles rev-parse --path-format=absolute --git-common-dir
git -C /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-16-web-design-metadata rev-parse --path-format=absolute --git-common-dir
```

Both resolved to `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles/.git`. Relative `.git` resolution was not used.

The complete committed three-dot diff is nonempty. Base-only workflow metadata is not a source deletion.

```sh
git diff ad499c679ba1c414430bc674750ce1ae541316e6...dab2338e6be69e208c39c6c05164c0a1a066dbf7
```

Actual commits:

```text
dab2338e6be69e208c39c6c05164c0a1a066dbf7 docs: fix skill-contract-manifests-16-web-design-metadata lists
d50d3bb1719c03c53f9dc911a34017ca09cddfd6 docs: clarify skill-contract-manifests-16-web-design-metadata prose
fb4104c7ea2e27f215fab95ec69682b71b101c1b fix: skill-contract-manifests-16-web-design-metadata utf-8
9689169146996ad84d19430cd19aa2a386c733b2 feat: adopt skill-contract-manifests-16-web-design-metadata
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

Complete inputs: [Committed diff](../evidence/review-0029/committed.diff) and [actual commit list](../evidence/review-0029/commits.txt).

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

Reviewed the full eleven-path feature diff from ad499c679ba1c414430bc674750ce1ae541316e6 to dab2338e6be69e208c39c6c05164c0a1a066dbf7. The targeted fixes resolve standards-006 through standards-008: selection actions and outputs use vertical lists, the skill links three definition topics through labelled bullets, and the upgrade conclusion uses separate short paragraphs. Explicit companions, authoritative links, and checksum refusal remain intact.

Two low-severity documented house-rule findings remain in the newly added references. These concern required document opening fields, not ISO conformance or catalog schema versions. No additional baseline smell warrants a finding. ADR 0001 concerns Pi Ink cleanup and does not govern this feature. Unchanged baseline prose and tooling-enforced concerns are excluded.

Read-only review only. No source edits, builds, lint, tests, formatters, or runtime probes ran. Runtime verification and frozen-blob checks remain the primary reviewer's responsibility.

**standards-009 — NO ADR, low, hard:** `mise/conf.d/devtools-agent/bundles/creator/skills/web-design/references/source-metadata.md:1`.

Hard documented house-rule breach. iso-24495-5/SKILL.md, rule 7, requires an opening block with purpose, intended reader, and version or date. This entirely new reference opens with ownership and implementation details. It does not name its intended reader or give a document version or date. Contract identifiers later in the document describe catalog formats, not this document.

Required change: Add a concise opening block that states the reference purpose, names its intended reader, and supplies a document date. Do not add a contract identifier to ordinary prose.

```sh
mise exec -- mq --allow-http-import --no-lockfile -I raw -F raw 'import "github.com/harehare/okf.mq" | .' mise/conf.d/devtools-agent/bundles/creator/skills/web-design/references/source-metadata.md; manually inspect the opening against iso-24495-5 rule 7.
```

**standards-010 — NO ADR, low, hard:** `mise/conf.d/devtools-agent/bundles/creator/skills/web-design/references/source-metadata-upgrade.md:1`.

Hard documented house-rule breach. iso-24495-5/SKILL.md, rule 7, requires an opening block that names the intended reader and gives a document version or date. This entirely new procedure supplies neither. Its conversion endpoint identifiers do not identify the document revision.

Required change: Name the procedure's intended reader and add a document date near its purpose statement. Preserve separate conversion authority and the existing refusal boundaries.

```sh
mise exec -- mq --allow-http-import --no-lockfile -I raw -F raw 'import "github.com/harehare/okf.mq" | .' mise/conf.d/devtools-agent/bundles/creator/skills/web-design/references/source-metadata-upgrade.md; manually inspect the opening against iso-24495-5 rule 7.
```

Each finding blocks completion because it breaches a governing house rule. No applicable repository override was found. These are not ISO conformance claims. A document date is not an injected prose contract.

## Spec

No specification findings in the eleven-path feature diff from ad499c679ba1c414430bc674750ce1ae541316e6 to dab2338e6be69e208c39c6c05164c0a1a066dbf7.

The canonical ticket and full initiative require explicit contract ownership, historical interpretation, safe conversion, and actual metadata consumption. The manifest declares numeric-1 historical acceptance and current v2 production. Both definitions resolve to the owning metadata reference. Unknown explicit identities, mixed identities, missing identities, and duplicate keys stop interpretation.

The reader checks raw UTF-8 bytes before parsing. Bundled assets resolve from the installed owner, not provenance locations or the selected catalog directory. Selection retains separate style and asset identities despite equal hashes. The catalog change replaces only its identity; all five ordered associations and the original capture time remain intact.

The pure owner adapter replaces only the identity token. Shared safeUpgrade and bulkUpgrade retain persistence ownership. Immutable content and historical paths are refused. Conversion preserves nonidentity authored text, including numeric lexemes. Read-only commands perform no conversion. Native command coverage includes current and historical consumption, invalid identities, rejected writes, integrity failure, and independent partial bulk outcomes.

The three final prose fixes retain authoritative links, explicit companion selection, and checksum refusal boundaries. No unrelated contract fields or second upgrade framework were added. ADR0001 concerns Pi Ink cleanup and imposes no feature requirement here.

Read-only review only. No builds, tests, formatters, or runtime probes were run; primary verification remains separate.

Standards: 2 findings, worst severity low and hard. Spec: 0 findings. The axes remain separate and retain their finding order.

## Validation

The primary ran the absolute owning executable once from unrelated cwd `/tmp`, after the frozen commit existed:

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-16-web-design-metadata/mise/conf.d/devtools-agent/bundles/creator/skills/web-design/tests/source-metadata-smoke.ts
```

Execution began at `2026-11-26T22:11:11.301Z`. Duration: 8.460242 seconds. Outer exit: 0. Stderr was empty.

All 56 actual rows matched their expected exits. There were 21 successful commands and 35 expected negative exits. Full subprocess buffers, not abbreviated tool display text, supplied these counts.

- **Native record:** [Full command and source binding](../evidence/review-0029/native-smoke.json).
- **Complete stdout:** [Original native stdout](../evidence/review-0029/native-stdout.txt).
- **Complete stderr:** [Original native stderr](../evidence/review-0029/native-stderr.txt).
- **Row comparisons:** [Observed native outcomes](../evidence/review-0029/native-validation.json).
- **Frozen blobs:** [Source and asset bindings](../evidence/review-0029/source-bindings.json).
- **Additional bindings:** [Parent checksums and generated versions](../evidence/review-0029/additional-bindings.json).

All eleven working blobs equal the frozen committed objects. The protected six runtime/definition/catalog files equal `d50d3bb1719c03c53f9dc911a34017ca09cddfd6`. All five ordered asset associations and their provenance match the parent baseline. Each asset matches its parent checksum and unchanged-d50 bytes.

Catalog bytes differ from the parent numeric baseline only at the identity token. Capture time remains `2026-10-22T10:12:43.516Z`. Equal hashes do not collapse entries. Creator plugin and marketplace versions both equal `0.1.7`.

Manual MQ inspection covered the three changed prose sections. Vertical lists and bold labels resolve findings006–008. The final upgrade paragraphs contain three and four sentences. Explicit companion selection and checksum refusal remain intact.

The declared integration check remains planned until it runs against an integration candidate:

```json
[{"argv": ["mise/conf.d/devtools-agent/bundles/creator/skills/web-design/tests/source-metadata-smoke.ts"]}]
```

## Provenance

The canonical publication ticket and full initiative were read. Actual context and ADR records were read. ADR0001 governs Pi Ink cleanup, not this feature. The Standards axis received the full smell baseline verbatim. Smells remain heuristics, not hard rules.

Consumed records include implementation2, fix26 and parent27. Previous review23 and parent24 retain their completed FAILURE on d50. The new source does not inherit that verdict. Current snapshot26 binds fix26 to the frozen dab commit and tree.

Snapshot20 belongs to d50. Snapshot13 remains valid recovery evidence. Snapshot11 remains malformed historical evidence. No old artifact was selected by filename sorting or rewritten.

Fix26 ran after its final prose edits and before commit. Its six code/document bindings equal committed objects. Parent27 retained that evidence and confirmed 156 older immutable files. Those are retained observations, not this review's executions.

Older parent encoding probes concern unchanged runtime on an earlier source. They were not rerun or claimed as dab executions. The fresh native run independently exercises malformed UTF-8 and valid Unicode. No known old-source failure was rerun.

## Coordination and resources

The supplied fresh three-scope assessment reports no hard blockers or record diagnostics. Parent t2dv remains the sole matching recorded/live owner. The exact source is unique. Reservation103 was reconciled to parent27. Incomplete other inventory remains unknown.

Four generated-file overlaps remain future integration risks in distinct worktrees. No shared mutable source index, generator change or merge occurred. Ticket15 dependencies and aliases were not added.

Two fresh concurrent leaves ran at depth2 under this depth1 primary. Titles named the ticket and axis. Router launches used actual Bash session calls and non-focusing desktop creation. The leaves ran no runtime checks.

Both exact-schema reports passed run, operation and hash validation before acknowledgement. [Axis validation](../evidence/review-0029/axis-validation.json) retains their hashes. Both owned terminals were observed before normal `hc kill` and `hc rm` closure.

- **Standards shutdown:** [Full after-resource report](../evidence/review-0029/standards-resources-after-full.json) confirms every registered process stopped.
- **Spec shutdown:** [Full after-resource report](../evidence/review-0029/spec-resources-after-full.json) confirms every registered process stopped.
- **Desktop absence:** [Desktop after closure](../evidence/review-0029/desktop-after.json) contains neither leaf terminal.
- **Capture correction:** [Resource interpretation correction](../evidence/review-0029/resource-capture-correction.json) preserves a validator-only error. The original successful resource observation was read without repeating closure or native checks.

The primary remains open for parent closure. No extra signals or external process operations occurred. Relocation remains escalation-only. Parent owns acknowledgement of this result, tracker publication, closure and acceptance.

