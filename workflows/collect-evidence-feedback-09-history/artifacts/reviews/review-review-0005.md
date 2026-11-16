---
title: Independent historical evidence review
type: Concept
---

# Historical evidence review

## Verdict

FAILURE. Standards: 0 findings. Spec: 1 blocking P2 finding (SPEC-01).

## Scope

Ticket: [collect-evidence-feedback-09-history](../../../../tracker/tickets/collect-evidence-feedback-09-history.md). Complete specification: tracker/initiatives/collect-evidence-feedback/index.md.

Source branch: feature/collect-evidence-feedback-09-history. Base branch: master.

Reviewed commit: 710abe78428a93c4d22f2981d71614f598bf82f5. Tree: 49c19b9e9e19178bb21d826ae558d460e9035221.

Review base: 2865ba368520d517fbfc20385398b7bbdfe62b42. Diff: git diff 2865ba368520d517fbfc20385398b7bbdfe62b42...710abe78428a93c4d22f2981d71614f598bf82f5.

Timestamp: 2026-11-16T09:02:02.996Z. Independent review session: herdr-app:t1bw, run f647b84a-1094-44ca-85b3-38da05a58d56. Source commit, tree and clean status matched before and after review. No source changes, commits, merge or push occurred.

## Changed scope

- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/references/evidence-schema.md`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/pipeline.ts`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/CHANGELOG.md`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/SKILL.md`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/how-to-browse-evidence.md`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/references/viewer-contract.md`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/annotations.ts`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/commands.ts`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/records.ts`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/historical-fixture.md`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/historical-run/cases/original/case.json`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/historical-run/cases/original/events.jsonl`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/historical-run/cases/original/index.md`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/historical-run/cases/original/media/step-002-step-original-002-original--capture-001--capture-001.png`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/historical-run/cases/original/media/step-002-step-original-002-original--capture-002--capture-002.png`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/historical-run/index.md`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/historical-run/native/plan.ts`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/historical-run/native/report/shots/step-original-002-original--capture-001.png`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/historical-run/native/report/shots/step-original-002-original--capture-002.png`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/historical-run/native/runs/case-original.log`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/historical-run/native/workflows/smoke-test-original.js`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/historical-run/plan.json`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/historical-run/plan.ts`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/historical-run/run.json`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/history-workflow.test.ts`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/workflow.test.ts`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/index.html`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/src/main.tsx`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/src/types.ts`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/developer/skills/devtools/writing-reports/SKILL.md`
- **Reviewed path:** `mise/conf.d/devtools-agent/bundles/developer/skills/devtools/writing-reports/scripts/report-cli.ts`

## Affected contracts

- **Contract:** collect-evidence/v1 common evidence records and report rendering
- **Contract:** collect-feedback/v1 historical session provenance and exports
- **Contract:** writing-reports evidence public command
- **Contract:** Bundled feedback viewer
- **Contract:** Developer bundle version manifests

## Coordination and integration

The context checkout and source share the Git common directory at /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles/.git. Publication uses the context checkout only. The parent owns the completed implementation and authorized this fresh review. No implementation session remains active according to the supplied shutdown evidence.

The recorded inventory is incomplete because linked tickets are stale and an unrelated Pi coordinator journal is malformed. Unknown scopes do not prove compatibility. Marketplace and developer plugin manifests overlap the muxer stream. Standards independently compared current local master 05b95badff2af8a61f96c9187885c5745a0b2c14. Only the developer version changes, from 0.2.43 to 0.2.45; both manifests agree. No discovery structure conflict was found. Recheck compatibility against the eventual integration base. This source review does not approve unreviewed integration changes.

Required integration check: mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/history-workflow.test.ts.

## Standards

No documented-standard violations or actionable baseline smells found across the 34 changed paths. Review covered loaded AGENTS rules, context, domain configuration, applicable skill contracts and the code-review smell baseline. The ADR index contains only the Pi Ink cleanup trust boundary; it does not govern this slice. ADR reference: NO ADR. The common report renderer remains the result source. Historical selection adds an optional field without rewriting existing sessions.

Standards transport: run e073e3d7-4ef4-4fe1-b7ae-d3fe08fa6ae0, terminal t1bz. Its verified transport is not an authoritative review body.

## Spec

### SPEC-01 — P2 — Blocking

