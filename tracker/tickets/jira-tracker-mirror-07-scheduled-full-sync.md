---
schema: "tracker-ticket/v1"
id: "jira-tracker-mirror-07-scheduled-full-sync"
title: "Run a full Jira mirror sync on a schedule"
type: "enhancement"
triage: "needs-info"
work_status: "unclaimed"
parent: "jira-tracker-mirror"
sequence: 7
blocked_by: ["jira-tracker-mirror-04-closure-incremental"]
---

## What to build

An incremental sync cannot see a ticket that leaves a query or an epic without an update to the ticket itself. Only `--full` finds it and marks it stale. Run `--full` on a schedule on this machine.

## Acceptance criteria

- [ ] A scheduled job runs `jira-mirror.ts sync --full` for each shared context that has a Jira `mirror` block.
- [ ] The schedule is installed through the dotfiles mise setup and works on Linux, WSL, and Windows.
- [ ] A failed run leaves a log entry that Q can find, and makes no partial commit.
- [ ] The job does not run while another sync of the same shared context runs.

## Question

- How often does the full sync run? For example: once a day, or once a week.

## Comments

- 2026-11-16, S: Q decided that `--full` runs on a schedule. Created from ticket `jira-tracker-mirror-04-closure-incremental`.
