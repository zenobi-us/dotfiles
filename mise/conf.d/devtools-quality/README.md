# Code quality

Shell and TOML analysis and formatting tools.

## Notable items

- **[ShellCheck](docs/shellcheck/README.md):** Find common errors in shell scripts.

- **[shfmt](docs/shfmt/README.md):** Format shell source files consistently.

- **[Tombi](docs/tombi/README.md):** Provide TOML tooling for formatting, validation, and editor use.


## Scope

[mise.toml](mise.toml) is the source of truth for versions and backend options. These declarations install tools; they do not activate editor clients, provision accounts, or start services. `latest` is a moving request, not a fixed version.

Choose an item above for its configuration and installation guide. Module inclusion in your active mise configuration is separate from the explicit installation commands in these guides.

