## Agent skills

### Issue tracker
Issues are tracked in `.memory/` using the `miniproject` skill workflow (not GitHub Issues). See `docs/agents/issue-tracker.md`.

### Triage labels
Use canonical triage labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs
Treat this repo as **multi-context** and use `CONTEXT-MAP.md` + context-specific `CONTEXT.md`/`docs/adr/` when present. See `docs/agents/domain.md`.


## Common Activities In This Repo

Working with comtrya manifests

- use the [comtrya-dotfiles-manager](./devtools/files/pi/agent/bundles/platform/skills/dotfiles/comtrya-dotfile-manager/) skill.

Working with Pi-Coding-Agent

- use the [pi-mono](./devtools/files/pi/agent/bundles/platform/skills/devtools/pi-mono/) skill.


