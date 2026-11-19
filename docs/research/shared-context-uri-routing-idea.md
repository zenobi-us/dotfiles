---
description: Open idea for template-based references, scheme-selected adapters, and Markdown exchange
status: open
title: Shared-context routing through URI handlers
type: Idea
---

# Shared-context routing through URI handlers

## Status

Open idea. This record captures intent, not an approved architecture decision or implementation plan.

## Original user intent

> assume the config file is a map of templates strings

> another idea is that we use mime-type protocol handler spec?

Use URI schemes to select adapters. Give agents Markdown as the read and write representation, while adapters handle native storage formats.

## Context

The current configuration separates store selection in `.context-routes.toml` from limited directory overrides in `docs/agents/context-layout.toml`. Workflow and evidence directory layouts remain fixed in the resolver. This makes an entry such as `records.evidence` appear to configure a path when it selects only a store.

The earlier proposal used `{ adapter, ref }` entries. The newer proposal uses a map of reference templates and selects each adapter from the rendered URI scheme. These are alternatives, not two configuration layers to implement together.

URI schemes select access handlers. MIME types describe content formats. A MIME registration or operating-system protocol registration mechanism has not been selected.

## Concepts
- [ ] Introduce the routing paradigm through a new schema version and automatically upgrade older records on access.
- [ ] Constrain supported schemes and native formats by record kind; some kinds support only repository and shared storage.
- [ ] Use kind-specific format contracts instead of requiring Markdown conversion for every resource.

- [ ] Build a documented variable context before rendering references.
- [ ] Make `.context-routes.toml` a map of template strings keyed by record kind.
- [ ] Resolve `X` by looking up `records.X`, rendering its reference, and passing it to the scheme-selected adapter.
- [ ] Make locations configurable for initiatives, tickets, workflows, evidence, and sources rather than fixing record directories in code.
- [ ] Replace the aggregate `alignment` record with independently resolved `agentsmd`, `adrs`, `triage-labels`, `context-map`, and `domain` records.
- [ ] Convert triage-label configuration from Markdown to TOML as part of that proposed change.
- [ ] Support repository, shared-storage, and external tracker destinations through the same resolution interface.
- [ ] Define read/write contracts that use Markdown for document kinds and applicable tracker adapters, with kind-specific formats for other kinds.
- [ ] Treat shared document records as Markdown, triage-label configuration as TOML, and binary artifacts separately; let applicable Jira and GitHub adapters handle their native representations.

## Proposed configuration

These examples illustrate the idea. They do not define supported syntax or current behavior. The template delimiter and `receipts` spelling are corrected from the conversation example.

```toml
[records]
initiatives = "shared://{{ shared.repo | slugify }}/docs/initiatives"
tickets = "shared://{{ shared.repo | slugify }}/docs/tickets"
agentsmd = "shared://{{ shared.repo | slugify }}/AGENTS.md"
adrs = "shared://{{ shared.repo | slugify }}/docs/adr"
triage-labels = "shared://{{ shared.repo | slugify }}/docs/agents/triage-labels.toml"
context-map = "shared://{{ shared.repo | slugify }}/CONTEXT-MAP.md"
domain = "shared://{{ shared.repo | slugify }}/docs/agents/domain.md"
workflows = "shared://{{ shared.repo | slugify }}/docs/receipts"
sources = "shared://{{ shared.repo | slugify }}/docs/library"
```

Alternative ticket destinations could use `repo://`, `jira://`, or `github://`. Their precise reference grammar is unresolved. The earlier explicit-adapter example used `adapter = "twg-jira"` with `ref = "parent=RWR-12345"`; scheme dispatch would need to retain that selector meaning.

The earlier proposal also allowed an absolute filesystem reference:

```text
/mnt/c/Users/Me/Notes/{{ repo | slugify }}/tickets
```

Whether a scheme-less absolute path remains supported is an open question.

## Granular records replacing alignment

The user expanded the idea to replace `alignment` with five independently configurable record paths. These are concept scope, not assistant exploration suggestions.

| Record | Proposed purpose | Target shape |
| --- | --- | --- |
| `agentsmd` | Project instructions currently held in `AGENTS.md` | Markdown file |
| `adrs` | Architecture decision records | Directory of Markdown records |
| `triage-labels` | Triage-label configuration, converted from Markdown to TOML | TOML file |
| `context-map` | Stable context entry points currently held in `CONTEXT-MAP.md` | Markdown file |
| `domain` | Domain configuration and its relationship to domain context | Exact scope requires clarification |

