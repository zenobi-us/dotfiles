# Install and inspect Comfy CLI

## Result

Install the version requested by this module and locate its installation directory. This task does not start Comfy CLI, create project files, or configure external services.

## Prerequisites

Install mise and obtain network access to the upstream package source. Use an operating system supported by the selected mise backend and upstream release. The pipx backend needs its Python package installation prerequisites. Run these commands from the repository root. Installation downloads and executes third-party installation code; review the source first.

## Steps

1. Read [mise.toml](../../mise.toml) and confirm the `pipx:comfy-cli` entry still requests `latest`.
2. Install that explicit request. This does not rewrite the version declaration:

   ```sh
   mise install "pipx:comfy-cli@latest"
   ```

3. Locate the installed tool without assuming its executable has the package name:

   ```sh
   mise where "pipx:comfy-cli@latest"
   ```

## Verification

The installation command should finish successfully. `mise where` should return an existing installation directory, not a missing-version error. This confirms installation only, not application behavior, editor activation, credentials, or service connectivity.

The pipx package provides comfy. Installing the CLI does not install ComfyUI, model weights, custom nodes, or cloud credentials.

## Recovery

If installation fails, retain the error and check network access, backend prerequisites, and upstream platform support. Keep version pins unchanged while diagnosing the failure. Re-run the same explicit installation request after fixing the cause. These steps do not change project data or start services, so no application rollback is required.

[Read the Comfy CLI overview](README.md).

