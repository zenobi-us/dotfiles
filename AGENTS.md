## Agent skills

Working with dotfiles and machine bootstrap

- Use the mise skill for mise bootstrap questions.

Working with Pi-Coding-Agent

- Use the [pi-mono](./files/devtools/agent/bundles/platform/skills/devtools/pi-mono/) skill.

Reading or converting documents

- Use the `docling` skill to read, parse, extract, or convert PDF, XLS, XLSX, DOC, and DOCX files.

Project management

- Use the [project-planning](./files/devtools/agent/bundles/business/skills/projectmanagement/project-planning/) skill.

### Issue tracker

GitHub Issues in `zenobi-us/dotfiles` are the source of truth. Use `gh` for issue operations. See `docs/agents/issue-tracker.md` relative to the active Matt Pocock alignment root.

### Domain docs

This is a single-context repository. Read `CONTEXT.md` and relevant `docs/adr/` files when they exist. See `docs/agents/domain.md` relative to the active Matt Pocock alignment root.

### Local Markdown

Use `agent-core:mq-query` for local Markdown search, reading, filtering, selection, listing, summaries, validation, transformation, and creation. Load its matching task reference and required upstream reference first. Use explicit input and output formats. Do not use `grep`, `find`, `rg`, `fd`, `ls`, shell globs, or ad hoc Markdown parsers to inspect Markdown content. Use domain or tracker tools to identify authoritative records, and filesystem tools only to check whether paths exist.

## Container tools

- Use Podman instead of Docker when Podman supports the required operation.
- Use Docker only when the task requires Docker or Podman cannot perform the operation.

## Communication

- Use ASD-STE100 Simplified Technical English for all communication.
- Use short sentences, active voice, and one term for each concept.
- Use plain technical terms. Do not use elitist, decorative, or needlessly complex terminology.
- Keep commands, code, identifiers, file paths, product names, and quoted errors unchanged.

## Subagents

Subagents are interactive. Spawn them with the `muxer-subagents` skill.
