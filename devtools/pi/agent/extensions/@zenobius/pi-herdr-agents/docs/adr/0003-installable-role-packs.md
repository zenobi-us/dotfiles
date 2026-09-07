# ADR-0003: Discover installable role packs through Pi's event bus

- **Status:** Accepted
- **Date:** 2026-08-02
- **Decision owners:** `acrnm`
- **Scope:** `giuseppecrj/pi-herdr-agents`

## Decision

Treat Pi packages as the plugin system for third-party subagent roles.
A role pack ships Markdown role definitions plus a small Pi extension that
responds synchronously to:

```text
pi-herdr-subagents:roles:discover:v1
```

That event name is a stable protocol identifier and is not renamed with the package.

The discovery request exposes one operation:

```ts
register(path: string): void
```

`path` is an absolute Markdown file or a directory whose direct `.md` children
are role definitions. `pi-herdr-agents` reads and validates those files when
roles are listed or launched.

Role packs use the existing agent-definition format. The filename stem is the
canonical role name; `name` frontmatter is optional and, when present, must
match the stem. `description` is required for contributed roles.

## Why

Pi already owns package installation, updates, project trust, enablement, and
removal. Reusing `pi install` avoids a second package manager and keeps package
security expectations explicit.

Pi currently discovers only extensions, skills, prompts, and themes. It does
not expose custom package resources or installed package roots to extensions.
The inter-extension event bus is the smallest public seam that lets separately
installed packages contribute roles without scanning Pi's private npm or Git
directories.

Pull-based discovery is load-order independent: every extension factory has
registered its listeners before a user lists or launches a role. Synchronous
registration matches Pi's non-awaiting event bus and keeps role lookup local and
deterministic. Each contributor must retain the unsubscribe function returned by
`pi.events.on()` and invoke it from `session_shutdown`; Pi reuses its event bus
across reloads, so listener cleanup prevents removed or updated packs from
leaving stale roles.

## Catalog and precedence

Listing and exact-name launch use one resolved catalog. Collection order is:

1. bundled package roles;
2. registered role-pack definitions;
3. global definitions;
4. project definitions.

Effective precedence remains:

```text
project > global > package
```

Role-pack definitions remain in the `package` source layer and add package name,
version, and path provenance. Global and project definitions can intentionally
override them.

Within the package layer:

- bundled roles are protected fallbacks;
- a role pack colliding with a bundled name is rejected;
- a name contributed by multiple role packs is disabled;
- collisions never resolve through incidental extension load order.

Invalid registrations do not suppress unrelated roles. Listing surfaces report
concise diagnostics, and an exact-name launch reports the matching diagnostic
instead of treating an invalid contribution as a bare agent.

## Reload and security

Role files are read on each list or launch, so editing Markdown does not require
`/reload`. Installing, removing, updating, or changing a role-pack extension
uses Pi's normal reload flow. Contributor `session_shutdown` cleanup removes the
old event listener before replacement extensions register. Already-running
children retain their resolved role and lifecycle.

This is not a sandbox. Pi packages and extensions already execute with the
user's permissions. The host accepts only explicitly registered paths, performs
no network access or package installation, and does not evaluate role Markdown
as code.

## Rejected alternatives

### Scan Pi package directories

Rejected because npm/Git install paths are private Pi implementation details and
would bypass package filtering, trust, and provenance.

### Add a second plugin installer or settings inventory

Rejected because it duplicates Pi's package state and creates two update/removal
flows.

### Share an SDK module between packages

Rejected because Pi packages have separate module roots. A mandatory helper
would create fragile runtime coupling or bundle duplicate host code.

### General contribution manifests for workflows and adapters

Deferred. ADR-0002 keeps skills in Pi and prohibits a speculative workflow
engine. The v1 seam contributes roles only. Future concrete contribution types
should receive their own explicitly versioned contract when repeated need
exists.

### Pure Markdown packages

This is the preferred long-term authoring experience but requires a Pi-core
custom-resource or contribution hook. If Pi gains one, role packs can remove
the bridge extension without changing their Markdown definitions or user-facing
commands.

## Consequences

- Installing a role pack remains `pi install <source>`.
- Authors write one tiny event listener until Pi supports custom resources.
- The public event name is versioned; breaking changes require a new channel.
- Package identity is derived from the nearest `package.json`, avoiding repeated
  manifest metadata in the registration call.
- The existing global and project authoring paths remain compatible.
