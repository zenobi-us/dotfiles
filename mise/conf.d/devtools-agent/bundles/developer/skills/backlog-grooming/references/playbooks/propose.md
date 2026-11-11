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

### Estimate options

For an `estimate` action, make two options in place of one:

| Option label | Mode | Description |
|---|---|---|
| `Set N points` | `decided` | Write the value to the ticket. The team agrees on the size. |
| `Propose N points` | `proposed` | Post the value and its reason as a comment. Leave the field empty for the team to decide. |

- Before you ask, confirm with the ticket skill that the tracker has a story points field. If it has none, the `decided` mode adds the label `points:N` and its description says so.
- If the user selects both options for one ticket, ask once which one to apply.

If no user is present, do not apply anything. Write the actions as pending in your output and stop.

## 3. Apply

For each selected action, use the `reading-and-writing-tickets` skill:

| `kind` | Ticket skill operation |
|---|---|
| `comment` | `update` with a comment. Use the `detail` text. For a `clarify` ticket, post the numbered questions from the report. |
| `estimate`, `decided` | `update` the story points field. If the tracker has no such field, `update` the labels with `points:N`. |
| `estimate`, `proposed` | `update` with a comment. Use the text in [Proposal comment](#proposal-comment). |
| `update`, `label` | `update` the named field |
| `transition` | `update` the status. Confirm the target state exists first. |
| `link` | `update` with the link |
| `create` | `create` the ticket, then link it |

- Add the report link to each comment you post.
- Post one comment per ticket. If the user selects more than one comment action for a ticket, such as the `clarify` questions and a `proposed` estimate, join them into one comment with a `##` heading for each part.

### Proposal comment

```markdown
## Proposed story points: N

<reason from the `## Story points` section of the report>

Risks:
- <up to three items from `## Things to be aware of`>

Report: <report link>
```
- Apply actions one ticket at a time. Stop and report on the first failure. Do not retry silently.

## 4. Record

Write `$RUN_DIR/applied.json` with each applied action, its result, and each skipped action. For each `estimate` action, also write `mode` (`decided` or `proposed`) and `target` (`field`, `label`, or `comment`). Commit and push it as in [Collate and publish](collate.md). Then give the handoff from `SKILL.md`.
