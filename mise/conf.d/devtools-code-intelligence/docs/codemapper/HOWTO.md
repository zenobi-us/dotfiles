# Install and inspect Codemapper

## Result

Install the version requested by this module and locate its installation directory. This task does not start Codemapper, create project files, or configure external services.

## Prerequisites

Install mise and obtain network access to the upstream package source. Use Linux or macOS, as required by the tool declaration. The cargo backend may need Rust build tools and system development libraries. Run these commands from the repository root. Installation downloads and executes third-party installation code; review the source first.

## Steps

1. Read [mise.toml](../../mise.toml) and confirm the `cargo:p1rallels/codemapper` entry still requests `latest`.
2. Install that explicit request. This does not rewrite the version declaration:

   ```sh
   mise install "cargo:p1rallels/codemapper@latest"
   ```

3. Locate the installed tool without assuming its executable has the package name:

   ```sh
   mise where "cargo:p1rallels/codemapper@latest"
   ```

## Verification

The installation command should finish successfully. `mise where` should return an existing installation directory, not a missing-version error. This confirms installation only, not application behavior, editor activation, credentials, or service connectivity.

The cargo:p1rallels/codemapper declaration is restricted to Linux and macOS. The module does not generate an index or map a repository.

## Recovery

If installation fails, retain the error and check network access, backend prerequisites, and upstream platform support. Keep version pins unchanged while diagnosing the failure. Re-run the same explicit installation request after fixing the cause. These steps do not change project data or start services, so no application rollback is required.

[Read the Codemapper overview](README.md).

