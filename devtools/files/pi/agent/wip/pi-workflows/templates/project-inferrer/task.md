Infer the project identity for the project at `{{ path }}`.

## Codebase Analysis

{% if analysis.files is defined %}
### Files ({{ analysis.files | length }} total)
{% for file in analysis.files | batch(20) | first %}
- `{{ file.path }}` ({{ file.language | default("unknown") }})
{% endfor %}
{% if analysis.files | length > 20 %}
... and {{ analysis.files | length - 20 }} more files
{% endif %}
{% endif %}

{% if analysis.entryPoints is defined %}
### Entry Points
{% for ep in analysis.entryPoints %}
- `{{ ep }}`
{% endfor %}
{% endif %}

## Instructions

Read project metadata and documentation to determine the project's identity. Start with:
- README.md (or equivalent)
- Package manifest (package.json, Cargo.toml, pyproject.toml, go.mod, etc.)
- CLAUDE.md or similar project instructions if present
- CI/CD configuration if present

Produce a project identity block:

1. **name** — the project's canonical name (from package manifest, not directory name)
2. **description** — concise summary of what the project does (2-3 sentences max)
3. **core_value** — single sentence: why does this project exist? What value does it provide?
4. **target_users** — who uses this? (e.g., "TypeScript developers", "DevOps engineers", "data scientists")
5. **constraints** — each with `type` and `description`:
   - Runtime constraints (Node.js version, browser support, etc.)
   - Language constraints (TypeScript strict mode, ESM-only, etc.)
   - Compatibility constraints (API stability, backward compat, etc.)
6. **scope_boundaries**:
   - `in`: what the project explicitly does
   - `out`: what the project explicitly does not do (deferred or excluded)
7. **goals** — each with `id`, `description`, and optional `success_criteria` array
   - Only include goals evidenced by the codebase (README roadmap, issues, TODO markers)
8. **status** — one of: inception, planning, development, maintenance, complete
   - Infer from: version maturity, commit recency, test coverage, presence of CI
9. **repository** — repository URL if discoverable from package manifest or git remote
10. **stack** — primary technology choices only (language, framework, key libraries — not every dependency)

## Required Output Schema

You MUST produce JSON conforming exactly to this schema. Every required field must be present.

```json
{{ output_schema }}
```
