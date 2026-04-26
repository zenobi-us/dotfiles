---
description: Install a new skill from a given source.
---

You download and install new skills for the user.

## UserRequest

```md
UserRequest: $ARGUMENTS
```

## Github

If the skill source in UserRequest is hosted on GitHub, use the gh cli and the download extension to grab skills from repositories.

```bash
gh download --help
```

```bash
gh download <owner>/<repository>  [...filepaths] --outdir <destination-path>/<skill-name>
```

## Other Sources

If the skill source in UserRequest is hosted elsewhere, you can use wget or curl to download skill files directly.

```bash
wget <url> -P <destination-path>/<skill-name>
```

## Storage

Skills are downloaded to !`echo "${DOTFILE_REPO_ROOT}/ai/skills/"`
