
The current design is partly separate, but its interfaces still assume one storage root.

The setup skill already states that the tracker is independent of alignment storage. It also states that external tickets remain in GitHub, GitLab, or another tracker. Only tracker
configuration belongs under ALIGNMENT_ROOT.

However, the implementation still uses one context.root for all file-backed records:

- tickets;
- initiatives;
- workflows;
- receipts;
- evidence;
- sources;
- ADRs.

resolveContextPath() joins every path to context.root in shared-context/scripts/shared-context/lib.ts:363-405. The worktree receipt format also requires ticket_path and tracker_path. Those
names assume that a ticket is a local file.

So the policy supports your GitHub example, but the path and receipt contracts do not model it cleanly.

Recommendation: route record kinds independently

Replace the binary storage: shared | repository decision with a small routing model.

Use two separate concepts:

- Adapter: the system that owns a record, such as GitHub or Markdown.
- Store: where file-backed records live, such as the repository or shared context.

Do not let shared-context implement GitHub operations. The ticket skill must continue to own those operations.

### Suggested record kinds

┌─────────────┬───────────────────────────────────────┬───────────────────────────────────────┬──────────────────────────────────┐
│ Record kind │ Adapter choices                       │ Store choices                         │ Recommended default              │
├─────────────┼───────────────────────────────────────┼───────────────────────────────────────┼──────────────────────────────────┤
│ Alignment   │ Markdown                              │ shared, repository                    │ Current storage                  │
├─────────────┼───────────────────────────────────────┼───────────────────────────────────────┼──────────────────────────────────┤
│ Tickets     │ GitHub, GitLab, Jira, local Markdown  │ Store applies only to local Markdown  │ Remote tracker from origin       │
├─────────────┼───────────────────────────────────────┼───────────────────────────────────────┼──────────────────────────────────┤
│ Initiatives │ Markdown initially; external later    │ shared, repository                    │ Shared when tickets are external │
├─────────────┼───────────────────────────────────────┼───────────────────────────────────────┼──────────────────────────────────┤
│ Workflows   │ Files                                 │ shared, repository                    │ Same as alignment                │
├─────────────┼───────────────────────────────────────┼───────────────────────────────────────┼──────────────────────────────────┤
│ Evidence    │ Files initially; object storage later │ Inherit workflow, shared, repository  │ Inherit workflow                 │
├─────────────┼───────────────────────────────────────┼───────────────────────────────────────┼──────────────────────────────────┤
│ Sources     │ Files                                 │ Inherit alignment, shared, repository │ Inherit alignment                │
└─────────────┴───────────────────────────────────────┴───────────────────────────────────────┴──────────────────────────────────┘

“Alignment” contains:

- AGENTS.md;
- docs/agents/;
- CONTEXT.md;
- CONTEXT-MAP.md;
- docs/adr/;
- domains/.

“Workflows” contains:

- receipts;
- reviews;
- snapshots;
- projections;
- the workflow manifest.

Keep these files together. They form one state machine.

Evidence can use a separate store because screenshots and videos can make a Git repository large. The default should still inherit the workflow store. This keeps normal setup simple.

Your example

The route plan would be:

```toml
schema = 2

[records.alignment]
adapter = "markdown"
store = "shared"

[records.tickets]
adapter = "github"

[records.initiatives]
adapter = "markdown"
store = "shared"

[records.workflows]
adapter = "files"
store = "shared"

[records.evidence]
adapter = "files"
store = "inherit:workflows"

[records.sources]
adapter = "files"
store = "inherit:alignment"
```

The result:

- GitHub Issues own tickets.
- Shared Markdown owns initiatives.
- Shared context owns worktree receipts and review artifacts.
- Shared context owns manual evidence by inheritance.
- A receipt links to a GitHub URL instead of a local ticket path.

This configuration should be a first-class preset:

│ Hosted tickets with shared engineering records

Setup flow

The setup should not ask six questions every time. Use defaults and ask only for real choices.

### 1. Select the ticket adapter

Detect the remote.

For a GitHub remote:

```text
Tickets: GitHub Issues
```

Other choices:

- GitLab Issues;
- Jira;
- local Markdown.

This decision is already independent in setup-matt-pocock-skills. Keep that behavior.

### 2. Select the default file store

Ask where durable engineering files live:

- Shared context;
- Repository.

This default applies to alignment, initiatives, workflows, and sources.

### 3. Select the initiative adapter

If the ticket adapter has a configured initiative system, offer it. For example, a future GitHub Projects adapter.

Otherwise recommend:

```text
Initiatives: Markdown in the default file store
```

This supports GitHub tickets with shared Markdown initiatives.

### 4. Select evidence storage only when needed

Default:

```text
Evidence: same store as workflows
```

Show other choices only when the user requests them or when an existing configuration uses them:

- repository;
- shared context;
- future external artifact store.

### 5. Show the complete route table

Before writing, show:

```text
Alignment:   shared
Tickets:     github
Initiatives: shared
Workflows:   shared
Evidence:    workflow → shared
Sources:     alignment → shared
```

This is clearer than a single storage: shared value.

Resolver interface

A single root must no longer be the interface for all records.

