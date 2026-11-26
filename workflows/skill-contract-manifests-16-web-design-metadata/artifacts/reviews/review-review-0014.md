# Web-design metadata review

## Verdict

Blocked. This attempt has no usable SUCCESS or FAILURE verdict. A required review-verifier assertion failed after the native suite passed. This is not a source-defect finding.

## Scope

Ticket: `tracker/tickets/skill-contract-manifests-16-web-design-metadata.md`. Initiative: `tracker/initiatives/skill-contract-manifests/index.md`.

Source branch: `feature/skill-contract-manifests-16-web-design-metadata`. Base branch: `master`.

Reviewed commit: `fb4104c7ea2e27f215fab95ec69682b71b101c1b`. Reviewed tree: `c7ecc92e759b7720f1ffadc4d2377473ff481403`.

Review base commit: `6fc49adca3bf1e570ec1fdc9c7ac659f76471ef8`. Timestamp: `2026-11-26T10:11:52.878143+00:00`. Attempt 3; parent `review-start-0013`.

The nonempty committed three-dot diff covers the whole feature. Base-only workflow metadata is not a source deletion.

```sh
git diff 6fc49adca3bf1e570ec1fdc9c7ac659f76471ef8...fb4104c7ea2e27f215fab95ec69682b71b101c1b
```

Source commits:

```text
fb4104c7 fix: skill-contract-manifests-16-web-design-metadata utf-8
96891691 feat: adopt skill-contract-manifests-16-web-design-metadata
```

- **Changed file:** `mise/conf.d/devtools-agent/bundles/creator/skills/web-design/SKILL.md`.
- **Changed file:** `mise/conf.d/devtools-agent/bundles/creator/skills/web-design/assets/sources.json`.
- **Changed file:** `mise/conf.d/devtools-agent/bundles/creator/skills/web-design/contracts.json`.
- **Changed file:** `mise/conf.d/devtools-agent/bundles/creator/skills/web-design/references/style-selection.md`.
- **Changed file:** `mise/conf.d/devtools-agent/bundles/creator/skills/web-design/references/source-metadata.md`.
- **Changed file:** `mise/conf.d/devtools-agent/bundles/creator/skills/web-design/references/source-metadata-upgrade.md`.
- **Changed file:** `mise/conf.d/devtools-agent/bundles/creator/skills/web-design/scripts/source-metadata.ts`.
- **Changed file:** `mise/conf.d/devtools-agent/bundles/creator/skills/web-design/scripts/sources.ts`.
- **Changed file:** `mise/conf.d/devtools-agent/bundles/creator/skills/web-design/tests/source-metadata-smoke.ts`.
- **Changed file:** `mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json`.
- **Changed file:** `mise/conf.d/devtools-agent/bundles/creator/.claude-plugin/plugin.json`.

## Affected contracts

- **Contract:** `design-source-metadata/v1`.
- **Contract:** `design-source-metadata/v2`.
- **Contract:** `skill-contract-manifest/v1`.
- **Contract:** `UpgradeOwner/safeUpgrade/bulkUpgrade`.
- **Contract:** `bundled asset SHA-256 and style/provenance associations`.
- **Contract:** `readCatalog/selectSource`.
- **Contract:** `worktree-receipt/v3`.
- **Contract:** `Creator plugin/marketplace version synchronization`.

## Standards

Reviewed the whole feature at fb4104c7ea2e27f215fab95ec69682b71b101c1b against the canonical ticket, initiative, repository context, shared manifest and upgrade rules, and installed language and TypeScript guidance. Two low-severity documentation findings remain. Neither blocks runtime correctness. No applicable ADR exists. No material Fowler heuristic finding was identified. The old malformed UTF-8 finding is resolved in the reviewed source: readCatalog checks raw-byte round-trip equality before JSON parsing. The native runner includes malformed-byte refusal and valid Unicode selection coverage. Retained parent encoding evidence records the fixed-commit outcomes. I did not run builds, lint, tests, formatters, or native probes, as instructed. The primary must own fresh suite execution. The recovered review-start-0013 snapshot names the reviewed commit and tree. The earlier blocked draft publication does not itself invalidate the source. No source, tracker, receipt, or snapshot was changed.

