# Install and inspect Portless

## Result

Install the version requested by this module and locate its installation directory. This task does not start Portless, create project files, or configure external services.

## Prerequisites

Install mise and obtain network access to the upstream package source. Use an operating system supported by the selected mise backend and upstream release. The npm backend also needs a usable Node.js/npm environment. Run these commands from the repository root. Installation downloads and executes third-party installation code; review the source first.

## Steps

1. Read [mise.toml](../../mise.toml) and confirm the `npm:portless` entry still requests `latest`.
2. Install that explicit request. This does not rewrite the version declaration:

   ```sh
   mise install "npm:portless@latest"
   ```

3. Locate the installed tool without assuming its executable has the package name:

   ```sh
   mise where "npm:portless@latest"
   ```

## Verification

The installation command should finish successfully. `mise where` should return an existing installation directory, not a missing-version error. This confirms installation only, not application behavior, editor activation, credentials, or service connectivity.

The installed help requires Node.js 24 or newer, while devtools-runtimes requests Node.js 22. Resolve that mismatch before running Portless. Proxy startup may elevate privileges and install a local CA.

## Recovery

If installation fails, retain the error and check network access, backend prerequisites, and upstream platform support. Keep version pins unchanged while diagnosing the failure. Re-run the same explicit installation request after fixing the cause. These steps do not change project data or start services, so no application rollback is required.

[Read the Portless overview](README.md).