NO ADR: Invalid command input bypasses the versioned report error boundary.

File: mise/conf.d/devtools-agent/bundles/developer/skills/devtools/writing-reports/scripts/report-cli.ts:20 (router registration at line 40).

The new evidence command lets Crust reject invalid arguments before its run callback. Both `evidence --json` and `evidence /tmp/missing --unknown --json` return exit 1, empty stdout and a plain stderr error. The common command contract requires versioned JSON and exit 2 for invalid arguments.

Specification: user story 50 requires “versioned JSON output and clear exit codes”. Commands and execution rule 14 requires “2 for invalid arguments or schemas”.

Observed from unrelated cwd /tmp:

| Invocation after the absolute report-cli.ts path | Exit | stdout | stderr |
|---|---:|---|---|
| evidence --json | 1 | empty | Error: Missing required argument "<directory>" |
| evidence /tmp/missing --unknown --json | 1 | empty | Error: Unknown flag "--unknown" |

Required change: handle parser failures at the router boundary. Reuse the existing public command error convention. With --json, emit one collect-evidence/v1 error object with success false and code 2; exit 2.

Validation command: run the absolute writing-reports/scripts/report-cli.ts with each argument list above from /tmp. Assert the JSON envelope and exit 2.

Blocking reason: machine callers cannot consume the new public command reliably for invalid input. A plain diagnostic and operation-failure exit violate its required command contract.

Other inspected historical requirements match the intended slice. Public verification preserves source bytes, original dates, asset identities and saved feedback. The test also covers unknown capture dates and unsupported explicit versions. No automatic migration or invented assertion results were observed.

Spec transport: run a319cbaa-76a6-4e00-a8db-42db8a5eafb0, terminal t1by. The parent replaced its inferred parser concern with the runtime evidence above.

## Validation

The axes performed read-only investigation in parallel. This reviewer ran checks once afterward.

- **Integration regression:** mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/history-workflow.test.ts; cwd /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-09-history; exit 0. One test passed, zero failed, 48 assertions. It exercises explicit imports, source and feedback preservation, report/export agreement, unknown dates and unsupported versions.
- **Public commands:** Invoked absolute source-installed feedback and report entrypoints from /tmp. The temporary resolved repository is /tmp/history-review-bAF0LN/repository. Historical dry-run and import exited 0. The real earlier source is /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles/workflows/collect-evidence-feedback-06-edits/artifacts/evidence/edits-source-0001.
- **Report agreement:** Two report commands and two exports exited 0. Reports were byte-identical; exports were byte-identical. The report feedback object equals the export. Case order is original; recorded verdict is PASS. Original archive hashes and all saved-session hashes remained unchanged.
- **Actual viewer:** Started the public serve command on explicit loopback port 19879. The bundled page showed original historical pixels, original capture dates and the historical notice. Created a point note, saved it, reloaded and reopened the same saved annotation. The report HTML also displayed the historical notice and recorded PASS result in a real browser tab.
- **Parser boundaries:** Both commands in SPEC-01 returned exit 1 with empty stdout. These are observed failures, not inferred findings.
- **Helper limitation:** An initial browser wait for mixed-case “Saved annotation” timed out because the visible heading is uppercase. Inspection showed Saved · revision 1. Reload leaves the annotation editor closed; reopening the saved pin displayed the preserved comment. Neither helper assumption indicates a product failure.
- **Source preservation:** Before and after checks returned 710abe78428a93c4d22f2981d71614f598bf82f5, 49c19b9e9e19178bb21d826ae558d460e9035221, and empty git status --porcelain.

Earlier implementation validation, preservation JSON and viewer/report screenshots were consumed as inputs. They are not new evidence captures from this review. No new evidence-run envelope was invented. Review screenshots remain temporary tool observations; no extra workflow artifact was created.

## Cleanup

Owned viewer PID 527765 exited 0 after SIGINT. Port 19879 refused connections and .writer.lock was absent. Both owned browser tabs were released. Axis terminals t1by and t1bz were killed and removed after completion and verified transport acknowledgement. Router resource observations confirmed shutdown for both child runs at 09:00:38 UTC. Shared browser and harness processes were preserved. The parent owns terminal t1bw closure.

## Next action

Fix SPEC-01 in a new authorized fix session. Obtain a fresh independent review for the new source commit. Do not merge this frozen source as accepted.

