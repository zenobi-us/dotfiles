---
description: Handle agent JSON envelopes, compact summaries, output files, and large TWG payloads.
---

# Agent Output

Agent invocations should call the installed `twg` binary directly:

```bash
twg <command>
```

When the host sets `TWG_AGENT_DEFAULTS=1` in the process environment, the CLI
treats non-help commands as agent-mode calls, defaults missing output to JSON,
and writes large payloads to files while keeping stdout compact. Do not prefix
individual commands with `TWG_AGENT_DEFAULTS=1` unless the host explicitly asks
for that shape; env-prefixed shell commands can bypass command-specific
authorization in some agent runtimes.

The CLI core applies the same file-backed protection for direct structured
agent calls such as `twg --mode agent --output json work query`. It only applies
when the caller has not explicitly chosen `--output-summary`, `--output-file`, or
`--output text`.

## Envelope Shape

Large direct agent invocations usually print a YAML summary like:

```yaml
output_files:
  stdout: "$TMPDIR/twg/.../stdout.json"
  stdout_lines: 1050
  stdout_bytes: 39779
  compact: "$TMPDIR/twg/.../stdout.compact.json"
  compact_bytes: 1402
command: "jira workitem query"
resource_type: "jira:workitem"
agent_output:
  summary: "stats"
  view: "compact"
  fields: [data.issues.key, data.issues.summary, data.issues.status]
stdout_stats:
  top_level_keys: [apiVersion, command, data, meta]
  array_fields: 1
  max_array_length: 50
---END---
```

Small payloads may include `stdout_inline` with the full JSON payload. Large
payloads include `stdout_stats` and sometimes `stdout_shape`.

## Reading Rule

The YAML summary is a pointer, not the answer.

- If `stdout_inline` is present, you may answer from it.
- If `output_files.compact` is present, inspect that compact JSON first. It is
  generated from the command's advertised output contract and is usually enough
  for routing, titles, owners, statuses, URLs, and dates.
- If `stdout_stats` or `stdout_shape` is present and `output_files.compact` is
  absent or insufficient, filter `output_files.stdout` with targeted `jq`.
- For answers that require item names, URLs, owners, statuses, blockers, dates, or
  evidence, read the JSON file even when the summary looks plausible.

**`stdout_shape` samples are statistical, not exhaustive.** The shape shows a
merged schema with a small number of example string values per field — it is not a
complete inventory. For `context` commands this matters most: external artifact links
(Figma, GitHub, Google Docs, and other third-party app URLs) appear toward the
**tail** of relationship arrays and are the entries most likely to be absent from
`stdout_shape` samples. If the goal is relationship or URL discovery, always read
`output_files.stdout` rather than treating shape samples as the full result. The
related workflow guidance lives in `twg-context-discovery/SKILL.md`.

## Output Budget Controls

Use these flags to keep agent stdout manageable:

```bash
twg <cmd> --output-summary stats
twg <cmd> --output-summary auto
twg <cmd> --agent-fields data.items.key,data.items.status
```

- `--output-summary stats` - smallest stdout; best for broad discovery.
- `--output-summary auto` - inline small results, summarize large results.
- `--output-summary inline` - force inline selected data; in agent mode very
  large inline payloads are capped and fall back to file-backed summary output.
- `--agent-fields` - narrow the summary while preserving the full JSON file.
  Presets such as `@rows`, `@compact`, and `@evidence` are command-scoped when
  advertised by help; on commands without a preset contract they safely fall
  back to the normal summary envelope. Literal field paths remain supported for
  custom projections.

Use `@rows` or `@compact` before writing custom JSON filters for broad scans.
Use `@evidence` after narrowing to the few artifacts that need fuller detail.

If `output_files.compact` is present, use it instead of probing the raw JSON.
If field paths are unknown, run `twg help describe "<exact command>"` and use
the advertised output view or jq snippet.

For structured JSON, inspect the top-level shape once and then write a targeted
projection. Do not retry multiple incompatible `.data.*`, `.result.*`, or
array-vs-object guesses. Combine related facts in one `jq` projection per output
file instead of running repeated `jq .` or one-field probes.

If a local `jq` command fails, stop probing nearby paths. Re-read the compact
file or the command's help-described view, then use at most one exact projection.
Missing collections usually mean "no rows returned", not a new output contract.

Before opening another large output file, run a sufficiency check: do you already
have the names/keys, owners, statuses, dates, risks/blockers, and evidence URLs
needed for the requested answer? If yes, synthesize. Only inspect another raw
file when it will change a ranking, owner, risk, blocker, relationship, or next
action.

When comparing many compact files, avoid a sequence of one-file filters such as
`jq '{Alice:.}' file`. Use one combined projection with `jq -n`/slurp inputs, or
read the compact summaries directly and only filter the few raw files that will
change the answer.

## When To Pass `--output-file`

Default: do not pass it. Agent defaults already write a full JSON payload and report
the path in `output_files.stdout`.

Pass `--output-file` only when stable filenames make a recipe easier, for example
a parallel context batch:

```bash
twg jira workitem get PROJ-123 --output-file "$TMPDIR/PROJ-123.json"
twg context jira workitem PROJ-123 --output-file "$TMPDIR/ctx_PROJ-123.json"
```

Use `$TMPDIR`, not hard-coded `/tmp`, because agent sandboxes vary.

## Large Payload Strategy

| Payload size         | What to do                                                        |
| -------------------- | ----------------------------------------------------------------- |
| Small / inline       | Read `stdout_inline` directly                                     |
| Compact file present | Read `output_files.compact` first                                 |
| Under about 50 KiB   | Open `output_files.stdout` directly                               |
| Large                | Use `jq` or another targeted filter against `output_files.stdout` |

Examples:

```bash
jq '.data.edges[].node | {key, title, status, url}' "$OUT"
jq '.data.items[] | {name, owner, updatedAt}' "$OUT"
```

Do not use `rg` to inspect TWG JSON. It treats structured data like text and
can re-expose hundreds of KiB of raw payload. Use `jq` with the paths from
`twg help describe "<exact command>"`.

Do not paste giant JSON into the final answer. Extract the facts and cite the
artifact URLs or keys that support them.
