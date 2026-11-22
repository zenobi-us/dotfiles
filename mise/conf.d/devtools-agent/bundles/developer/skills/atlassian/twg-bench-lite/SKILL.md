---
name: twg-bench-lite
description: >
  Run a lightweight single-prompt A/B comparison of free Atlassian/local MCP
  context vs TWG CLI graph context using paired read-only agent sessions.
---

# twg-bench-lite

Run `scripts/benchmark-lite/runner.ts` directly. Use its `run`, `render`, and `doctor` subcommands.

Run one read-only prompt twice: once with free Atlassian/local MCP context and
once with paid Atlassian Teamwork Graph context through TWG CLI. This is a
skill-first workflow with a thin `twg benchmark lite run` bridge. The benchmark
repo owns reusable runner, judge, and report-template code.

## CLI launcher fallback

Run `twg <command>`. On shell `command not found`, use `$HOME/.local/bin/twg`
(macOS/Linux) / `$env:LOCALAPPDATA\Programs\twg\bin\twg.exe` (PowerShell), then
tell user to add that directory to PATH. Do not treat auth or command errors as
PATH failures.

## Runtime Support

V1 supports Codex and Rovo live runs. Claude is V2. Do not require users to
install the benchmark CLI locally.

## Eligibility

Use a text-only read task both arms can attempt. Do not compare mutations; for
writes, compare a read-only plan or dry-run only after user approval. Preserve
the underlying prompt byte-for-byte for both arms.

## Prerequisite

For the default full lifecycle command, verify the portable runner and selected
runtime first:

```bash
twg benchmark lite --check
```

The default check is Codex; use `--agent rovo` when the run should use Rovo.

For Rovo runs:

```bash
twg benchmark lite --check --agent rovo
```

The quality judge defaults to the selected runtime, so Rovo runs use a Rovo
judge by default. If the user explicitly wants a different judge runtime, use:

```bash
twg benchmark lite --check --agent rovo --judge-agent codex
```

The managed custom agents are only required for manual orchestration:

- `twg-bench-lite-control`
- `twg-bench-lite-test`

If a manual run needs either agent and it is missing, tell the user to run:

```bash
twg skills install --yes
```

Then start a fresh Codex thread so agent discovery refreshes. Do not substitute
generic agents for manual orchestration because arm isolation is the point.

Before a live run, verify setup with:

```bash
twg benchmark lite --check
```

This checks the bundled runner artifact and the selected live-run runtime.
Codex checks include the Codex executable and Codex home. Rovo checks include
the Rovo executable and OAuth status. If `--judge-agent` differs from `--agent`,
the check verifies both runtimes. It also reports the global `twg-bench-lite`
skill install and managed control/test Codex agent configs as manual-workflow
optional checks when relevant.

## Arms

- **Control - Free Atlassian with Local MCPs Context:** use free Atlassian tools
  plus user-local MCPs/connectors. Do not use TWG CLI, TWG skills, paid graph
  tools, prior artifacts, or local files as task evidence unless the prompt is
  explicitly about local files.
- **Test - Paid Atlassian Teamwork Graph Context:** use TWG CLI graph context
  with bundled TWG guidance as the primary work-data source.

## Paired Run

For the default full lifecycle, run:

```bash
twg benchmark lite run --prompt "<read-only prompt>" --output-dir <dir>
```

Use `--agent rovo` to run the same lifecycle with Rovo.
The quality judge uses the same runtime unless `--judge-agent codex|rovo` is
supplied.

For manual orchestration:

1. Save the exact comparison prompt.
2. Ask TWG CLI for the test-arm route before launching the paired agents:
   `twg benchmark lite plan --prompt-file <prompt-file> --json`.
3. Spawn both managed agents concurrently with no forked parent context:
   `twg-bench-lite-control` and `twg-bench-lite-test`.
4. Send the identical prompt as the complete user message to each child. Do not
   add arm-specific instructions; the managed agent configs own isolation.
   The test agent may receive the TWG route plan as tool-selection policy only;
   it is not answer evidence.
5. Leave model/reasoning overrides unset unless the user asks; apply any
   override equally to both arms.
6. Wait for both children to finish and record their agent IDs or session links.
7. Do not solve the task again in the parent. The parent compares, evaluates,
   and reports.

Print lifecycle progress in the parent session: start, prompt captured, agents
started, each arm finished, outputs read, quality reviewed, report compiled,
done.

## Quality

