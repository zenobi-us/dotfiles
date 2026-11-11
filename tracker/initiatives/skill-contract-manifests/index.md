---
id: skill-contract-manifests
schema: tracker-initiative/v1
title: Skill contract manifests and safe automatic upgrades
type: Initiative
---

## Problem Statement

Skills produce and consume persistent Markdown and JSON artifacts, but contract declarations and upgrade rules differ between skills. Authors cannot reliably identify supported formats, resolve historical definitions, or determine whether conversion is safe. Existing contracts often use `schema`, while the agreed field is `schemaVersion`. A skill update must not silently redefine stored artifacts.

## Solution

Give every maintained skill a JSON contract manifest. Separate contracts the skill produces from contracts it accepts. Resolve each contract to an authoritative definition. Declare supported upgrade paths and perform safe upgrades before mutation. Keep read-only access free of writes and preserve immutable history. Standardise new and explicitly migrated domain artifacts on `schemaVersion`.

## User Stories

1. As a skill author, I want one manifest per skill, so that consumers can discover its contracts.
2. As a skill author, I want separate production and acceptance declarations, so that old inputs do not become output defaults.
3. As a skill author, I want an empty manifest when no contracts apply, so that coverage remains explicit.
4. As a consumer, I want a manifest schema identifier, so that I can interpret its structure.
5. As a consumer, I want authoritative contract definitions, so that labels have verifiable meaning.
6. As a consumer, I want record-family identifiers, so that shared contracts do not depend on their producing skill.
7. As a maintainer, I want one owner per contract, so that different skills do not redefine it.
8. As a consumer, I want local references resolved from the skill installation, so that caller directories do not change their meaning.
9. As a consumer, I want historical references pinned to full commit IDs, so that their meaning remains stable.
10. As a consumer, I want an explicit source repository, so that Git references do not resolve against an unrelated checkout.
11. As a consumer, I want missing historical objects fetched when possible, so that installed skills can resolve accepted contracts.
12. As a user, I want resolution failures reported without revision substitution, so that missing evidence cannot change interpretation.
13. As a skill author, I want explicit upgrade entries, so that acceptance does not imply migration support.
14. As a maintainer, I want upgrade procedures to define conversion and validation, so that upgrades preserve meaning.
15. As a user, I want supported lossless upgrades to run automatically before mutation, so that routine updates do not need separate migration approval.
16. As a user, I want read-only operations to leave artifacts unchanged, so that inspection has no write side effects.
17. As a user, I want an explicit bulk upgrade operation, so that I can convert selected artifacts deliberately.
18. As a user, I want unsafe or decision-dependent upgrades to stop, so that automation cannot discard authored content.
19. As a user, I want immutable historical records preserved, so that receipt chains remain valid.
20. As a consumer, I want explicit legacy detection, so that supported unversioned artifacts can be upgraded safely.
21. As a user, I want zero or multiple legacy matches to stop conversion, so that uncertain identity cannot cause a rewrite.
22. As a consumer, I want one unambiguous upgrade destination, so that numeric version order does not choose behaviour.
23. As a consumer, I want unknown explicit versions rejected for interpretation-dependent operations, so that future formats are not misread.
24. As a maintainer, I want a coordinated field-name cutover, so that producers and consumers agree.
25. As a maintainer, I want explicit readers for historical contracts, so that old records remain usable without rewriting history.
26. As a skill author, I want shared authoring rules and completion checks, so that new skills follow the same contract policy.
27. As a maintainer, I want prose and opaque assets exempt from unnecessary versions, so that metadata serves a real consumer need.
28. As a maintainer, I want real skill operations exercised, so that helper tests do not hide integration failures.

## Implementation Decisions

### Contract identity and ownership

- Use `schemaVersion` with the identifier form `{record-family}/v{positive-integer}` for new and explicitly migrated domain artifacts.
- An identifier defines structural and semantic interpretation rules. It is not a skill release version, content revision, checksum, storage route, or success signal.
- Each contract has one authoritative owner, definition, validation rules, compatibility rules, and upgrade policy. Shared consumers reference that definition rather than creating competing copies.
- Increase the contract version for incompatible structural or semantic changes. Editorial changes do not require a contract bump. Never infer compatibility from numeric ordering alone.

