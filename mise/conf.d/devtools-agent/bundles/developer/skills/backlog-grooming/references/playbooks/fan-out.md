# Playbook: fan out research

Start one research subagent for each ticket. Each subagent writes one report file. The parent waits, then checks the files.

## Resolve the spawn contract

1. Load the `muxer-subagents` skill. Use the muxer and agent from its session context when present.
2. Run its `scripts/router.ts contracts --muxer <muxer> --agent <agent>`. Read `muxerContract` and `agentContract`.
3. If `needsOperatorInput` is `true`, ask the user. Do not guess.
4. If the current depth is at or above `maxDepth`, stop. Report that grooming cannot fan out from this session.

## Write each prompt

For each ticket key, write `$RUN_DIR/prompts/<KEY>.md` with this content. Replace the values in angle brackets.

```markdown
Load the `backlog-grooming` skill and follow `references/playbooks/research.md`.

- Ticket: <KEY>
- Repository root: <absolute repository root>
- Report file: <RUN_DIR>/reports/<KEY>.md
- Report contract: <GROOMING_SKILL_ROOT>/references/report-contract.md
- Report checker: <GROOMING_SKILL_ROOT>/scripts/grooming-report.ts check <RUN_DIR>
- Evidence directory: <RUN_DIR>/evidence/<KEY>/
- Environment log: <RUN_DIR>/environments.txt

Do not change tracked files, tickets, or branches. Do not start subagents.
Write the report file, then stop.
```

Give the subagent only this prompt. Do not paste the ticket body; the subagent reads it with the ticket skill.

## Run the queue

1. Start at most `maxSubagentsPerSession` subagents at once, from the router `limits`.
2. Start each with `scripts/router.ts spawn --prompt-file "$RUN_DIR/prompts/<KEY>.md" --cwd <repository root>`. Record the `runId` against the key in `$RUN_DIR/runs.json`.
3. Wait with `scripts/router.ts wait <runId>`. When one finishes, close its session per `muxerContract`, then start the next key.
4. If the signal is `blocked`, read the pane. Answer only from facts you hold. If the subagent needs the user, ask the user, then resume it.
5. Do not treat pane idleness or pane text as completion.

## Check each report

After each subagent finishes, run:

```sh
"$GROOMING_SKILL_ROOT/scripts/grooming-report.ts" check "$RUN_DIR"
```

- If a report is missing or fails the check, resume that subagent once with the check output.
- If it fails again, write a stub report for that key with `verdict: action`, `action: research-failed`, and the check output in `comment`. Do not invent findings.

## Stop started environments

When every subagent has finished, read `$RUN_DIR/environments.txt`. Run each stop command once, even if two tickets list the same environment. Record any failure in your handoff.

## Next

When every key has a report that passes the check, go to [Collate and publish](collate.md).
