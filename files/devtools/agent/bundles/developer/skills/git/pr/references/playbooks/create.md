# Creating and updating pull requests

Execution spec for the `pr` skill. Read it when you open a new PR or update an existing one.

Load `../rules/fixed-decisions.md` and `../rules/repository-conventions.md` before Step 1.
Load `../rules/commits.md` when Step 1 commits, and `../rules/branch-naming.md` when Step 2.1
rejects the branch name.

## Contents

- [Step 0: Capture runtime PR metadata](#step-0-capture-runtime-pr-metadata-required)
- [Step 1: Early cleanup](#step-1-early-cleanup)
- [Step 2: Early exit checks, then rebase](#step-2-early-exit-checks-then-rebase)
- [Step 3: Pre-PR checks](#step-3-pre-pr-checks)
- [Step 4: Gather PR info](#step-4-gather-pr-info)
- [Step 5: Prepare the PR body](#step-5-prepare-the-pr-body)
- [Step 6: Push, then create or update the PR](#step-6-push-then-create-or-update-the-pr)
- [Step 7: Summary output](#step-7-summary-output)
- [Step 8: Watch the PR](#step-8-watch-the-pr)

## Inputs

- User request arguments (optional artifact refs, target branch overrides, notes, `no-watch`).
- Runtime context, from Step 0.

## Step 0: Capture runtime PR metadata (required)

One call, one JSON object. Run it from anywhere; the script locates the repo itself.

```bash
<pr-skill>/scripts/pr.ts meta --json
```

Without `--json` the same script prints a human-readable snapshot. Read the JSON fields below
and carry them in your working notes.

| Field | Meaning |
|---|---|
| `currentBranch`, `defaultBranch`, `targetBranch` | Branch names; `targetBranch` is the override or the default |
| `workingTreeShort` | `git status --short` output (empty = clean) |
| `upstreamRef`, `upstreamOk` | Tracking ref, or `NO_UPSTREAM` with `upstreamOk: false` |
| `fetchOk` | `git fetch origin <targetBranch>` succeeded |
| `branchOk` | `currentBranch` is not the target branch |
| `changedFiles`, `changedFilesCount`, `shortstat` | Diff of `origin/<targetBranch>...HEAD` |
| `commitsOneline` | `git log origin/<targetBranch>..HEAD --oneline`, one entry per commit |
| `hasExistingPr`, `prNumber`, `prTitle`, `prUrl` | The open PR for `currentBranch`, if any (`null` otherwise) |
| `remoteHeadSha` | The sha of `currentBranch` on origin, or `null` when it is not pushed yet |
| `remoteOnlyCommits` | Commits on origin's `currentBranch` that the local branch has no copy of (a rebased copy counts as a copy, commits of the target branch do not count), one oneline entry each |

When the user passes a target branch override, re-run with that branch:

```bash
<pr-skill>/scripts/pr.ts meta --json {target_branch}
```

## Step 1: Early cleanup

The working tree must be clean. Read `workingTreeShort`. When it is not empty, apply "A dirty working tree" in
`../rules/fixed-decisions.md`:

1. Commit the changes that belong to the branch's work with `commit.md`,
   without their step 5 rebase (Step 2.2 rebases).
2. If files that do not belong to it remain, stop and report them. Never `git stash`: the
   stash is shared by every worktree of the checkout.
3. Otherwise continue the PR flow.

## Step 2: Early exit checks, then rebase

### 2.1 Early exit checks

Use the script-derived values first.

| Check | Fields | Stop when |
|---|---|---|
| Target branch | `targetBranch` (the override, else `defaultBranch`) | - |
| Not on the target branch | `currentBranch`, `branchOk` | `branchOk` is `false` |
| Branch name | `currentBranch`, `hasExistingPr` | `<pr-skill>/scripts/pr.ts branch validate` exits 1, or the repository's own branch-name check fails. With no PR yet, rename it (`git branch -m <new-name>`, with a name `pr.ts branch build` gives) and run Step 0 again. With an open PR, ask the user with numbered options: renaming the head branch of an open PR closes the PR. |
| Upstream tracking | `upstreamRef`, `upstreamOk` | Never - Step 6 pushes with `-u`, which creates a missing upstream |
| Target branch ref is current | `fetchOk` | `fetchOk` is `false` |
| Nobody else pushed to the branch | `remoteOnlyCommits` | It is not empty: someone pushed commits this checkout does not have. Report them; the user pulls them first. |

### 2.2 Rebase on the target branch - always

Step 0 fetched the latest target branch. Rebase on it before the checks, so the checks and CI
run on the latest code. This is a fixed decision (`../rules/fixed-decisions.md`) - never ask. Skip it only when
the user asked not to rebase in this request, and say so in the summary.

```bash
git rebase origin/{targetBranch}
```

Resolve a conflict where the two sides do not change the same logic (imports, lines added side
by side, a moved block), then `git rebase --continue`. When both sides change the same logic, run
`git rebase --abort` and ask the user with numbered options which behaviour to keep.

## Step 3: Pre-PR checks

Find the repository's own checks with `../rules/repository-conventions.md` "Pre-PR checks", then run the ones the
diff touches. They must be green before the PR opens. When the repository documents no check,
say so in the Step 7 summary rather than inventing a command.

## Step 4: Gather PR info

### 4.1 Review the branch commits

Prefer `commitsOneline`. Fallback:

```bash
git log origin/{targetBranch}..HEAD --oneline
```

Use the commit history and the user request to summarise the key changes, the affected
areas, and any linked artifacts (issues, tickets, design documents).

### 4.2 Title

Use the repository's convention when `CONTRIBUTING.md` gives one. With none, write
`{type}: {short description}` from the branch and the commits, in the imperative.

Some repositories generate the title from the branch name with a check, and overwrite any
other title. Look for such a workflow in `.github/workflows/` before you write a title, and
match its form when it is there. Never change the title of an existing PR.

## Step 5: Prepare the PR body

Write for a human reviewer: plain language first (why), technical detail last (what).

**The repository's template wins.** Read `.github/PULL_REQUEST_TEMPLATE.md`, the files in
`.github/PULL_REQUEST_TEMPLATE/`, or `docs/pull_request_template.md`. Fill in the headings it
gives, in its order, and ignore the shape below.

Use this shape only when the repository ships no template:

```markdown
## Problem

{One sentence: the problem this PR solves}

## Solution

- {How the change solves the problem, in plain language}

## Testing and verification

{How the change was tested - the commands run, the evidence}

## Known issues and risks

{Trade-offs, follow-ups, rollout or regression risks}

## Technical changes

- {Significant change}
```

Section rules:

- **Problem** is a single sentence - no background essay, no subsections.
- **Solution** is one to three short bullets that a non-author can follow; save file-level
  detail for Technical changes.
- **Testing and verification** and **Known issues and risks** are optional: omit each
  section entirely (heading included) when there is no real content for it. The other three
  sections are always present.
- **Technical changes** lists only the significant changes - not every touched file.
- A repository with clearly separated areas (a monorepo, a frontend and a backend package)
  reads better when every section after **Problem** splits into one `###` subsection per area
  the diff touches, so a reviewer of one area reads only that area. Name the areas after the
  repository's own top-level directories. Omit a subsection when its area has nothing to say.

Write the body to a file in your own scratch directory, outside the repository, and pass that
path to `--body-file`. Never write it to a path inside the repository: the PR body is not part
of the change, and an untracked file left behind makes the next working-tree check dirty.

Include links to related PRs, issues, tickets or docs when relevant.

## Step 6: Push, then create or update the PR

### 6.1 Push the branch - always

Push before the `gh pr` call, every time: with or without an upstream, with or
without an existing PR. This is a fixed decision (`../rules/fixed-decisions.md`) - never ask.

| `remoteHeadSha` (Step 0), with or without a rebase | Push |
|---|---|
| `null` | `git push -u origin HEAD` |
| A sha | `git push -u --force-with-lease=refs/heads/{currentBranch}:{remoteHeadSha} origin HEAD` |

`-u` creates the upstream when `upstreamOk` is `false` and changes nothing when it
is `true`. Without this push, `gh pr create` stops on an interactive prompt of its
own. The Step 2.2 rebase rewrites commits that are already pushed, so a plain push of
them is rejected. The lease names `remoteHeadSha`, whose commits Step 2.1 checked, never a bare
`--force-with-lease`: a bare lease trusts the remote-tracking ref, which an IDE
background fetch can move, and would then delete commits nobody checked. If the push is
rejected, someone pushed after Step 0: stop and report it. Never retry with `--force`.

### 6.2 Create or update

Prefer the script-derived existing PR metadata: `hasExistingPr`, `prNumber`, `prUrl`.

`{bodyFile}` is the scratch file Step 5 wrote.

- If `hasExistingPr` is `true`: `gh pr edit {prNumber} --body-file "{bodyFile}"`
- Else: `gh pr create --title "{title}" --body-file "{bodyFile}" --base {targetBranch}`

If `gh pr edit` exits 0 but the description on GitHub does not change, read
`../troubleshooting/pr-body-not-saved.md` and update the body through the REST API.

Add a label in the same call when the repository asks for one (`--add-label` on an edit,
`--label` on a create). `gh label list` shows what the repository has.

After the create or the edit, refresh the metadata for the final output:

```bash
<pr-skill>/scripts/pr.ts meta --json {targetBranch}
```

## Step 7: Summary output

The PR link is the first line of the output, alone, with the tick in front of it. This
summary is the last message of the turn, so the link is the last thing the user sees. When
the Step 8 watch runs in the background, start it first, then print this summary. It
never sits inside a bullet, a table cell or a sentence, so the reader does not have to
look for it. The rest follows after a blank line. `Created` or `Updated` follows from
the command Step 6.2 ran, not from the refreshed `hasExistingPr`, which is always `true`
after a create. `shortstat` already contains the file count.

```markdown
✅ {prUrl}

Pull Request {Created|Updated}: #{prNumber} - {prTitle}

- Branch: {currentBranch} → {targetBranch}
- Files: {shortstat}
- Decisions applied: {the "Fixed decisions" rows that fired, for example 3 commits, rebase on origin/{targetBranch}, push with -u, watch}

Next: {Watching CI and the review comments | Not watching (no-watch): wait for review, address feedback, merge when approved}
```

## Step 8: Watch the PR

Unless the request has `no-watch` or no user is present (CI, a headless run), read
`watch.md` and run it for this PR. It is a fixed decision (`../rules/fixed-decisions.md`) -
never ask. A background watch starts before the
Step 7 summary, never after it: a message after the summary pushes the link out of view.
