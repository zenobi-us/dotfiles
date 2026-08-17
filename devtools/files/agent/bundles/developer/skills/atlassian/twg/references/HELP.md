---
description: Discover unloaded TWG reference guidance and inspect exact command contracts locally.
---

# Help Discovery

TWG separates skill discovery from command discovery. Skills explain product
semantics and workflow strategy. Command help explains exact commands,
arguments, flags, choices, defaults, and examples.

## Skill Discovery

Agents already receive installed top-level skill names and descriptions.
Use explicit discovery when the detailed reference inside a product or workflow
skill is unclear:

```bash
twg help discover-skills "snapshot token editing"
twg help discover-skills "JQL sprint prioritization" --skill twg-jira
```

Discovery searches reference titles and curated frontmatter descriptions, not
arbitrary body prose. Each result contains the owning skill and exact reference.
Skill names and descriptions are a fallback for top-level routes that do not
yet own references. The response contains one primary skill and at most two
close alternatives.

Follow `next.loadSkill` and `next.loadReference` when present. Loading a skill
returns its full `SKILL.md` and reference index without loading every reference
body:

```bash
twg help describe "skill:twg-confluence"
twg help describe "skill:twg-confluence/references/editing.md"
```

This is content retrieval, not automatic host-agent activation. After selecting
a skill, use ordinary command help for the rest of the workflow. Rediscover only
when the user's intent materially changes.

## Primary Flow

Use `twg help` directly for commands. Do not extract a help file path from
stdout. With no arguments it emits the compact YAML command map for routing.

```bash
twg help
twg help jira
twg help jira workitem
twg help jira workitem link goal
twg help confluence content get
twg help describe "jira"
twg help describe "jira workitem"
```

`twg help describe <namespace>` emits compact YAML. The `$` key lists executable
child commands directly under that namespace; other keys are child namespaces.
Use the returned `next.describe` commands to inspect exact executable contracts.
Do not infer flags or arguments from namespace YAML.

```yaml
kind: help_namespace
path: [jira]
depth: 2
next:
  describe:
    - 'twg help describe "jira workitem get"'
legend:
  $: executable child commands
tree:
  workitem:
    $: [create, get, query, update]
    link: {}
```

The default output for loose search is JSONL. The first record is `type: "meta"`
and matching command records are `type: "idx"`.

Use `describe` when you are about to inspect a namespace or execute an
unfamiliar command. Exact executable commands return JSON by default:

```bash
twg help describe "jira workitem query"
twg help describe "confluence content get"
twg help describe "user search"
```

The `output` object in `help describe` is the first place to look before
filtering JSON. If present, use its `recommendedSummary`,
`recommendedAgentFields`, and `agentFieldPresets` instead of probing raw payloads
with repeated `jq` calls:

```bash
twg help describe "context user"
twg context user <accountId> --output json --output-summary auto --agent-fields @compact
```

If a command does not advertise `agentFieldPresets`, `@compact`/`@evidence`
fall back to the normal summary envelope. Use advertised command-specific views
when they exist because they select the most useful stable identifiers.

Only use `jq` after reading that contract and only against the bounded stdout
file named by the summary envelope. Prefer the documented preset paths over
trial-and-error filters.

Use rendered text help only when the user specifically asks for human help:

```bash
twg -o text help describe "jira workitem query"
```

## Command Selection Rules

- Keep guidance and command discovery separate: `discover-skills` returns an
  owning skill and selected reference; `twg help <terms>` returns commands.
- If a command name is uncertain, run `twg help <terms>` first.
- If you need exact arguments, options, choices, defaults, or agent output
  guidance, run `twg help describe <path>`. If the path is a namespace, follow
  its `next.describe` suggestions to an exact command.
- Follow the `next` commands returned by help; do not invent unsupported help
  syntax.
- If the command grammar changed, trust live help over every skill reference.
- If help says a command requires a workspace, repo, page ID, account ID, ARI, or
  project key, resolve that value before executing the command.
- Keep experimental commands out of parallel batches until help confirms the
  shape.
- After search/Rovo returns candidates, hydrate selected candidates through the
  exact executable `get` contract for that surface. Use `query` for filters; do
  not pass candidate keys to namespace commands.
- Prefer typed `resolve`, `user`, `org-tree`, `teams`, `work query`, `work search`,
  `projects`, `goals`, `jira`, `confluence`, `docs`, `pull-requests`, and
  `context` surfaces for ordinary status, org, person, dependency, or context
  tasks. If typed surfaces are incomplete, state the coverage gap instead of
  probing implementation-only schema details.

## Common Discovery Patterns

| Need                                         | Discovery path                                                                                                                                                                                      |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Detailed product or workflow guidance        | `twg help discover-skills "<intent>"`, optionally scoped with `--skill`, then load the returned skill and reference                                                                                 |
| Person lookup                                | `twg help user search`, then use positional name, `--name`, or `--email`                                                                                                                            |
| Jira workitem detail or JQL                  | `twg help describe "jira workitem"`, then inspect the chosen exact command                                                                                                                          |
| Jira required/custom fields on create/update | `twg help jira custom fields`, then use `jira workitem field create-metadata` or `update-metadata`; prefer returned `customfield_*` IDs; do not duplicate keys across `--field` and `--fields-json` |
| Jira custom field value readback             | `twg jira workitem get <KEY> --field customfield_*`, or `--fields customfield_*,summary` for comma-separated REST fields                                                                            |
| Confluence page by title, ID, or URL         | `twg help confluence content` and `twg help describe "confluence content get"`                                                                                                                      |
| Bitbucket PR/repo                            | `twg help bb`, then `twg help describe "bb"`                                                                                                                                                        |
| Project/goal/focus area key or search result | `twg help projects`, `twg help goals`, `twg help focus-areas`, then describe the exact `get` or `query` command                                                                                     |
| Relationships or dependencies                | `twg help context`, then `twg help describe "context"`                                                                                                                                              |
| Assets / CMDB                                | `twg help assets`, then inspect object schema/type help before AQL                                                                                                                                  |

For org, team, leadership, and dependency synthesis, do not fall back to
implementation-only exploration just because the prompt says "graph",
"dependency", or "relationship." Use typed context and product-native hydration
first; if those surfaces are incomplete, state the coverage gap instead of
probing implementation-only labels or schema details.

## Compatibility Alias Guard

Compatibility aliases such as `user-search`, `page`, and `issue` may exist to
rescue stale prompts. Do not use them in examples or plans. Prefer the canonical
command path shown by live help.
