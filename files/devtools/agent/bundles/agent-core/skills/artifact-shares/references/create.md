# Create a share repository

Make a new private GitHub repository, fill it with the site template, and turn on
GitHub Pages.

## Before you start

The command pushes to GitHub. Run it only when the user names the operation.

Check the prerequisites:

```bash
"<skillroot>/scripts/artifact-shares/cli.ts" doctor
```

`doctor` exits non-zero when `gh`, `git`, or the template is missing.

## Steps

1. You **MUST** agree the name with the user. The name becomes the repository
   name and the last part of the site URL. It must be lowercase letters, digits,
   dot, dash, or underscore.

2. You **MUST** run the command with that name:

   ```bash
   cli.ts create <name>
   cli.ts create <name> --owner <org>     # an organisation instead of you
   ```

3. You **MUST** report the printed `pagesUrl` to the user, together with the
   warning below.

4. You **SHOULD** watch the first deploy. The site 404s until it finishes:

   ```bash
   gh run watch --repo <owner>/<name>
   ```

## What the command does

| Order | Action |
|---|---|
| 1 | Checks `gh`, `git`, and GitHub authentication |
| 2 | Refuses if the name is already in `~/.config/artifact-shares.json` |
| 3 | Refuses if the repository already exists on GitHub |
| 4 | Refuses if the clone directory already exists |
| 5 | Creates the repository with `gh repo create --private` |
| 6 | Copies `assets/repo-template/` into the clone and renames `package.json` |
| 7 | Commits and pushes `main` |
| 8 | Sets the Pages source to `build_type: workflow` |
| 9 | Records the share in `~/.config/artifact-shares.json` |

Nothing is served from a branch. `.github/workflows/deploy.yml` builds the site
and uploads `dist/public`.

## Where things land

```text
~/.config/artifact-shares.json       the list `list` reads
~/.local/share/artifact-shares/<name>  the clone `share` writes to
```

Change `clone_root` in the config to put clones somewhere else. The CLI reads the
value; it does not move existing clones.

## Pages visibility

A private repository serves its Pages site **publicly**, unless the account has
GitHub Pages access control. That feature is GitHub Enterprise Cloud only.

You **MUST** state this to the user before the first share. A private repository
is not a private website.

To check what the account supports:

```bash
gh api repos/<owner>/<name>/pages --jq '{visibility: .visibility, build_type: .build_type}'
```

## Failure modes

| Message | Cause | Fix |
|---|---|---|
| `<name> is already configured` | The config already names it | Pick another name, or `sync` the existing one |
| `<owner>/<name> already exists` | The repository is on GitHub already | Pick another name, or clone it yourself and add a config entry |
| `<path> already exists` | An old clone is in the way | Move it aside, then run again |
| `Could not read the GitHub login` | `gh` is not authenticated | Run `gh auth login`, or pass `--owner` |

The command does not clean up after a partial failure. If it fails after
`gh repo create`, delete the repository and the clone before you run it again.
