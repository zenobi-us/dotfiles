# Install and inspect Node.js

## Result

Install the version requested by this module and locate its installation directory. This task does not start Node.js, create project files, or configure external services.

## Prerequisites

Install mise and obtain network access to the upstream package source. Use an operating system supported by the selected mise backend and upstream release. Run these commands from the repository root. Installation downloads and executes third-party installation code; review the source first.

## Steps

1. Read [mise.toml](../../mise.toml) and confirm the `node` entry still requests `22`.
2. Install that explicit request. This does not rewrite the version declaration:

   ```sh
   mise install "node@22"
   ```

3. Locate the installed tool without assuming its executable has the package name:

   ```sh
   mise where "node@22"
   ```

## Verification

The installation command should finish successfully. `mise where` should return an existing installation directory, not a missing-version error. This confirms installation only, not application behavior, editor activation, credentials, or service connectivity.

The module requests the Node.js 22 major release line. A project can select a different runtime through its own configuration.

## Recovery

If installation fails, retain the error and check network access, backend prerequisites, and upstream platform support. Keep version pins unchanged while diagnosing the failure. Re-run the same explicit installation request after fixing the cause. These steps do not change project data or start services, so no application rollback is required.

[Read the Node.js overview](README.md).

