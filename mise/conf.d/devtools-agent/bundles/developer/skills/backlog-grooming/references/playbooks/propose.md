# Playbook: propose actions

Ask the user which proposed actions to apply, then apply only those. Do this after the report is published.

## 1. Read the actions

Read `$RUN_DIR/actions.json`. It is a list of tickets, each with its verdict and its `proposed_actions`. Skip tickets with no actions.

## 2. Ask

In Claude Code, use the question tool. In other harnesses, print numbered checklists and wait for the reply.

- Make one question for each ticket. Set `multiSelect: true`.
- Use the ticket key as the header. A header holds at most 12 characters.
- Put the verdict and title in the question, for example "ABC-123 (groomed): Order summary shows wrong total. Which actions should be applied?"
- Make one option for each action. Use the action `summary` as the label and `detail` as the description.
- The tool takes at most 4 questions per call and 4 options per question. Send more calls when needed. If a ticket has more than 4 actions, split it into two questions with the same header and a `(1/2)` suffix.
- Do not pre-select or recommend an action unless the report gives evidence for it. Then add "(Recommended)" to that label.

If no user is present, do not apply anything. Write the actions as pending in your output and stop.

## 3. Apply

For each selected action, use the `reading-and-writing-tickets` skill:

| `kind` | Ticket skill operation |
|---|---|
| `comment` | `update` with a comment. Use the `detail` text. For a `clarify` ticket, post the numbered questions from the report. |
| `estimate` | `update` the story points field |
| `update`, `label` | `update` the named field |
| `transition` | `update` the status. Confirm the target state exists first. |
| `link` | `update` with the link |
| `create` | `create` the ticket, then link it |

- Add the report link to each comment you post.
- Apply actions one ticket at a time. Stop and report on the first failure. Do not retry silently.

## 4. Record

Write `$RUN_DIR/applied.json` with each applied action, its result, and each skipped action. Commit and push it as in [Collate and publish](collate.md). Then give the handoff from `SKILL.md`.
