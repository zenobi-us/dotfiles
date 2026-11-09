# Human session output

Read this reference when no required parent handoff applies and the user did not request machine JSON.

Give the reader the outcome first. Include canonical record references, validation, actual publication and required actions. Preserve failed checks, incomplete work and coverage limits. A local commit is not a push. Do not call a blocked or partially published operation done.

Use deliverResult with the human context, or use the CLI for an existing prepared result. Resolve RESULT_DELIVERY_SKILL_ROOT from the installed skill directory. This complete example runs from any working directory:

```sh
printf '%s\n' '{"schema":"tracker-result/v1","operation":"read","backend":"local-markdown","initiatives":[],"tickets":[{"id":"TASK-1","title":"Check the setup","ref":"tracker/tickets/TASK-1.md"}],"changes":null,"validation":{"status":"passed","details":[]},"publication":{"status":"not-required"},"rendered":null}' | "$RESULT_DELIVERY_SKILL_ROOT/scripts/router.ts" emit --format human
```

The output names the operation, record reference and check state. Do not print the transport envelope or the full result again below the summary. If the caller already requires an artifact handoff, human formatting must not remove it.

