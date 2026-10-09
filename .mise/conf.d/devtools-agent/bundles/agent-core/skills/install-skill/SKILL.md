---
name: install-skill
description: Install a skill from GitHub or another source, when the user explicitly requests skill installation, resulting in files stored in the configured skills directory
disable-model-invocation: true
---

# Install a Skill

Download and install a new skill for the user.

## User Request

```md
UserRequest: $ARGUMENTS
```

## GitHub

If the skill source in the user request is hosted on GitHub, use the `gh` CLI and the download extension to grab skills from repositories.

```bash
gh download --help
```

```bash
gh download <owner>/<repository> [...filepaths] --outdir <destination-path>/<skill-name>
```

## Other Sources

If the skill source in the user request is hosted elsewhere, use `wget` or `curl` to download skill files directly.

```bash
wget <url> -P <destination-path>/<skill-name>
```

## Storage

Download skills to `${DOTFILE_REPO_ROOT}/ai/skills/`.

Run this workflow only when the user explicitly invokes `install-skill`.