Consumers would resolve the relevant record directly instead of appending a fixed path to an alignment root. The example `domain` path points to today's domain configuration; it does not settle whether this record should instead identify `CONTEXT.md`, a directory, or a structured set of domain documents.

The existing alignment route also supplies tracker and layout configuration locations. Their replacement locations remain unresolved; do not silently retain an aggregate alignment root to supply them.

## Original agent-facing format proposal

This universal proposal is retained for context. The kind-specific contract below supersedes it.

Writing: agent-authored Markdown → adapter write → native representation.

Reading: native representation → adapter read → Markdown for the agent.

Markdown is the proposed exchange format, not a claim that every native resource is a Markdown file. The proposed `triage-labels` record is TOML in storage. The later kind-specific contract selects its TOML format without requiring Markdown conversion; `shared://` alone does not imply a Markdown file. GitHub issue bodies can use Markdown, but issue identity, status, labels, and other fields still need representation. Jira needs a mapping between Markdown and its structured fields and document format.

## Versioned routing and upgrades on access

The user proposed introducing this routing paradigm through a new schema version and automatically upgrading older records on access. The exact schema number is not yet selected.

Record kinds constrain supported schemes and native formats. A storage scheme does not imply that every record is Markdown or that every record can use Jira or GitHub. In particular, `triage-labels` supports repository and shared storage and uses native TOML. Its kind selects the format; its scheme selects storage.

The earlier universal Markdown exchange contract is superseded by kind-specific format contracts. Markdown remains the agent-facing format for document kinds and applicable tracker adapters; TOML configuration and binary artifacts do not require artificial Markdown conversion.

The following upgrade mechanics were proposed by the assistant and remain unconfirmed:

1. Read the route manifest's schema version.
2. Upgrade a supported older manifest in memory on access.
3. Resolve through the new model only.
4. Persist the upgraded manifest on the next write, rather than modifying files during a read.
5. Reject unsupported newer schema versions explicitly.
6. Preserve existing resolved locations during upgrades; do not move data into example paths.

Routing-schema upgrades and record-content upgrades are distinct. Converting `triage-labels.md` to TOML changes content and location, so it needs a detectable content version or equivalent completion marker. The routing schema alone does not establish that conversion has completed. The exact content-upgrade trigger and persistence behavior remain open.

## Clarifications before conversion

- What variables exist, and does `shared://` identify the global shared base or the already origin-keyed project directory? Avoid adding the repository slug twice.
- Which template language and filters are supported? What happens when a variable is missing?
- Does each record reference identify a collection, an individual record, or a template parameterized by record identity?
- What reference grammar selects Jira and GitHub projects, parents, collections, and individual records?
- How does scheme dispatch select a concrete integration such as `twg-jira`?
- How are evidence images, logs, and other binary artifacts handled alongside Markdown records?
- Which fields must survive Markdown read/write round trips, and how are unsupported fields or lossy conversions reported?
- How are create and update operations distinguished?
- How are the route manifest and initial template variables located without an alignment root?
- What exactly does `domain` identify: domain configuration, `CONTEXT.md`, a directory, or multiple domain documents?
- Where does tracker configuration live after alignment is removed, and does the template map fully replace the separate layout configuration?
- What is the triage-label TOML schema, how is the existing Markdown content migrated, and must writes preserve TOML comments?
- Which scheme/format combinations does each record kind support?
- Does automatic upgrade apply to route manifests, record content, or both, and when are upgrades persisted?
- How is content conversion completion detected, and what happens when an automatic upgrade is ambiguous?
- How do configuration changes and explicit data migration remain separate?

## Exploration suggestions

These suggestions came from the assistant. They are not approved concept scope.

- Use explicit variables such as `repo.slug`, `repo.root`, and `repo.origin` instead of an ambiguous `repo` value.
- Consider structured Markdown frontmatter for tracker identity, parent, status, and labels where the record contract uses Markdown.
- Consider references to other rendered record locations for evidence/workflow relationships, with cycle detection.
- Keep binary artifact access separate from Markdown record conversion.
- Validate references in the selected handler; do not silently discard unsupported write fields.

## Coverage

No initiative or ticket coverage has been created. No configuration or resolver behavior has changed.



