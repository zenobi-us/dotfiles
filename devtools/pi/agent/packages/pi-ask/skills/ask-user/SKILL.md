---
name: ask-user
description: "Use ask_user as a decision, research, and requirements gate before ambiguous or high-stakes choices."
metadata:
  short-description: Decision, research, and requirements gate
---

# Ask User decision/research gate

Use this skill to force explicit user alignment before consequential decisions, preference-sensitive planning, research scoping, or requirements gathering.

This skill is for decision control, research scoping, requirements gathering, and preference-sensitive planning, not general chat.

## Trigger

Classify the next step as one of:

- `high_stakes`
- `ambiguous`
- `both`
- `clear`

Use `ask_user` when the next step is ambiguous, preference-sensitive, or high-stakes and the user has not already made the decision explicitly.

Use `ask_user` for any domain where user input changes the plan, recommendation, research direction, output format, criteria, constraints, or next action.

Also use `ask_user` when the user asks to gather requirements, interview them, ask questions, scope research, plan work, compare options, or answer a set of open product/design/architecture/research questions. Do not respond with a plain-text questionnaire unless the user explicitly asks for a checklist or written questionnaire.

### Treat as `high_stakes` when the next step changes:

- architecture, schema, API contract, deployment, or security posture
- production-facing behavior in a costly-to-undo way
- large refactors, migrations, or destructive edits
- legal, financial, medical, career, hiring, vendor, purchasing, travel, or other costly-to-reverse decisions
- public-facing claims, sensitive communications, or consequential recommendations

### Treat as `ambiguous` when:

- requirements, goals, constraints, evaluation criteria, or success criteria are missing/conflicting
- multiple valid options exist and the trade-off is preference-sensitive
- research scope, audience, budget, timeline, risk tolerance, or output format is unclear
- you would otherwise make a material assumption

## Handshake (required)

1. Gather evidence first from code/docs/tools.
2. Summarize neutral context (current state, constraints, trade-offs, recommendation).
3. Ask one focused `ask_user` decision question, or bundle 2-5 closely related questions when the user is explicitly in requirement-gathering/interview mode.
4. Restate the user decision and proceed explicitly with it.
5. Re-open only for materially new ambiguity.

## Question spew prevention

Before sending any assistant response that contains 2+ substantive questions for the user, stop and decide whether those questions should be interactive.

Use `ask_user` instead of prose when:

- the questions are meant to collect requirements, goals, constraints, preferences, scope, priorities, criteria, or missing context
- answers will materially change the next artifact, recommendation, research direction, plan, implementation, architecture, schema, UX, stack choice, or decision criteria
- the user previously corrected you with phrases like "ask those questions", "ask interactively", or "use ask_user"

Plain-text questions are acceptable only when:

- the user asked for a written checklist/list of open questions
- the questions are rhetorical or purely explanatory
- there is exactly one small factual clarification and an interactive flow would be heavier than needed

If there are too many questions, group them into the smallest coherent `ask_user` batches and ask the highest-impact batch first.

## Question budget and escalation

- Max 1 `ask_user` call per decision boundary in normal cases.
- Max 2 calls for the same boundary if first answer is unclear/cancelled.
- Never re-ask the same trade-off without new evidence.

Attempt 2 (only if needed) must be narrower and include:

- `Proceed with recommended option`
- `Choose another option`
- `Stop for now`

After attempt 2:

- for `high_stakes` or `both`: stop as blocked until explicit decision
- for `ambiguous` only: if user delegates ("your call"), proceed with the most reversible default and state assumptions

## ask_user payload quality

- Ask one concrete decision at a time.
- Provide clear, distinct options. Do not add filler options.
- Choose question type from semantics: `single` means one answer is expected, `multi` means multiple answers could reasonably be selected, and `preview` means options need preview-pane detail with non-empty preview text.
- Avoid defaulting mechanically; infer from whether options are mutually exclusive, can coexist, or need preview-pane detail.
- Keep option labels short and outcome-oriented.
- Include trade-off descriptions when non-obvious.
- For research/planning, ask about goals, constraints, evaluation criteria, audience, budget, timeline, risk tolerance, and desired output only when they materially affect the result.
- Prefer non-`preview` questions when a free-form answer may be useful, since those include an internal `Type your own` option.

## Guardrails

- Do not ask before reading available context.
- Do not use for trivial formatting/style micro-decisions.
- Do not continue implementation after unclear high-stakes answers.

## Conflict rule

If this skill conflicts with implementation behavior or tests, the project contract wins:

1. `docs/contract.md`
2. `tests/*.test.ts`
3. this skill
