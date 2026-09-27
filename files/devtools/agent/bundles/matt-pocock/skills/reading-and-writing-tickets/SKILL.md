---
name: reading-and-writing-tickets
description: Read, create, update, claim, link, and complete tickets through the configured issue tracker. Use when another skill needs ticket data, ticket metadata, dependency edges, tracker state, local Markdown frontmatter, or tracker-specific issue operations.
user-invocable: true
---

## Language

All agent-authored prose MUST follow **ASD-STE100 Simplified Technical English**. Apply this rule to ticket text, comments, tracker updates, handoffs, and reports.

Use short sentences. Use active voice. Keep one term for one concept. Keep commands, identifiers, paths, and quoted errors unchanged.

# Reading and Writing Tickets

This skill owns ticket mechanics and ticket schema. Calling skills own workflow intent. A calling skill decides **why** it needs a ticket operation. This skill decides **how** to read or write the ticket through the configured tracker.

## Router rule

Before reading or writing a ticket:

1. Run the shared-context CLI `report` procedure from `agent-core:shared-context` in the repository root.
2. Use the reported `root` as `ALIGNMENT_ROOT`. Use the reported `repository-root` for the repository. Do not inspect prompt or environment data, or derive either path by hand.
3. Read `<reported-root>/docs/agents/issue-tracker.md`.
4. Read its YAML frontmatter.
5. Select the backend-specific operation below.
6. Preserve the configured tracker format. Do not infer a backend from file paths or prose.

For a write under a shared `ALIGNMENT_ROOT`, read the shared-context publishing procedure after the write. Run `cli.ts index <dir>` after adding or removing a file in a shared-context source directory.

If the tracker definition is missing, malformed, or lacks the required operation, stop and ask the user to run `/setup-matt-pocock-skills` or to define the missing operation.

## Source of truth

The configured issue tracker is the source of truth.

- External trackers own ticket metadata and dependency relationships.
- Local Markdown owns ticket metadata in YAML frontmatter.
- Ticket bodies own human-readable intent, requirements, rationale, and answers.
- Comments own conversation history.
- Reverse dependency edges are derived. Store direct blockers only.

Calling skills MUST NOT parse or modify ticket fields directly when this skill can perform the operation.

## Local Markdown schema

For `backend: local-markdown`, resolve files below:

```text
`<issue-root>` resolved under the CLI-reported `ALIGNMENT_ROOT`
```

Read the tracker document's `review-root` when a review artifact is involved.

Ticket files MUST use frontmatter for machine-readable metadata:

```yaml
---
id: payments-02
title: Add refund API
type: task
triage: ready-for-agent
work_status: unclaimed
blocked_by: []
parent: payments
---
```

Use these fields:

- `id`: unique stable ticket identifier;
- `title`: ticket title;
- `type`: `research`, `prototype`, `grilling`, or `task` when the workflow uses ticket types;
- `triage`: the configured triage role;
- `work_status`: `unclaimed`, `claimed`, `implemented`, `merged`, or `completed`;
- `blocked_by`: a list of direct ticket IDs or tracker-defined references;
- `parent`: the effort, map, or parent ticket when the tracker defines one.

The tracker MAY define additional fields. Do not remove unknown fields.

`work_status: completed` is valid only after the configured workflow verifies validation, merge, and push.

A local ticket body SHOULD use these headings when applicable:

```markdown
## What to build
## Question
## Acceptance criteria
## Comments
```

Do not use body lines such as `Status:` or `Blocked by:` as the canonical source when frontmatter is configured. A rendered body line MAY be generated from frontmatter for human readability.

## Dependency graph rules

Store only direct blockers in `blocked_by`.

```yaml
blocked_by:
  - payments-01
```

Do not store a second authoritative `blocks` list. Derive reverse edges when querying.

Before writing a dependency edge, MUST verify:

- every referenced ticket resolves uniquely;
- the ticket does not block itself;
- the new edge does not create a cycle;
- the edge represents a real start-time dependency;
- a completed blocker is not required to remain open.

A ticket is on the local frontier when it is unclaimed, in scope, and every ticket in `blocked_by` is completed according to the tracker rules.

## Operations

Use the operation that the calling skill requests.

### Read

Resolve the ticket selector using the tracker document. Accept only selector forms that the tracker defines. Reject ambiguous selectors. Read the complete ticket, including frontmatter, body, and comments.

Return both:

- the user-facing ticket identifier;
- the canonical tracker path or URL.

### List

Use the configured tracker query. For local Markdown, query frontmatter rather than body text. Return the canonical identifier, title, state, blockers, and tracker path.

### Create

Create the ticket in the tracker-defined format. For local Markdown:

1. choose a unique stable `id`;
2. write frontmatter;
3. write the human-readable body;
4. resolve every `blocked_by` reference;
5. validate the graph;
6. follow the local Git preflight and commit rules.

For an external tracker, create the ticket first. Add dependency links after all referenced tickets have IDs.

### Update

Change only the requested fields. Preserve unknown frontmatter fields, body sections, comments, and tracker formatting. Validate dependency edges after an update.

### Claim

Use the tracker-defined claim operation. For local Markdown, set:

```yaml
work_status: claimed
```

Save before source work starts. Do not change `triage` unless the calling workflow explicitly requests that operation.

### Review

Use the tracker-defined review artifact location. For local Markdown, use:

```text
<review-root>/<ticket-file-name-without-extension>.md
```

The review artifact MUST include the ticket identifier, tracker path, scope, branches, commit, validation, findings, verdict, and timestamp. Follow the local Git commit and shared-context publication rules.

### Complete

Apply the tracker-defined completion operation only after validation, review, merge, and push succeed. For local Markdown, set:

```yaml
work_status: completed
```

Append the completion note under `## Comments` when the tracker document requires it. Follow the tracker Git commit rules.

## Local Git preflight

When the tracker backend is local Markdown:

1. Identify the Git repository that contains `<issue-root>`.
2. Read its status before the first tracker write.
3. If it is a Git repository, commit all changed Markdown files in the local issue store before starting issue work.
4. Use the `writing-and-creating-git-commits` skill for every tracker or review commit.
5. Put the stable ticket reference in every commit title that changes the ticket or its review artifact.
6. Keep tracker commits separate from source-code commits.

## External tracker rules

For GitHub, GitLab, Linear, Jira, or another configured backend:

- use the native ticket fields and relationship APIs when the tracker supports them;
- use the tracker document's fallback body convention only when native relationships are unavailable;
- never write local Markdown frontmatter into an external issue;
- use the tracker-defined claim, comment, review, and completion operations;
- return the external issue URL with the result.

## Result contract

After every write, read the shared-context publishing procedure when the write used a shared `ALIGNMENT_ROOT`, then report:

- operation;
- ticket identifier;
- tracker path or URL;
- fields changed;
- dependency edges changed;
- validation result;
- commit or publication result when applicable.

After every failed write, leave the ticket unchanged when possible. Report the exact blocker and the next required action.
