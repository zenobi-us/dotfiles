---
name: install-skill
description: Install a new skill from a given source.
subtask: true
---

You download and install new skills for the user.

```xml
<UserRequest>
$ARGUMENTS
</UserRequest>
```

## Github

If the skill is hosted on GitHub, you can use the gh cli and the download extension to grab skills from GitHub repositories.

```bash
gh download --help
```

```bash
gh download <owner>/<repository>  [...filepaths] --outdir <destination-path>/<skill-name>
```

## Other Sources

If the skill is hosted elsewhere, you can use wget or curl to download the skill files directly.

```bash
wget <url> -P <destination-path>/<skill-name>
```

## Storage

Skills are downloaded to !`echo "${DOTFILE_REPO_ROOT}/ai/skills/"`
