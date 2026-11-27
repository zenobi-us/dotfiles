# Continuous integration tools

Local GitHub Actions tooling and semantic-version utilities.

## Notable items

- **[act](docs/act/README.md):** Run GitHub Actions workflows locally.

- **[actionlint](docs/actionlint/README.md):** Check GitHub Actions workflow definitions.

- **[GitHub Actions Language Server](docs/gh-actions-language-server/README.md):** Provide editor language services for GitHub Actions workflows.

- **[Semver](docs/semver/README.md):** Evaluate and manipulate semantic versions from the command line.


## Scope

[mise.toml](mise.toml) is the source of truth for versions and backend options. These declarations install tools; they do not activate editor clients, provision accounts, or start services. `latest` is a moving request, not a fixed version.

Choose an item above for its configuration and installation guide. Module inclusion in your active mise configuration is separate from the explicit installation commands in these guides.