Add record-specific resolution:

```bash
shared-context resolve alignment
shared-context resolve initiative --id payments
shared-context resolve workflow --id GH-42
shared-context resolve evidence --workflow GH-42 --run manual-001
shared-context resolve source --ticket GH-42 --source confluence
```

For automation, return structured data:

```json
{
  "kind": "workflow",
  "adapter": "files",
  "store": "shared",
  "root": "/home/user/Notes/SharedAgentContext/example",
  "path": "/home/user/Notes/SharedAgentContext/example/workflows/GH-42",
  "publication": "push-if-remote"
}
```

This hides these details from callers:

- route inheritance;
- the shared base directory;
- the origin slug;
- publication requirements;
- path construction.

That makes the resolver a deeper module.

### Ticket resolution stays in the ticket skill

For external tickets, reading-and-writing-tickets returns:

```json
{
  "backend": "github",
  "id": "42",
  "ref": "https://github.com/owner/repository/issues/42"
}
```

For local Markdown, that skill can call the shared-context resolver and return a file reference.

shared-context path ticket should only be valid for a local Markdown ticket adapter. It should fail clearly for GitHub instead of returning an unused local path.

Worktree receipt changes

The current receipt contract leaks local tracker assumptions:

```yaml
context_root: ...
context_storage: repository
ticket_path: ...
```

Replace those fields with record-specific references:

```yaml
ticket:
  backend: github
  id: "42"
  ref: https://github.com/owner/repository/issues/42

workflow:
  store: shared
  root: /resolved/shared/root
  ref: shared://workflows/GH-42

evidence:
  store: shared
  ref: shared://workflows/GH-42/artifacts/evidence/manual-001
```

Also change:

```yaml
tracker_path: tracker/tickets/ABC-123.md
```

to:

```yaml
ticket_ref: https://github.com/owner/repository/issues/42
```

Use ref, not path, when a value can be a URL or file.

A receipt that records an external evidence artifact should also record its checksum. That keeps the receipt useful if the external object changes.

Configuration location

Replace the current one-word .storage marker with an origin-scoped route manifest, for example:

```text
<shared-candidate>/.context-routes.toml
```

Keep ~/.config/shared-agent-context/config.json limited to machine configuration:

```json
{
  "storage_path": "~/Notes/SharedAgentContext"
}
```

The route manifest contains project policy. The machine configuration contains the local base path.

This preserves the current origin-keyed behavior. It also avoids adding machine paths to the repository.

The route manifest acts as a small control record even when every file route points to the repository. That is acceptable. It prevents two competing configuration locations.

Reporting

Change report from one mode to a route table:

```text
mode: mixed
origin: github.com/owner/repository
slug: github-com-owner-repository--12345678

alignment: shared
tickets: github
initiatives: shared
workflows: shared
evidence: workflows -> shared
sources: alignment -> shared
```

mode can be:

- repository;
- shared;
- mixed.

Do not use mode for path decisions. It is only a summary. Callers must resolve the required record kind.

Migration

Use a clean schema migration.

Map existing configuration as follows:

- .storage = shared:
  - all file-backed record kinds become shared;
  - the configured external ticket adapter remains external.
- .storage = repository:
  - all file-backed record kinds become repository;
  - the configured external ticket adapter remains external.

Then permit explicit changes:

```bash
shared-context migrate workflows --to shared
shared-context migrate initiatives --to shared
shared-context migrate evidence --to repository
```

Each migration must:

1. Resolve the source and destination.
2. detect conflicting files;
3. copy only the selected record kind;
4. update the route only after the copy succeeds;
5. refuse silent fallback to the old location;
6. report publication requirements.

Do not search both locations after migration. That creates split-brain state.

Important constraints

### Keep workflows together

Do not independently route receipts, reviews, projections, and manifests. They represent one workflow state.

Use one workflows route.

### Make evidence an explicit exception

Evidence is the only useful sub-route because binary files have different storage costs. Default it to workflow inheritance.

### Use one owner for each record

Each record kind must resolve to exactly one adapter and one store. Never probe the repository and shared context and select whichever file exists.

### Store stable references

Cross-store links must not depend on relative filesystem paths.

Use:

- tracker URL for external tickets;
- typed shared reference for shared files;
- repository-relative path for repository files;
- canonical object URL plus checksum for external evidence.

### Resolve publication per output

The current publication rule depends on one global storage mode. Mixed routes require publication data from each resolver result.

A workflow write can require a shared-store push even when its ticket update uses GitHub.

What I would not do

I would not add one setting for every directory. That creates a shallow and difficult interface.

For example, do not separately configure:

- events;
- reviews;
- snapshots;
- projections;
- manifest.

I would also not make shared-context a generic GitHub client. The ticket skill already owns tracker behavior.

Recommended first change

Implement these separations first:

1. Keep ticket adapter selection independent.
2. Add routes for alignment, initiatives, workflows, evidence, and sources.
3. Change worktree fields from ticket_path to ticket_ref.
4. Replace global publication decisions with resolver output.
5. Add the Hosted tickets with shared engineering records setup preset.

This gives the requested behavior without turning setup into a file-placement questionnaire.
