# Author artifact contracts

Use this gate for every skill change. `skill-contracts` owns the manifest specification, resolver and shared upgrade implementation. Load that skill and its `references/manifest.md`; load `references/upgrades.md` when conversion applies. Invoke its installed absolute entrypoint, not repository-relative scripts. Domain owners retain content validation and conversion policy.

## Inventory before declarations

List every independently consumed structured input and output. Include Markdown frontmatter, JSON, command results, handoffs, configuration and structured assets when another consumer relies on their structure or meaning. Complete these columns before editing:

| Artifact or boundary | Input/output | Owner | Authoritative definition | Content validator | Compatibility/readers | Upgrade policy |
| --- | --- | --- | --- | --- | --- | --- |

Record exclusions with reasons. Ordinary prose references, human advice and opaque screenshots need no independent identifier merely because they are files. A screenshot sidecar interpreted by a program does need an inventory entry. External formats remain externally owned: reference their actual specification and validator; do not invent an internal family or inject prohibited fields. If a manifest cannot represent an external identity, document that boundary instead of advertising a made-up contract.

An unknown owner, definition, validator or destination is an unresolved decision. Keep it out of supported declarations until verified. A deliberately broken manifest is not a usable draft contract. Resolve missing authority or report the blocker without publishing invented support.

## Declare support precisely

Create `contracts.json` with `schemaVersion: skill-contract-manifest/v1` and required `produces`, `accepts`, `contracts`, `upgrades` collections. Use explicit empty arrays and an empty object when appropriate. The built-in manifest contract needs no competing definition.

Declare inputs and outputs independently. Accepting v1 neither makes v1 an output default nor proves conversion exists. A definition entry alone declares no support. Every declared endpoint needs its authoritative definition, except the built-in manifest. Reference the owner's definition instead of copying it into a second policy owner.

New or explicitly migrated domain records use `schemaVersion: record-family/v1` (positive integer versions). This identifies structural and semantic interpretation, not the skill release, content revision or success. Incompatible meaning or structure requires a new version; editorial changes do not. A `schema` to `schemaVersion` wire change needs a versioned cutover of producers, consumers, validators and examples, not permanent dual fields.

Resolve `file:` from the installed owner skill, independently of cwd. Historical `git:` definitions require the full immutable commit, repository-relative path and `sourceRepository`. Stop if unavailable; never substitute branches, tags, shorter pins or current definitions. Preserve immutable events and receipts through explicit historical readers.

## Bound conversion authority

Read-only access and installation never rewrite artifacts. Before an otherwise authorized mutation, use the owning command backed by shared safe upgrades. Provide a separate explicit bulk operation with selected paths when supported. Acceptance alone grants no upgrade or write authority.

Declare exact procedures and endpoints. Require source validation, one operation-appropriate destination and path, lossless preservation of meaning and all authored content, and destination validation before persistence. Unknown fields, text, metadata and meaningful ordering count as authored content. Relabelling alone is not conversion. Select destinations by operation policy, never the largest version number.

Missing identifiers require exactly one explicit legacy detector match. Zero or multiple matches block conversion. Unknown explicit versions never use legacy fallback. Ambiguous paths, data loss, user decisions, unsupported conversion or validation failures preserve original bytes and stop. Report explicit bulk partial results honestly; earlier successes do not make rejected items successful.

## Verify before deployment

Run the installed `skill-contracts/scripts/router.ts` public `validate --skill <absolute-skill>` and `resolve --skill <absolute-skill> --contract <identifier>` commands. Then exercise the actual owning read, mutation and bulk commands when applicable. Verify persisted fields, authored content, read-only byte equality and rejected source bytes. Helper tests or source-text matches alone cannot establish behavior. Run `contract-scenarios.md` in behavioral sessions and retain actual outcomes.

## Authoring skills' inventory

| Artifact or boundary | Input/output | Owner and definition | Validator | Compatibility and upgrades |
| --- | --- | --- | --- | --- |
| `contracts.json` authored and reviewed by writing-skills | Both | skill-contracts built-in `skill-contract-manifest/v1` | Shared public validate/resolve | v1 only; no upgrades |
| Skill metadata and Markdown guidance | Both | Host skill format; anatomy guidance | Host loader; author checklist | Preserve host keys; no internal identity |
| DOT blocks and generated DOT/SVG | Both | Graphviz DOT and SVG specifications | Vendored Viz.js renderer; SVG consumer | External formats; no injected identity or upgrades |
| Prose scenarios, checklists, glossary and advice | Both | Human/agent guidance, not machine records | Behavioral sessions | No independent record contract |
| writing-great-skills alias | No domain records or conversion | Canonical writing-skills/writing-for-agents routes | Route inspection | Explicit empty manifest; no policy copy |

These authoring skills own no persistent domain converter. Exercise existing owners with temporary artifacts; do not introduce another validator or upgrade engine.