### standards-002 — low

NO ADR: no indexed ADR applies.

`mise/conf.d/devtools-agent/bundles/creator/skills/web-design/references/source-metadata.md:53`: Documented prose-standard violation, not a runtime blocker. ASD-STE100 rules 6.3 and 8.1 require descriptive sentences of at most 25 words and prohibit semicolons. The new sentence beginning 'It exercises public manifest resolution' exceeds that limit. Line 20 also joins the identify and detectLegacy descriptions with a semicolon.

Required change: Split the regression coverage into short sentences or a list. Replace the semicolon on line 20 with a period. Keep all contract identifiers and coverage claims unchanged.

### standards-003 — low

NO ADR: no indexed ADR applies.

`mise/conf.d/devtools-agent/bundles/creator/skills/web-design/references/source-metadata-upgrade.md:11`: Documented prose-standard violation, not a runtime blocker. ASD-STE100 rule 8.1 prohibits semicolons. The new prose uses them in 'Conversion requires separate user authority; reading and installation never run it' and 'Conversion validates metadata; actual consumption separately verifies bundled integrity' on line 17.

Required change: Replace both semicolons with periods. Preserve the authority and integrity boundaries.

## Spec

No spec blockers found in the whole feature at fb4104c7ea2e27f215fab95ec69682b71b101c1b. Reviewed the canonical ticket and initiative, source-bound review-start-0013 draft, authoritative manifest and upgrade rules, committed feature diff, owning commands, adapter, and native regression coverage. No applicable ADR governs this metadata family.

The manifest separates historical acceptance from current production and declares the shared conversion edge. The consumer retains explicit historical numeric-1 reading, rejects unsupported identities, verifies installed bundled assets independently of cwd, and preserves distinct style/provenance associations. Conversion replaces only the identity token and delegates persistence and safety checks to shared upgrades. Ordinary prose and opaque assets remain outside the metadata contract.

The prior UTF-8 finding is resolved in source: readCatalog checks byte-preserving decoding before JSON parsing. Native coverage includes malformed-byte validate/select refusals and valid Unicode with literal U+FFFD. Reviewed parent-verification-0002 evidence records all six expected post-commit outcomes with input preservation. Preservation evidence records unchanged capture metadata and all five asset associations.

This leaf ran no builds, lint, tests, or formatters. The primary owns the fresh native suite and final acceptance. The earlier fixer suite remains pre-commit evidence, not a claimed post-commit run. Blocked historical publication does not establish another source defect.

## Axis result counts

Standards: 2 low-severity documentation findings; no runtime blocker reported. Spec: 0 findings. The primary verification failure prevents a usable verdict.

## Fresh validation

