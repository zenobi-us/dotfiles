# Matt Pocock Pi bundle

Engineering workflow skills plus origin-keyed shared context support.

## Upstream skills

Promoted skills and human docs are synchronized from [`mattpocock/skills`](https://github.com/mattpocock/skills) commit `9603c1cc8118d08bc1b3bf34cf714f62178dea3b`:

- `skills/engineering/` — 17 engineering skills, including `ask-matt`, `to-spec`, `to-tickets`, and `wayfinder`
- `skills/productivity/` — 5 productivity skills, including `writing-great-skills`
- `docs/engineering/` and `docs/productivity/` — upstream human-facing docs
- `agents/openai.yaml` — upstream Agent Skills metadata retained beside every skill

Pi-specific divergence is limited to [ALIGNMENT-ROOT.md](./ALIGNMENT-ROOT.md), short alignment-root pointers in artifact-consuming skills, and tracker backend metadata required by migration. The shared-context extension these skills depend on now lives in the sibling [`shared-agent-context`](../shared-agent-context) bundle, so it isn't vendor-tied to Matt Pocock's skills and can be reused (as a Claude Code plugin, too) by anything that wants origin-keyed shared context.

## Context extension

See [`../shared-agent-context/README.md`](../shared-agent-context) for how the extension resolves an origin-keyed shared root, the `/eng-context` subcommands, and the injected `<shared-agent-context>` XML shape that this bundle's skills read via [ALIGNMENT-ROOT.md](./ALIGNMENT-ROOT.md). The shared root is configured in `~/.config/shared-agent-context/config.json` (`storage_path`), not hardcoded to any one tool's directory.

`root` and `shared-root` both identify the active alignment storage. They point to the repository in repository mode and the origin-keyed external directory in shared mode. A `.storage` marker in the external directory records the selected mode, allowing migration back to repository storage without deleting the shared copy. The external candidate is intentionally omitted from XML while repository storage is active.

## Alignment files

Skills resolve these paths against the injected `root`, falling back to the repository root when the extension is absent:

```text
AGENTS.md
docs/agents/issue-tracker.md
docs/agents/triage-labels.md
docs/agents/domain.md
CONTEXT.md
CONTEXT-MAP.md
docs/adr/
src/**/docs/adr/
.scratch/
```

Migration covers `AGENTS.md` (or the active repository instruction file), `docs/agents/`, `CONTEXT.md`, `CONTEXT-MAP.md`, `docs/adr/`, and context-scoped `src/**/docs/adr/`. It copies `.scratch/` only when `docs/agents/issue-tracker.md` declares `backend: local-markdown`; external trackers leave `.scratch/` behind. Missing backend metadata with an existing `.scratch/` aborts migration. Differing destination files also abort before anything is copied.

Repository source code, ordinary project docs/specs, tests, prototypes, research notes, commits, and branches always remain in the Git working tree.
