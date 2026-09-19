# Create a share repository

Make a new private GitHub repository, fill it with the site template, and turn on
GitHub Pages.

## Before you start

The command pushes to GitHub. Run it only when the user names the operation.

Check the prerequisites:

```bash
"<skillroot>/scripts/artifact-shares/cli.ts" doctor
```

`doctor` exits non-zero when `gh`, `git`, `mise`, or the template is missing.

It also reports `trufflehog` and `gitleaks`. Those two are pinned in the new
repository's own `mise.toml`, so `false` here is not a failure: `mise run
check:secrets` installs them inside the clone on first use.

## Steps

1. You **MUST** agree the name with the user. The name becomes the repository
   name and the last part of the site URL. It must be lowercase letters, digits,
   dot, dash, or underscore.

2. You **MUST** run the command with that name:

   ```bash
   cli.ts create <name>
   cli.ts create <name> --owner <org>     # an organisation instead of you
   cli.ts create <name> --public          # everyone can read every share in it
   ```

   `--public` is the only thing that works on a free plan. It is a decision
   the user makes. You **MUST NOT** pass it on your own.

3. You **MUST** report the printed `pagesUrl` to the user, together with the
   warning below.

4. You **SHOULD** watch the first deploy. The site 404s until it finishes:

   ```bash
   gh run watch "$(gh run list --repo <owner>/<name> --limit 1 --json databaseId --jq '.[0].databaseId')" --repo <owner>/<name>
   ```

## What the command does

| Order | Action |
|---|---|
| 1 | Checks `gh`, `git`, and GitHub authentication |
| 2 | Refuses if the name is already in `~/.config/artifact-shares.json` |
| 3 | Refuses if the repository already exists on GitHub |
| 4 | Refuses if the clone directory already exists |
| 5 | Creates the repository with `gh repo create --private`, or `--public` with the flag |
| 6 | Copies `assets/repo-template/` into the clone and renames `package.json` |
| 7 | Installs the git hooks with `hk install`, so the pre-commit checks are live |
| 8 | Commits and pushes `main` |
| 9 | Sets the Pages source to `build_type: workflow` |
| 10 | Records the share in `~/.config/artifact-shares.json` |

Nothing is served from a branch. `.github/workflows/deploy.yml` builds the site
and uploads `dist/public`.

## Where things land

```text
~/.config/artifact-shares.json       the list `list` reads
~/.local/share/artifact-shares/<name>  the clone `share` writes to
```

Change `clone_root` in the config to put clones somewhere else. The CLI reads the
value; it does not move existing clones.

## The plan comes first

GitHub serves Pages from a **private** repository only on a paid plan. On a free
account or a free organisation the site cannot exist at all: enabling Pages
returns HTTP 422, and `deploy.yml` then fails at `configure-pages`.

`create` reports this and exits non-zero. The repository and the clone are still
usable; only the site is missing.

Check before you start:

```bash
gh api orgs/<owner> --jq .plan.name     # an organisation
gh api user --jq .plan.name             # your own account
```

A free plan leaves two choices, and both belong to the user:

| Choice | Cost |
|---|---|
| Upgrade the account | Money |
| `create <name> --public` | Anyone can read every share in it, for ever |

You **MUST NOT** make a share repository public to get past this. Ask.

## Pages visibility

A private repository on a paid plan serves its Pages site **publicly**, unless
the account has GitHub Pages access control. That feature is GitHub Enterprise
Cloud only.

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
| `Your current plan does not support GitHub Pages` | The repository is private on a free plan | Read "The plan comes first" above. Ask the user before changing anything |
| `warning: hk install failed` | hk could not write the hooks | Not fatal. `share` runs the same checks itself. Fix with `cd <clone> && mise exec -- hk install` |

The command does not clean up after a partial failure. If it fails after
`gh repo create`, delete the repository and the clone before you run it again.
