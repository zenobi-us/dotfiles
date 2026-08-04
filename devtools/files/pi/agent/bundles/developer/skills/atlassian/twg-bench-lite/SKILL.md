---
name: twg-bench-lite
description: >
  Run a lightweight single-prompt A/B comparison of free Atlassian/local MCP
  context vs TWG CLI graph context using paired read-only agent sessions.
---

# twg-bench-lite

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
