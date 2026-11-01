# Report structure

Use Outline's document title for the report title; do not duplicate it as a body H1.
Name the primary reader and the decision this report supports. Write observations in the past tense.

## Required order

| Section | Content |
|---|---|
| Context | Purpose, audience, owner, ticket, environment, tested version, observation time with timezone |
| Result summary | One row per check: stable ID, linked claim, result, short evidence reference |
| Evidence | One heading per check, containing its stable ID |
| Findings | Impact, owner or owner unknown, follow-up link when one exists |
| Not covered | Unrun checks, unavailable evidence, and resulting risks |
| Test data left behind | Shared state changed, cleanup owner and action; write None when appropriate |
| Companion artifacts | Uploaded plans, requests, responses, scripts, or other review material |
| Update history | Observation and publication dates, corrections, retests, and superseded evidence |

## Block selection

Apply the [native block selection matrix](native-blocks.md) to each section. It defines notice styles, optional diagnostics toggles, cleanup checklists, evidence media, diagrams, and plain alternatives.
The summary remains a table. Verdicts, blocking findings, Not covered, and required cleanup stay expanded.
Use deployment-specific blocks only after the documented compatibility checks; do not guess their Markdown encoding.

## Result vocabulary

| Result | Meaning |
|---|---|
| Pass | Executed check met the expected result and has evidence |
| Fail | Executed check contradicted the expected result; name ownership |
| Info | Neutral finding, untestable check, or check not reached |
| Warn | Unrelated bug discovered during this work |

Use result words even if Outline also displays emoji or colour.
The summary and check section MUST use the same current result.

## Evidence sections

For each check include the result, observation time, steps or input, expected result, observed result, evidence, and Why this proves it.
Give screenshots descriptive alternative text. Write a separate adjacent caption explaining the proof; do not repeat the alternative text.
Read actual image dimensions when recording them. Do not carry guessed HTML width or height attributes into Outline Markdown.
Redact secrets and unnecessary personal data before upload. State any redaction that limits the conclusion.
Keep logs concise in the body and attach complete redacted output when needed.
Never invent evidence or fill missing observations with plausible values.

## Navigation and size

Link each summary check to its evidence heading. Capture Outline's actual heading link after rendering; never assume GitHub-style slugs survive import.
Keep check IDs stable when headings change. Re-verify links after edits.
Use one report document by default. Split large evidence sets into child documents only when this improves navigation.
The parent retains the full summary, gaps, and links; each child retains its own context and a link back.
Create parents first and use returned document IDs for children. Inspect access and publication state for every child.

## Historical updates

Retests supplement earlier observations. Keep their environment, dates, verdicts, and evidence identifiable.
A current summary may show Pass after a retest, but its section must say which earlier Fail it supersedes.
Correct factual errors with a dated correction; do not quietly rewrite the past.
