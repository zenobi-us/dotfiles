# Playbook: collate and publish

Render the per-ticket reports into one HTML report, publish it to shared context, and show the summary.

## 1. Render

```sh
"$GROOMING_SKILL_ROOT/scripts/grooming-report.ts" render "$RUN_DIR" --title "<run title>"
```

The command checks every report first and stops on an error. It writes:

| File | Content |
|---|---|
| `$RUN_DIR/index.html` | The summary and every report, self-contained |
| `$RUN_DIR/summary.md` | The summary lines only |
| `$RUN_DIR/actions.json` | Every proposed action, grouped by ticket |

The summary has one line for each ticket:

| Verdict | Line |
|---|---|
| `groomed` | `[KEY]: groomed {story_points}` |
| `clarify` | `[KEY]: questions - {question_count}` |
| `cancel` | `[KEY]: cancel - {comment}` |
| `action` | `[KEY]: {action} - {comment}` |

## 2. Publish

1. Read the `shared-context` skill `references/publishing.md`.
2. Commit only the files under `$RUN_DIR` in the shared-context store. Use a commit title such as `grooming: <RUN_ID>`.
3. Push when the store has a usable remote. If it has none, report the local path and stop the publish step.
4. Build the link per the `shared-context` **Link rule**. For a private store with GitHub Pages, give the private Pages URL of `index.html` after the push. If the access boundary is unclear, ask the user.

## 3. Report

Print the contents of `summary.md` and the report link. Then go to [Propose actions](propose.md) if `actions.json` lists one or more actions.
