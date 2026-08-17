# Install, update, launch, and develop InvokeAI

First classify the installation. Launcher, manual Python package, source checkout, Docker, and OS service installs have different ownership and update rules.

## Choose the correct path

| Situation | Path |
|---|---|
| Normal local desktop install | Official Invoke Launcher |
| Existing launcher-managed install | Update and launch through that Launcher |
| Headless or controlled Python environment | Manual `uv` install, pinned to an explicit InvokeAI version |
| Contributing or running `main` | Source checkout with separate data root and database backup |
| Containerized server | Pinned image/compose configuration with a persistent root mount |

Do not stack installation methods into the same directory. Do not run a generic `pip install -U invokeai` inside a launcher-managed or source environment.

## Official Launcher

The official Launcher is the maintained default for Windows, macOS, and Linux. It installs/updates InvokeAI and knows where the managed install lives.

Before changing a launcher install:
1. Record the install path and data root.
2. Back up the database and important workflows.
3. Confirm whether the Launcher manages code only or code plus the selected root.
4. Use the Launcher for updates instead of replacing its environment manually.

## Manual package install

Current source declares Python `>=3.11,<3.13`. Official manual docs use `uv` and a relocatable Python 3.12 virtual environment.

General shape:

```bash
mkdir -p /absolute/path/to/invokeai
cd /absolute/path/to/invokeai
uv venv --relocatable --prompt invoke --python 3.12 --python-preference only-managed .venv
source .venv/bin/activate                    # POSIX
# .venv\Scripts\activate                    # Windows PowerShell/cmd equivalent

# Choose the exact package extra, InvokeAI version, and torch backend from
# the documentation for that release and this machine.
uv pip install 'invokeai==<VERSION>' \
  --python 3.12 \
  --python-preference only-managed \
  --force-reinstall \
  [--torch-backend=<BACKEND>]

invokeai-web --root /absolute/path/to/invokeai
```

Rules:
- Pin `<VERSION>`; do not install an unreviewed moving target.
- Select CUDA/ROCm/CPU backend from the target release docs, current hardware, and supported PyTorch indexes.
- Older Nvidia cards may use an `xformers` package extra; verify for the release.
- Use absolute roots. Shell home syntax differs across POSIX and Windows.
- Record `invokeai-web --help` because CLI options may differ.

## Docker

A useful container must have a persistent InvokeAI root. A bare `docker run` without a bind mount or named volume can lose configuration, database, models, and outputs when the container is replaced.

Before running:
- pin the image tag or digest
- mount a persistent host directory/volume as the configured root
- publish only the intended interface/port
- configure Nvidia/AMD runtime correctly
- preserve ownership/permissions on the mounted root
- record environment variables, especially `INVOKEAI_ROOT`

For a source checkout, current materials live under `docker/`; inspect `docker/.env.sample`, compose files, entrypoint, and `docker/README.md` from the exact checkout.

macOS Docker cannot use the host GPU; prefer the Launcher for local generation.

## Source development setup

Use a separate data root from a stable production/creative install. Running `main` against an important SQLite database is reckless without backups because development branches may add migrations.

Current setup shape:

```bash
git lfs install
git lfs pull

uv sync --frozen \
  --python 3.12 \
  --managed-python \
  --extra dev \
  --extra test \
  --extra docs \
  --extra <cuda|rocm|cpu> \
  [--extra xformers]

cd invokeai/frontend/web
pnpm install
pnpm build

invokeai-web --root /absolute/path/to/separate-dev-root
```

Current frontend tooling is tested with Node LTS and pnpm; check the checkout docs/lockfiles for exact versions.

For backend iteration, `--dev_reload` reloads Python source in supported cases, but node definitions still require a full restart.

Ephemeral development state:

```yaml
use_memory_db: true
scan_models_on_startup: true
```

Use this only when persistence is intentionally disposable.

## Updating safely

```text
[Record version/install/root]
          |
          v
[Stop app and back up DB/config/workflows]
          |
          v
[Read release notes + migration warnings]
          |
          v
[Update with owning method]
          |
          v
[Start and observe migrations/logs]
          |
          v
[Verify version, OpenAPI, models, workflows, gallery, generation]
          |
          +-- failure --> [Stop; restore old code/root/DB as one compatible set]
```

Do not restore only the old executable against a newly migrated database unless the release explicitly supports downgrade.

Verification:

```bash
curl --fail-with-body --silent http://127.0.0.1:9090/api/v1/app/version | jq .
curl --fail-with-body --silent http://127.0.0.1:9090/openapi.json >/dev/null
```

Then verify:
- expected models are listed
- important workflows open
- gallery images resolve
- one small known workflow reaches `completed`
- logs contain no migration, import, or custom-node failures

## Start/stop discipline

Use the owning mechanism:
- Launcher: Launcher controls
- foreground manual install: terminal process / `Ctrl-C`
- systemd: `systemctl` unit
- Docker Compose: `docker compose stop/up`
- Windows service/task: its service/task controller

Do not kill blindly during database writes. Confirm the process is stopped before copying the database/root.

## Primary sources

Verified against InvokeAI main commit `68b90174aafebbbba45d14b049fb6852271c76a8`:

- [Simple installation](https://invoke-ai.github.io/InvokeAI/start-here/installation/)
- [Manual installation](https://invoke-ai.github.io/InvokeAI/start-here/manual/)
- [Hardware requirements](https://invoke-ai.github.io/InvokeAI/start-here/system-requirements/)
- [Docker](https://invoke-ai.github.io/InvokeAI/configuration/docker/)
- [Development environment](https://invoke-ai.github.io/InvokeAI/development/setup/dev-environment/)
- [`pyproject.toml`](https://github.com/invoke-ai/InvokeAI/blob/68b90174aafebbbba45d14b049fb6852271c76a8/pyproject.toml)
