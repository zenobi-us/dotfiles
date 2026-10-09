---
name: homeassistant-ops
description: Run Home Assistant bulk operations with plan/apply/validate/rollback workflows.
---

# Home Assistant Ops

Use `scripts/ha_ops.ts` directly. It uses Bun, the exact `mise x -- bun --install=fallback` shebang, and Crust subcommands.

## Safety workflow

1. Inventory the current state.
2. Produce an explicit change set.
3. Run a dry plan.
4. Apply only after review.
5. Validate the target behavior.
6. Keep a timestamped log and rollback mapping.

Set `HA_URL` and `HA_TOKEN` in the environment. Never pass tokens on the command line.

```bash
./scripts/ha_ops.ts --help
./scripts/ha_ops.ts doctor
./scripts/ha_ops.ts cleanup --help
./scripts/ha_ops.ts snapshot
./scripts/ha_ops.ts rollback <snapshot.json> --dry-run
./scripts/ha_ops.ts find-references --needle switch.bedroom_lights
./scripts/ha_ops.ts traces --help
./scripts/ha_ops.ts tail-events --help
./scripts/ha_ops.ts name-review-from-backup --help
```

`cleanup` is dry-run by default. Use `--apply` to mutate Home Assistant. The existing operation groups preserve their plan/apply/validate behavior: `cleanup`, `snapshot`, `rollback`, `find-references`, `traces`, `tail-events`, and `name-review-from-backup`.

The script requires Bun, Home Assistant access, and the external API/WebSocket services. It does not require npm runtime packages beyond Bun fallback installation of the CLI framework.

## Resources

- `references/api.md`
- `references/playbook.md`
- `references/id_conventions.md`