Read both answers before interpreting token delta. Classify as `equivalent`,
`twg-better`, `control-better`, `capability-gain`, or `not-comparable`.
`not-comparable` is a real outcome for missing, unusable, or non-comparable
answers, not a placeholder. Claim observed savings only for `equivalent` or
`twg-better`; for `capability-gain`, report capability instead.

Evaluate coverage, correctness, evidence quality, directness, and limitations.
Do not assign numeric quality scores.

## Lite Report

Return a compact report in the parent answer with:

- prompt text,
- control/test status and final outputs,
- observed tool families and TWG command evidence when available,
- token/tool/duration metrics when the agent runtime exposes them,
- quality classification and rationale,
- integrity notes: identical prompt, expected roles, TWG absent from control,
  TWG used in test, and any measurement gaps.

If token/session metrics are unavailable, say "not measured"; do not estimate.
Describe the result as one observed prompt comparison, not a universal
efficiency rate.

## Record contracts

Install the sibling `skill-contracts` skill with this skill. Both runtime entrypoints use its absolute router through the same reader. Manifest validation requires mise and Bun, including when Node runs the benchmark. Missing definitions stop the operation. Keep `contracts.json`, `references/`, and all `scripts/benchmark-lite/` modules together when copying this skill.

New records use `schemaVersion: twg-benchmark-{family}/v2`. Families are configuration, result, manifest, judgement, run, and progress. The run record is the command JSON payload. Each progress JSONL line has its own identifier. `contractVersion` remains the benchmark protocol revision. It does not select a schema or runtime release.

Read `references/contracts.json` for the owned definitions. Numeric `schemaVersion: 1` is supported only for historical configuration, result, and manifest records. Historical judgement, run, and progress records have no identifier and must match their known shape. Unknown explicit identifiers fail. Readers never stamp or upgrade stored evidence.

Use the same commands in either runtime:

```bash
mise exec -- bun scripts/benchmark-lite/runner.ts check configuration scripts/benchmark-lite/contract.json
node scripts/benchmark-lite/runner.mjs check result /absolute/run/result.json
node scripts/benchmark-lite/runner.mjs check manifest /absolute/run/manifest.json
node scripts/benchmark-lite/runner.mjs check progress /absolute/run/progress.jsonl
node scripts/benchmark-lite/runner.mjs render /absolute/run/result.json --report-file /absolute/report.html
```

The `check` operation also reads judgement and saved run-payload files. It writes no artifact. Rendering uses the stored prompt, arm outputs, findings, and measurements. It never starts a replacement task. Report output must be a separate HTML file, not a symlink or hard link to evidence.

Each `run` requires a new output directory. Existing directories fail before either live arm starts. Preserve result, manifest, progress, and raw arm evidence. Regenerate only the HTML view.

For an isolated offline comparison, supply both completed arm artifacts and disable the judge:

```bash
node scripts/benchmark-lite/runner.mjs run --control-output-file /absolute/control.txt --test-output-file /absolute/test.txt --prompt-file /absolute/prompt.txt --output-dir /absolute/new-run --no-judge
```

This mode records missing measurements and unobserved isolation checks. It does not claim a valid live comparison. Existing external arm-result, trace, and answer formats remain externally owned; this skill does not add identifiers to them.

Only configuration has a declared safe upgrade. Use an explicitly selected mutable configuration outside run/evidence directories:

```bash
node scripts/benchmark-lite/runner.mjs upgrade /absolute/configuration.json
node scripts/benchmark-lite/runner.mjs bulk-upgrade /absolute/configuration-paths.json
```

The path-list file is a JSON array of distinct absolute paths. The shared writer validates, locks, and atomically replaces each selected configuration. Conversion changes only its root schema token. All other bytes remain unchanged, including unknown metadata and numeric lexemes. Current input remains byte-identical. Bulk failure can leave earlier valid configurations upgraded; inspect each reported result. Immutable and unsupported inputs remain unchanged. No result, manifest, judgement, run, or progress upgrade is declared.

## Contract changes — 2026-11-22

Added shared manifest declarations, explicit historical readers, and a configuration-only upgrade. Both runners and renderers now validate record identity and stored prompt hashes. Added matching Node/Bun commands and immutable run protection. Benchmark protocol `0.1.0`, paired-arm rules, judge meaning, and safety settings remain unchanged.

Run the boundary regressions from the skill directory:

```bash
mise exec -- node --test scripts/benchmark-lite/contracts.test.mjs
```
