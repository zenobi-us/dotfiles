# Install and inspect D2

## Result

Install the version requested by this module and locate its installation directory. This task does not start D2, create project files, or configure external services.

## Prerequisites

Install mise and obtain network access to the upstream package source. Use an operating system supported by the selected mise backend and upstream release. Run these commands from the repository root. Installation downloads and executes third-party installation code; review the source first.

## Steps

1. Read [mise.toml](../../mise.toml) and confirm the `github:terrastruct/d2` entry still requests `latest`.
2. Install that explicit request. This does not rewrite the version declaration:

   ```sh
   mise install "github:terrastruct/d2@latest"
   ```

3. Locate the installed tool without assuming its executable has the package name:

   ```sh
   mise where "github:terrastruct/d2@latest"
   ```

## Verification

The installation command should finish successfully. `mise where` should return an existing installation directory, not a missing-version error. This confirms installation only, not application behavior, editor activation, credentials, or service connectivity.

The module installs the upstream terrastruct/d2 release; it does not supply diagram themes or templates.

## Recovery

If installation fails, retain the error and check network access, backend prerequisites, and upstream platform support. Keep version pins unchanged while diagnosing the failure. Re-run the same explicit installation request after fixing the cause. These steps do not change project data or start services, so no application rollback is required.

[Read the D2 overview](README.md).

