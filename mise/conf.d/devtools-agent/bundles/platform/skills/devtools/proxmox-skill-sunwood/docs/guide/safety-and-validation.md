# Safety and Validation

## Safety rules

- Keep `.env` local and unpublished.
- Inspect node names, IDs, storage, bridges, and template IDs before writing.
- Use `--wait` when you need the completed task result.
- Prefer generic placeholders such as `pve` or `<node>` in published docs instead of local cluster names.

## What the helper handles

- `.env` loading from disk
- `root` to `root@pam` normalization
- `POST /access/ticket` authentication
- `Cookie` and `CSRFPreventionToken` handling for write calls
- task polling through the Proxmox task status endpoint

## Validation evidence

The repository has been validated in three layers:

1. static validation of the helper CLI shape
2. structural validation of the skill files and docs
3. live validation of the LXC path on a real Proxmox VE host

The public documentation intentionally excludes host-specific identifiers while preserving the command patterns and operational order.

## Reusable validation helpers

The probe and snapshot flows used during validation are packaged as:

- `scripts/examples/cluster_probe.py`
- `scripts/examples/guest_snapshot.py`

They are intentionally non-destructive so you can repeat the same inspection steps safely before moving on to start, create, clone, or create-ct operations.
