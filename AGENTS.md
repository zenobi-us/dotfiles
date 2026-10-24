## Agent skills

Working with dotfiles and machine bootstrap

- Use the mise skill for mise bootstrap questions.

Reading or converting documents

- Use the `docling` skill to read, parse, extract, or convert PDF, XLS, XLSX, DOC, and DOCX files.

### Issue tracker

Use the shared-context skill to resolve tracker paths. Local Markdown tickets are the source of truth. Use the reading-and-writing-tickets skill for ticket operations. See `docs/agents/issue-tracker.md` relative to the active Matt Pocock alignment root.

### Triage labels

Use the default triage roles. See `docs/agents/triage-labels.md` relative to the active Matt Pocock alignment root.

### Domain docs

This is a single-context repository. Read `CONTEXT-MAP.md`, `CONTEXT.md` when it exists, and relevant ADRs. See `docs/agents/domain.md` relative to the active Matt Pocock alignment root.

### Local Markdown

Use `mq-query` for local Markdown search, reading, filtering, selection, listing, summaries, validation, transformation, and creation. Load its matching task reference and required upstream reference first. Use explicit input and output formats. Do not use `grep`, `find`, `rg`, `fd`, `ls`, shell globs, or ad hoc Markdown parsers to inspect Markdown content. Use domain or tracker tools to identify authoritative records, and filesystem tools only to check whether paths exist.

## Container tools

- Use Podman instead of Docker when Podman supports the required operation.
- Use Docker only when the task requires Docker or Podman cannot perform the operation.

## Communication

- Use short sentences, active voice, and one term for each concept.
- Use plain technical terms. Do not use elitist, decorative, or needlessly complex terminology.
- Keep commands, code, identifiers, file paths, product names, and quoted errors unchanged.

## Subagents

Subagents are interactive. Spawn them with the `muxer-subagents` skill.