The primary ran this absolute public-command runner from unrelated cwd `/tmp` on the frozen committed source:

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-16-web-design-metadata/mise/conf.d/devtools-agent/bundles/creator/skills/web-design/tests/source-metadata-smoke.ts
```

- **Native outcome:** exit 0; 56 commands; all actual exits matched their expected outcomes.
- **Execution time:** started `2026-11-26T10:07:34.792763+00:00`; duration `8.882031` seconds.
- **Complete output:** `workflows/skill-contract-manifests-16-web-design-metadata/artifacts/evidence/review-0014/native-smoke.json` retains stdout, stderr, status, count and source identities. Stderr was empty.
- **Exercised behavior:** public manifest validation and resolution, current/historical consumption, all five associations, malformed-byte rejection, valid Unicode, safe/bulk conversion, rejected identities, authored-byte preservation and checksum refusal.

The later verifier observed the frozen SHA/tree and clean source. Its all-11 committed-blob bindings passed. Its catalog and five asset preservation checks passed. Capture time remains `2026-10-22T10:12:43.516Z`. The catalog differs from source baseline `8070acd067a70b4a844a62ba357de8395c4c1c13` only by the initial identity cutover.

The verifier then raised `AssertionError` at its Git common-directory comparison. Publication `git rev-parse --git-common-dir` returned `.git`. The verifier resolved that relative path against the Eval cwd instead of the publication checkout. This reviewer-verifier error does not prove a repository mismatch or source defect. The failed assertion was not corrected or rerun. Per the stop-on-new-required-failure instruction, this review remains blocked.

- **Failure evidence:** `workflows/skill-contract-manifests-16-web-design-metadata/artifacts/evidence/review-0014/verification-failure.json`.
- **Earlier observations:** `workflows/skill-contract-manifests-16-web-design-metadata/artifacts/evidence/review-0014/preservation-before-failure.json`.

## Consumed provenance

Canonical ticket and full initiative, actual CONTEXT-MAP/CONTEXT/domain routes, and ADR index were read. The only indexed ADR concerns Pi Ink cleanup and does not govern this feature. Standards used the complete code-review smell baseline, repository rules, shared contract rules, TypeScript, code-comments and plain-language guidance.

Fix `fix-0011` truthfully remains blocked for failed MQ draft publication. Parent `fix-complete-0012` preserved that state. Approval `checkpoint-0086` authorized metadata recovery and this fresh review. The recovered immutable snapshot `workflows/skill-contract-manifests-16-web-design-metadata/artifacts/snapshots/pr-draft-review-start-0013.md` binds the fixed source. Its `receipt_id: review-start-0013` identifies preparation provenance. The malformed historical `pr-draft-fix-0011.md` was not treated as a usable draft or rewritten.

Previous review `review-0008` applied only to source `9689169146996ad84d19430cd19aa2a386c733b2`. Both new axes consider the old UTF-8 source finding resolved. This does not bypass the primary blocked-verification state. The old failing source command was not rerun.

Retained parent proof `workflows/skill-contract-manifests-16-web-design-metadata/artifacts/evidence/parent-verification-0002/encoding-native-probes.json` records six expected post-commit outcomes with unchanged fixture bytes. The earlier fixer's 56-command suite ran before commit and guidance update. Three executed blobs matched its final commit. This review's fresh 56-command run is separate post-commit evidence.

## Coordination and limits

The provided fresh 100.18-second assessment reports no hard blockers or record diagnostics. Parent `t2dv` owns closure. Reservation82 was reconciled to parent12. Incomplete inventory remains unknown. Generated marketplace/plugin overlaps in distinct worktrees remain future merge risks, not permission to integrate here. Fresh Worktrunk inventory identified one clean source at the frozen SHA/tree.

Planned candidate-cwd integration check, not executed as integration:

```json
[
  {
    "argv": [
      "mise/conf.d/devtools-agent/bundles/creator/skills/web-design/tests/source-metadata-smoke.ts"
    ]
  }
]
```

No source, dependencies, lockfiles, configuration, tracker, projections or snapshots were changed. No commits, pushes or integration occurred. No relocation implementation, serverfiles access or infrastructure termination occurred. The earlier unavailable TypeScript LSP remains a recorded limit; no loader/dependency repair was attempted. No additional native probes ran after the verifier failure.

## Resources

Fresh concurrent Standards and Spec leaves delivered exact `review-axis/v1` objects. Their envelopes, assigned axes, hashes and reports were validated and acknowledged. Reports contain 131 and 192 words respectively. Each leaf skipped builds, lint, tests and formatters.

Only their owned terminals received normal `hc kill` and `hc rm`. Post-close resource observations confirm all four registered leaf processes stopped. Both leaf tabs are absent. No owned services were created. Primary `t2k3` remains for parent closure in its source space. Unrelated resources remain untouched.

- **Leaf validation:** `workflows/skill-contract-manifests-16-web-design-metadata/artifacts/evidence/review-0014/axis-validation.json`.
- **Shutdown evidence:** `workflows/skill-contract-manifests-16-web-design-metadata/artifacts/evidence/review-0014/axis-resources-after.json`.
- **Desktop observation:** `workflows/skill-contract-manifests-16-web-design-metadata/artifacts/evidence/review-0014/desktop-after.json`.

## Next step

Parent must inspect the blocked result and the retained verifier failure. Obtain scoped authorization before correcting verification or starting another review attempt. No source acceptance, tracker completion or integration is authorized by this artifact.
