# Configure storage, back up, restore, and migrate

InvokeAI's root is a coupled data set. Filesystem directories and SQLite records must remain consistent.

## Root contents and meaning

Current defaults under the root:

| Path/config | Meaning |
|---|---|
| `invokeai.yaml` | Non-secret runtime configuration |
| `api_keys.yaml` | External provider credentials managed separately from normal config |
| `databases/invokeai.db` | Workflows, boards, images, model records, users, queue/client state, migrations |
| `models/` | Invoke-managed model weights and caches |
| `outputs/` | Generated image files and related output storage |
| `nodes/` | Custom node packs; arbitrary Python code |
| `workflow_thumbnails/` | Workflow preview assets |
| `style_presets/` | Style preset assets |
| `configs/` | Legacy model configuration files used by migrations/conversion |
| `profiles/` | Optional graph profiles |

Configured path fields may point elsewhere. Relative paths resolve under the root; user-defined path overrides should be absolute.

Important coupling:
- workflows are stored in SQLite, not in a default `workflows/` directory
- boards/gallery metadata and image records are in SQLite while image bytes are under outputs
- model registry/configuration is in SQLite while weights may be under `models/` or external in-place paths
- copying outputs alone does not preserve the gallery
- copying model files alone does not guarantee registration

## Configuration precedence

```text
CLI args > environment (`INVOKEAI_*`) > invokeai.yaml > defaults
```

Current path settings include:

```yaml
models_dir: /absolute/path/models
download_cache_dir: /absolute/path/models/.download_cache
convert_cache_dir: /absolute/path/models/.convert_cache
db_dir: /absolute/path/databases
outputs_dir: /absolute/path/outputs
custom_nodes_dir: /absolute/path/nodes
style_presets_dir: /absolute/path/style_presets
workflow_thumbnails_dir: /absolute/path/workflow_thumbnails
legacy_conf_dir: /absolute/path/configs
profiles_dir: /absolute/path/profiles
```

Do not copy the complete example config into `invokeai.yaml`. Set only intentional overrides and do not edit `schema_version` metadata.

## Backup tiers

### Portable creative backup

Preserve:
- exported important workflow JSON files
- selected outputs/source images
- prompt/metadata sidecars if applicable
- list of model records and sources

This is portable but not a full instance restore.

### Full data backup

With InvokeAI stopped, preserve:
- `invokeai.yaml`
- `api_keys.yaml` with restricted permissions
- complete database directory, including any SQLite `-wal`/`-shm` files
- outputs
- models or a verified manifest of externally managed models
- nodes
- style presets and workflow thumbnails
- launch/service/container definition and relevant environment variables
- installed InvokeAI version and Python/container image version

Large model files may be excluded only if their exact sources, hashes, variants, and registration plan are preserved.

### SQLite verification

Prefer a stopped application. Back up the complete DB directory, then verify the backup copy:

```bash
sqlite3 /backup/databases/invokeai.db 'PRAGMA integrity_check;'
```

Expected output is `ok`.

For a live database snapshot when stopping is impossible, use SQLite's online backup mechanism instead of `cp`; still plan downtime for a full root migration.

## Safe migration: copy, verify, cut over

```text
[Running on old paths]
        |
        v
[Record version/root/config/overrides + free space]
        |
        v
[Stop InvokeAI]
        |
        v
[Back up DB/config and export critical workflows]
        |
        v
[Copy data preserving metadata; do not delete source]
        |
        v
[Edit one authoritative launch/config path]
        |
        v
[Start and verify records + files + generation]
        |
        +-- failure --> [Stop; restore old launch/config; old data still intact]
        |
        v
[Retain old copy for rollback window, then delete deliberately]
```

Before copying:
- confirm source and destination are not nested
- verify destination capacity, filesystem permissions, case sensitivity, symlink behavior, and path length constraints
- record ownership/UID/GID for containers/services
- identify external in-place models outside `models_dir`

Use a copy tool appropriate to the platform. Preserve timestamps, permissions, symlinks, sparse files, and large-file resumability where supported. Compare counts/sizes and, for critical files, hashes.

## Whole-root move vs path overrides

### Move the whole root

Use when code/environment and data-root ownership are understood. Update the owning Launcher/service/container/`--root` setting. Do not assume moving the directory automatically updates a Launcher registration or container volume.

### Keep root; move heavy stores

Usually lower risk. Copy selected directories and set absolute `models_dir`, `outputs_dir`, and/or `db_dir` values. Ensure caches nested under the old model path are also intentionally handled.

Do not use symlinks as the first fix. They can hide permission, container, backup, and cross-filesystem problems.

## Verification checklist

After cutover:

1. `GET /api/v1/app/version` responds with expected version.
2. Runtime configuration/process launch points to intended paths.
3. SQLite backup and active DB pass `PRAGMA integrity_check`.
4. Model list count and important model keys match.
5. Important workflows open and can be exported.
6. Boards/gallery records resolve their images.
7. Existing full images and thumbnails load through the API.
8. Custom node packs load without errors.
9. One small workflow completes and writes to the new output location.
10. Restart once more and repeat critical checks.

Only then retire old data.

## Image subfolder strategy

`image_subfolder_strategy` controls newly created image placement under outputs:
- `flat`
- `date`
- `type`
- `hash`

Changing it does not reorganize existing images. Use InvokeAI's image storage maintenance workflow/API from the installed release. Do not manually rearrange image files behind database records.

## Restore rules

Restore a compatible set:
- InvokeAI code/version
- database schema state
- config/root paths
- output/model/node files

A downgrade after database migration may not be supported. If restoring after a failed upgrade, restore the pre-upgrade database together with the pre-upgrade application.

## Primary sources

Verified against InvokeAI main commit `68b90174aafebbbba45d14b049fb6852271c76a8`:

- [`config_default.py`](https://github.com/invoke-ai/InvokeAI/blob/68b90174aafebbbba45d14b049fb6852271c76a8/invokeai/app/services/config/config_default.py)
- [YAML configuration](https://invoke-ai.github.io/InvokeAI/configuration/invokeai-yaml/)
- [Image storage maintenance](https://invoke-ai.github.io/InvokeAI/features/image-storage-maintenance/)
- [Development environment database warning](https://invoke-ai.github.io/InvokeAI/development/setup/dev-environment/)
- [`workflow_records_sqlite.py`](https://github.com/invoke-ai/InvokeAI/blob/68b90174aafebbbba45d14b049fb6852271c76a8/invokeai/app/services/workflow_records/workflow_records_sqlite.py)
- [`image_records_sqlite.py`](https://github.com/invoke-ai/InvokeAI/blob/68b90174aafebbbba45d14b049fb6852271c76a8/invokeai/app/services/image_records/image_records_sqlite.py)
