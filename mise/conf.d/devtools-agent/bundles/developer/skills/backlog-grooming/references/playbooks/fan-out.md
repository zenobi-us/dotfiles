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
Other research subagents run at the same time and may start the same environments.

When the report passes the checker, write this result to a file in the evidence directory:

{ "ticket": "<KEY>", "report": "<RUN_DIR>/reports/<KEY>.md", "verdict": "<verdict from the report>" }

Deliver it with <RESULT_DELIVERY_SKILL_ROOT>/scripts/router.ts emit --input <that file>, then stop.
```

Give the subagent only this prompt. Do not paste the ticket body; the subagent reads it with the ticket skill.

## Run the queue

1. Start at most `maxSubagentsPerSession` subagents at once, from the router `limits`.
2. Start each with `scripts/router.ts spawn --result-schema backlog-grooming/report-ref@1 --prompt-file "$RUN_DIR/prompts/<KEY>.md" --cwd <repository root>`. Append its output, with the key, to `$RUN_DIR/runs.jsonl`. Keep `runId`, `contextFile` and `resultTarget`: muxer cleanup removes the run record.
3. Wait with `scripts/router.ts wait <runId>`, one background wait for each run. When one finishes, close its session per `muxerContract`, then start the next key.
4. If the signal is `blocked`, read the pane. Answer only from facts you hold. If the subagent needs the user, ask the user, then resume it.
5. Do not treat pane idleness or pane text as completion. A wait can also return while the child still runs a background command. Check for the delivered result before you close the session.

## Check each result

After each subagent finishes, verify its delivered result with the `result-delivery` skill:

```sh
"$RESULT_DELIVERY_SKILL_ROOT/scripts/router.ts" read --context <contextFile>
```

- The result names the ticket, the report path, and the verdict. Confirm the report file exists and its `verdict` matches.
- After the check passes, acknowledge the result hash with the `ack` command.

When every subagent has finished, check all the reports together. The checker reports a missing file for each ticket that has not finished, so run it only at the end:

```sh
"$GROOMING_SKILL_ROOT/scripts/grooming-report.ts" check "$RUN_DIR"
```

- If a result or a report is missing, or the report fails the check, start a new subagent for that ticket once, with the check output in its prompt. Do not reuse the earlier session.
- If it fails again, write a stub report for that key with `verdict: action`, `action: research-failed`, and the check output in `comment`. Do not invent findings.

## Stop started environments

When every subagent has finished, read `$RUN_DIR/environments.txt`. Run each stop command once, even if two tickets list the same environment. Record any failure in your handoff.

## Next

When every key has a report that passes the check, go to [Collate and publish](collate.md).
