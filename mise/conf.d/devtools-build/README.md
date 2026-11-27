# Build tools

Build configuration, workspace tasks, toolchains, and file watching.

## Notable items

- **[CMake](docs/cmake/README.md):** Configure native software build systems.

- **[Moon](docs/moon/README.md):** Run tasks across a moonrepo workspace.

- **[Proto](docs/proto/README.md):** Manage project toolchains with moonrepo Proto.

- **[Watchexec](docs/watchexec/README.md):** Run commands in response to filesystem changes.


## Scope

[mise.toml](mise.toml) is the source of truth for versions and backend options. These declarations install tools; they do not activate editor clients, provision accounts, or start services. `latest` is a moving request, not a fixed version.

Choose an item above for its configuration and installation guide. Module inclusion in your active mise configuration is separate from the explicit installation commands in these guides.