### Per-skill manifest

- Each maintained skill has a JSON manifest with `schemaVersion: skill-contract-manifest/v1`. Its required collections are `produces`, `accepts`, `contracts`, and `upgrades`. Empty collections are valid when the skill has no applicable contracts.
- `produces` lists output contracts. `accepts` lists supported input contracts. Supporting an old input does not make it a preferred output or prove an upgrade exists.
- `contracts` maps contract identifiers to authoritative definition references. Every produced or accepted identifier and every upgrade endpoint must resolve to a definition.
- `upgrades` declares source identifier, destination identifier, and procedure reference. Procedures define conversion, safety checks, and destination validation; they may invoke executable helpers.
- Manifest readers recognise the manifest contract directly. They must not resolve that same contract recursively through the manifest being read.
- Keep one shared manifest specification and validation implementation. Domain owners retain their own content validators and upgrade procedures.

### Definition resolution

- Resolve `file:` references relative to the installed skill directory, independently of the caller working directory.
- Resolve `git:` references using a full immutable commit ID and a repository-root-relative path. Branches, tags, and abbreviated commit IDs are not historical pins.
- Require `sourceRepository` when a manifest contains Git references. Use that repository rather than the caller's checkout.
- Assume Git is available. Fetch unavailable objects from the declared source when possible. Resolution must not change the caller's or skill's checkout.
- If a definition cannot be resolved, stop the affected operation. Never substitute another revision or treat unavailable content as validated.

### Validation and upgrade behaviour

- Validate manifest structure, identifiers, reference resolution, and declared upgrade paths before relying on them. Validate artifact content against its declared source contract.
- Run automatic upgrades before an otherwise authorised mutation. Read-only access does not rewrite the artifact. Provide a separate explicit operation for bulk upgrades.
- Automatic conversion requires a declared, supported path that preserves meaning and authored content. Source and destination validation must pass. A new label alone is not conversion.
- Stop and ask when conversion loses data, needs a user decision, lacks a supported path, fails validation, or has an ambiguous destination. Do not leave a partially converted artifact represented as successful.
- Follow declared paths only. Select one unambiguous destination for the operation; do not choose the largest version number.
- An absent identifier means unversioned, not current. Permit an explicit legacy detector only when it identifies exactly one supported source contract. Zero or multiple matches stop automatic conversion.
- An unknown explicit identifier is not a legacy candidate. Preserve the artifact and reject operations that require unsupported interpretation.
- Keep immutable historical artifacts unchanged. Use explicit historical readers; do not rewrite receipt or event chains to adopt current field names.

### Authoring guidance and adoption

- Update the canonical skill-authoring guidance, anatomy rules, checklists, and behavioural scenarios together. Keep the compatibility alias as an alias rather than another policy owner.
- Require authors to identify independently consumed structured inputs and outputs, their owners, validators, compatibility rules, and upgrade policies.
- Do not require independent identifiers on ordinary prose references or opaque assets merely because they are files. Structured references and assets need contracts when consumers depend on their structure or meaning.
- Preserve externally owned formats. Do not inject fields into formats whose owners do not permit them.
- Adopt manifests across maintained skill bundles. Include tracker, result-delivery, muxer, worktree, evidence, and other persistent artifact owners; do not stop after a pilot. Separate implementation tickets by real contract ownership and dependencies.
- Migrate `schema` to `schemaVersion` by contract family. This changes the wire format and requires a new affected contract version. Update producers, validators, consumers, examples, and guidance together. Do not write both fields as a permanent compatibility mechanism.
- Preserve historical formats through explicit old-contract readers and declared upgrades. Do not silently stamp stored artifacts during installation or skill updates.

## Testing Decisions

The user confirmed two acceptance boundaries: shared contract operations and actual owning-skill operations. Test observable results, persisted content, and rejected operations rather than helper wiring or copied source text.

