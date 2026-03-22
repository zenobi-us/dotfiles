## Project Identity

**Name:** {{ project.name }}
**Description:** {{ project.description }}
**Core Value:** {{ project.core_value }}
{% if project.stack %}

### Stack
{% for item in project.stack %}
- {{ item }}
{% endfor %}
{% endif %}

### Constraints
{% for constraint in project.constraints %}
- [{{ constraint.type }}] {{ constraint.description }}
{% endfor %}

### Scope Boundaries

**In scope:**
{% for item in project.scope_boundaries.in %}
- {{ item }}
{% endfor %}

**Out of scope:**
{% for item in project.scope_boundaries.out %}
- {{ item }}
{% endfor %}

## Requirements

### Must
{% for req in requirements.requirements %}
{% if req.priority == "must" %}
- **{{ req.id }}** [{{ req.type }}]: {{ req.description }}
{% endif %}
{% endfor %}

### Should
{% for req in requirements.requirements %}
{% if req.priority == "should" %}
- **{{ req.id }}** [{{ req.type }}]: {{ req.description }}
{% endif %}
{% endfor %}

### Could
{% for req in requirements.requirements %}
{% if req.priority == "could" %}
- **{{ req.id }}** [{{ req.type }}]: {{ req.description }}
{% endif %}
{% endfor %}

## Instructions

Design the initial architecture for this project. Produce modules, patterns, and boundaries that satisfy the requirements above — starting with "must" requirements and ensuring "should" requirements have a clear home.

### For each module, provide:

1. **name** — short identifier (e.g., "api", "auth", "storage", "cli")
2. **file** — primary file path relative to project root (e.g., "src/api.ts")
3. **responsibility** — one sentence: what this module owns and what it does not
4. **dependencies** — array of other module names this depends on (empty if none)
5. **lines** — estimated lines of code (rough order of magnitude)

### For each pattern, provide:

1. **name** — recognized pattern name (e.g., "Repository Pattern", "Event Sourcing", "Middleware Pipeline")
2. **description** — why this pattern is appropriate for this project's specific needs
3. **used_in** — array of module names that implement this pattern

### For boundaries, provide:

An array of strings — each describing a hard architectural constraint. These should be specific to this project, not generic ("All database access goes through the storage module", not "separate concerns").

### Design principles

- Module count should be proportional to requirements — a 5-requirement project needs 3-5 modules, not 15
- Every "must" functional requirement should map to at least one module's responsibility
- Every "must" non-functional requirement should be addressed by a pattern or boundary
- Dependencies should flow in one direction — avoid circular module dependencies
- If the project has a stated stack, modules should use file extensions and conventions matching that stack
- Prefer explicit boundaries over implicit conventions

### Overview

Write an `overview` paragraph (required) summarizing:
- The architectural style (layered, modular, pipeline, etc.)
- The key structural decisions and why they fit this project
- How the architecture supports the core_value

### Output format

Produce a single JSON object:

```json
{
  "overview": "string (required)",
  "modules": [
    {
      "name": "string (required)",
      "file": "string (required)",
      "responsibility": "string (required)",
      "dependencies": ["string"],
      "lines": 100
    }
  ],
  "patterns": [
    {
      "name": "string (required)",
      "description": "string (required)",
      "used_in": ["module-name"]
    }
  ],
  "boundaries": ["string"]
}
```
