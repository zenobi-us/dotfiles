# Security tools

Vulnerability scanning and secret detection clients.

## Notable items

- **[Grype](docs/grype/README.md):** Scan software artifacts for known vulnerabilities.

- **[TruffleHog](docs/trufflehog/README.md):** Detect exposed secrets in code and other data sources.


## Scope

[mise.toml](mise.toml) is the source of truth for versions and backend options. These declarations install tools; they do not activate editor clients, provision accounts, or start services. `latest` is a moving request, not a fixed version.

Choose an item above for its configuration and installation guide. Module inclusion in your active mise configuration is separate from the explicit installation commands in these guides.

