Identify gaps in the project at `{{ path }}`.

## Architecture

{% if architecture.overview %}
{{ architecture.overview }}
{% endif %}

### Modules
{% if architecture.modules is defined %}
{% for m in architecture.modules %}
- **{{ m.name }}** (`{{ m.file }}`{% if m.lines %}, {{ m.lines }} lines{% endif %}): {{ m.responsibility }}
{% endfor %}
{% endif %}

{% if architecture.patterns is defined %}
### Patterns
{% for p in architecture.patterns %}
- **{{ p.name }}**: {{ p.description }}{% if p.used_in %} — used in: {{ p.used_in | join(", ") }}{% endif %}
{% endfor %}
{% endif %}

{% if architecture.boundaries is defined %}
### Boundaries
{% for b in architecture.boundaries %}
- {{ b }}
{% endfor %}
{% endif %}

## Codebase Analysis

{% if analysis.files is defined %}
### Files ({{ analysis.files | length }} total)
{% for file in analysis.files %}
- `{{ file.path }}` ({{ file.language | default("unknown") }}, {{ file.lines | default("?") }} lines){% if file.exports %} — {{ file.exports | length }} exports{% endif %}
{% endfor %}
{% endif %}

{% if analysis.types is defined %}
### Types
{% for t in analysis.types %}
- `{{ t.name }}` ({{ t.kind }}) in `{{ t.file }}`
{% endfor %}
{% endif %}

## Instructions

Cross-reference the architecture and analysis to identify gaps. Use targeted reads to verify findings.

### Gap categories to check

1. **missing** — functionality that should exist based on architecture but doesn't
   - Test files for source modules (find test files, compare against source)
   - Error handling for public APIs
   - Documentation for exported interfaces
   - Schema validation for user-facing inputs

2. **incomplete** — partially implemented functionality
   - TODO/FIXME/HACK comments (`grep -r "TODO\|FIXME\|HACK"`)
   - Stub or placeholder implementations
   - Functions that return hardcoded values or throw "not implemented"

3. **defect** — likely bugs or incorrect behavior
   - Uncaught promise rejections, missing null checks
   - Type assertions that bypass safety (`as any`, `!` operator overuse)
   - Error paths that swallow exceptions silently

4. **technical-debt** — code that works but hampers maintenance
   - Duplicated logic across modules
   - Outdated patterns inconsistent with the rest of the codebase
   - Overly complex functions (high cyclomatic complexity)

5. **improvement** — opportunities to improve existing working code
   - Performance bottlenecks
   - Missing caching or memoization for expensive operations
   - Public APIs that could be more ergonomic

6. **question** — ambiguities requiring human or further investigation
   - Unclear design decisions without documented rationale
   - Behavior that could be intentional or accidental

### Gap ID format

Use the pattern: `gap-{abbrev}-{nnn}` where abbrev is:
- `miss` for missing, `inc` for incomplete, `def` for defect
- `debt` for technical-debt, `imp` for improvement, `q` for question

### Priority calibration

- **critical**: blocks further development or causes data loss
- **high**: significant impact on reliability, correctness, or developer experience
- **medium**: notable but workable; should be addressed in normal development
- **low**: minor cleanup or cosmetic; address opportunistically

Set `source` to `"agent"` for all gaps. Set `status` to `"open"` for all gaps.

## Required Output Schema

You MUST produce JSON conforming exactly to this schema. Every required field must be present.

```json
{{ output_schema }}
```
