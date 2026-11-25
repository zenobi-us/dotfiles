# Home Assistant record contracts

Use these contracts to read saved operation evidence. Validate a file with `scripts/ha_ops.ts validate-record <file.json>` before rollback or downstream processing.

## Ownership and compatibility

| Record | Current output or input | Historical input | Definition |
| --- | --- | --- | --- |
| Snapshot | Produces and accepts `homeassistant-snapshot/v2` | Unversioned generated snapshot, detected as `homeassistant-snapshot/v1` | `contracts/homeassistant-snapshot-v{1,2}.schema.json` |
| Reference report | Produces and accepts `homeassistant-reference-report/v2` | Unversioned JSON report, detected as `homeassistant-reference-report/v1` | `contracts/homeassistant-reference-report-v{1,2}.schema.json` |
| Cleanup plan | Produces and accepts `homeassistant-cleanup-plan/v2` | Unversioned `cleanup --json` plan, detected as `homeassistant-cleanup-plan/v1` | `contracts/homeassistant-cleanup-plan-v{1,2}.schema.json` |
| Rename map | Accepts `homeassistant-rename-map/v2`; no producer | Unversioned nonempty old-to-new string map, detected as `homeassistant-rename-map/v1` | `contracts/homeassistant-rename-map-v{1,2}.schema.json` |

The schema files are authoritative structural definitions. The shared skill-contracts loader validates `contracts.json` and resolves all definitions from the installed skill directory. The owner validates record content through those definitions.

V1 names the historical unversioned shapes. It does not permit a stamped v1 identifier. V2 introduces `schemaVersion`. These records never used `schema`; that field is unsupported. Explicit unknown versions, mixed identifiers, malformed content and wrong record families fail. Unversioned input must match exactly one historical definition.

## Snapshot meaning

`meta` retains capture time and instance URL. `registries` retains area, device and entity registry entries, including entity identity and unknown external fields. `configs` retains captured automation, script, scene and dashboard data. Optional `states` retains external state records. `warnings` records capture failures. A missing registry is not an empty registry or proof of a complete capture.

Rollback requires a nonempty entity registry after snapshot validation. It keeps the existing identity lookup: `unique_id` first, then `entity_id` when no unique ID exists. It restores entity IDs and the existing name, area, disabled, hidden and icon fields. It does not restore all captured configurations or arbitrary external fields. Review the printed plan before approval.

## Operation records

Cleanup plans retain `dry_run: true`, requested `steps`, rename entity identity, `old` and `new` names, category, group automation, group ID, name, switches, action and warnings. `cleanup --json` emits a validated v2 envelope on stdout and sends progress to stderr. It never applies changes. `--apply --json` is rejected before network access. A saved plan is evidence, not permission to apply changes. No command applies or mutates a saved plan. Historical plans remain unversioned on disk.

```sh
./scripts/ha_ops.ts cleanup --json > cleanup-plan.json
./scripts/ha_ops.ts validate-record cleanup-plan.json
```

Reference reports retain capture metadata, instance URL, backup root, exact search needles, live and backup hits, and warnings. A warning is evidence of an incomplete scan, not proof that no references exist. The JSON report is independently consumed by follow-up tooling.

Rename maps retain requested old-to-new changes. The reference finder searches only mapping keys. It neither applies mappings nor treats envelope metadata as a search needle. A current map has this shape:

```json
{
  "schemaVersion": "homeassistant-rename-map/v2",
  "mappings": { "light.original": "light.renamed" }
}
```

Cleanup and rollback Markdown logs remain human-readable prose. Plain needle files remain line-oriented text. Neither needs an independent version. Raw Home Assistant REST, WebSocket, backup registry, trace, event and dashboard payloads remain Home Assistant-owned formats. Do not stamp those payloads with local identifiers.

## Writes and approval

Snapshots and JSON reference reports use new paths and reject replacement of existing files. Readers and validators preserve original bytes, including historical records. Rollback changes remote state only after the existing approval prompt or `--yes`; `--dry-run` never applies changes. Cleanup keeps its existing `--apply` boundary.

There are no declared upgrades. No command mutates saved snapshot, map, plan or report content. Reading historical input does not require conversion. Installation and read-only commands must not stamp records. Explicit conversion and unsupported upgrade flags are rejected; acceptance alone does not authorize a rewrite.

## Local verification

Use a controlled REST and WebSocket fixture service. Exercise snapshot creation, offline validation, historical and current rollback plans, declined approval, approved fixture rollback, map consumption and JSON reports. Check saved bytes, remote mutation counts and restored entity fields. Use only fixture credentials.

