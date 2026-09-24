---
name: github-settings-as-code
description: Use when creating a GitHub repository or applying repository settings, rulesets, Actions settings, Pages settings, environments, variables, or vulnerability alerts from a profile under files/devtools/github. New repositories use the default profile when no profile is specified.
---

# Manage GitHub repository settings

Use the `github-settings-as-code` package from `noshiro-pf/mono`.

## Profile location

Profiles live under:

```text
files/devtools/github/<profile>/
```

Each profile mirrors the upstream `repo-settings/` directory:

```text
<profile>/
├── repository-settings/settings.json
├── rulesets/*.json
├── variables/settings.json
├── actions-settings/settings.json
├── pages/settings.json
├── environments/*.json
└── vulnerability-alerts/settings.json
```

A missing file means that the apply operation leaves that setting unchanged.

## Profile selection

- `default/` MUST exist.
- Use `default/` for a new repository when the user does not name a profile.
- Use the named profile when the user names one.
- Fail if an explicit profile does not exist.
- Do not silently replace an invalid profile with `default`.
- Require an explicit profile when applying settings to an existing repository, unless the user explicitly chooses `default`.

## Create a new repository

1. Create the repository with `gh repo create`.
2. Resolve the profile. Use `default` when the user did not name one.
3. Run `scripts/apply-profile` with the new `OWNER/REPO`.
4. Report the repository and profile.

Example:

```sh
scripts/apply-profile zenobi-us/example --profile default
```

## Apply an existing profile

Use the helper rather than invoking `repo-settings` directly:

```sh
scripts/apply-profile OWNER/REPO --profile PROFILE
```

The helper copies the profile into a temporary `repo-settings/` directory and runs the upstream CLI there. This keeps the central profile unchanged because the upstream `apply` command rewrites local settings with GitHub's canonical values.

## Safety

- Confirm visibility changes.
- Confirm ruleset changes.
- Confirm collaborator or access changes.
- Do not store tokens in profile files.
- Do not run `backup` in `files/devtools/github/<profile>/`.
- Do not describe `apply` as a dry run. The upstream CLI has no plan command.
- Use `--owner` and `--repo` when the target repository is not the current Git remote.

## Authentication

The upstream package uses the existing GitHub authentication. Run `gh auth status` if authentication fails.

The package requires Node `>=22.22.2`. The helper pins `github-settings-as-code@4.0.0`.
