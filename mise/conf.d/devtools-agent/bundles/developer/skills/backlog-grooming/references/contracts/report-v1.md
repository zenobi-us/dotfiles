# Historical grooming reports

Contract: `grooming-report/v1`. Owner: backlog-grooming.

The original wire format is YAML frontmatter with `ticket`, `title`, `verdict`, optional `url`, conditional `story_points`, `action`, `comment`, and `proposed_actions`. It has no identifier. Explicit `schemaVersion: grooming-report/v1` is also accepted. The five required sections and verdict rules are unchanged from [the report contract](../report-contract.md). `parseReport` validates content. A missing identifier matches this legacy format only after full validation. Unknown metadata and Markdown remain authored content. New authors use v2.