- Exercise manifest validation and reference resolution through public contract operations. Cover required declarations, independent input/output support, unresolved definitions, wrong repositories, full commit pins, and unchanged checkouts.
- Exercise supported old-to-new conversion, unchanged meaning and authored content, destination validation, and unambiguous destinations. Assert that rejected conversions preserve the source.
- Cover no path, unknown explicit versions, zero or multiple legacy matches, invalid destination content, unavailable Git objects, and decision-dependent or lossy conversion.
- Verify read-only access leaves artifact bytes unchanged. Verify mutation performs supported safe conversion and the requested operation. Verify explicit bulk conversion reports actual persisted results.
- Exercise immutable history through real owning-skill operations and verify no historical rewrite occurs.
- Use existing tracker record validation and result-delivery operations as integration cases. Existing tracker record-schema and result-delivery tests provide prior art for contract rejection and independent transport/domain contracts.
- Exercise current producers and consumers together after each field cutover. Test old artifacts through their explicit historical contract, not through a dual-field fallback.
- Test skill-authoring guidance with baseline and pressure scenarios. Verify authors identify contracts, choose appropriate schema scope, declare supported upgrades, and stop unsafe conversion.
- Run actual command scenarios for the changed paths. Unit tests alone do not prove skill-operation integration.

## Out of Scope

- Implementing this initiative or creating child tickets during specification publication.
- Automatically executing an upgrade during read-only inspection, installation, or an unrelated skill update.
- Rewriting immutable receipts, events, or other historical evidence.
- Forcing offline historical resolution; Git and source access are expected dependencies.
- Treating every prose file or asset as a separately versioned contract.
- Replacing external format owners' schemas.
- Using schema identifiers as skill release versions, content hashes, storage locations, approval signals, or operation success indicators.

## Further Notes

The agreed manifest filename is `contracts.json`. The manifest itself uses `skill-contract-manifest/v1`. Domain artifacts use their own independent identifiers.

The existing tracker tooling still requires `schema: tracker-initiative/v1` when this specification is published. This record follows the current tooling contract. Publishing the specification does not implement or bypass the future field migration.

Git history availability does not prove that a definition or upgrade is safe. The owning contract must still validate content and preserve its semantics. Listing an old contract does not itself provide a conversion path.

## Tickets

- [Validate manifests and resolve local definitions](../../tickets/skill-contract-manifests-01-local-definitions.md)
- [Resolve pinned historical definitions](../../tickets/skill-contract-manifests-02-historical-definitions.md)
- [Perform safe contract upgrades](../../tickets/skill-contract-manifests-03-safe-upgrades.md)
- [Adopt contracts in tracker operations](../../tickets/skill-contract-manifests-04-tracker.md)
- [Adopt contracts in result delivery](../../tickets/skill-contract-manifests-05-result-delivery.md)
- [Adopt contracts in muxer handoffs](../../tickets/skill-contract-manifests-06-muxer-handoffs.md)
- [Adopt contracts in shared-context operations](../../tickets/skill-contract-manifests-07-shared-context.md)
- [Adopt contracts in worktree operations](../../tickets/skill-contract-manifests-08-worktree.md)
- [Adopt contracts in evidence operations](../../tickets/skill-contract-manifests-09-evidence.md)
- [Update skill-authoring rules](../../tickets/skill-contract-manifests-10-authoring.md)
- [Adopt contracts in artifact sharing](../../tickets/skill-contract-manifests-11-artifact-sharing.md)
- [Adopt contracts in backlog grooming](../../tickets/skill-contract-manifests-12-backlog-grooming.md)
- [Adopt contracts in TWG benchmark runs](../../tickets/skill-contract-manifests-13-twg-benchmark.md)
- [Adopt contracts in Home Assistant bulk operations](../../tickets/skill-contract-manifests-14-homeassistant.md)
- [Adopt contracts in plain-language assessments](../../tickets/skill-contract-manifests-15-plain-language.md)
- [Adopt contracts in web-design source metadata](../../tickets/skill-contract-manifests-16-web-design-metadata.md)
- [Adopt contracts in report generation](../../tickets/skill-contract-manifests-17-report-generation.md)
- [Complete manifest coverage for other maintained skills](../../tickets/skill-contract-manifests-18-manifest-coverage.md)

## Comments

The user confirmed the shared design and the acceptance boundaries before publication.

