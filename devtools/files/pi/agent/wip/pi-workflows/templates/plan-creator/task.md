## Project Identity

**Name:** {{ project.name }}
**Description:** {{ project.description }}
**Core Value:** {{ project.core_value }}
**Status:** {{ project.status }}
{% if project.stack %}

### Stack
{% for item in project.stack %}
- {{ item }}
{% endfor %}
{% endif %}

## Requirements Summary

{% for req in requirements.requirements %}
{% if req.priority == "must" %}
- **{{ req.id }}** [must/{{ req.type }}]: {{ req.description }}
{% endif %}
{% endfor %}
{% for req in requirements.requirements %}
{% if req.priority == "should" %}
- **{{ req.id }}** [should/{{ req.type }}]: {{ req.description }}
{% endif %}
{% endfor %}
{% for req in requirements.requirements %}
{% if req.priority == "could" %}
- **{{ req.id }}** [could/{{ req.type }}]: {{ req.description }}
{% endif %}
{% endfor %}

## Architecture

**Overview:** {{ architecture.overview }}

### Modules
{% for module in architecture.modules %}
- **{{ module.name }}** (`{{ module.file }}`): {{ module.responsibility }}{% if module.dependencies %} [depends: {{ module.dependencies | join(", ") }}]{% endif %}
{% endfor %}

### Patterns
{% for pattern in architecture.patterns %}
- **{{ pattern.name }}**: {{ pattern.description }} (used in: {{ pattern.used_in | join(", ") }})
{% endfor %}

### Boundaries
{% for boundary in architecture.boundaries %}
- {{ boundary }}
{% endfor %}

{% if existing_files %}
## Existing Project Files

The project directory already contains these files:
{% for file in existing_files %}
- {{ file }}
{% endfor %}

Account for existing structure — do not plan to recreate files that already exist unless they need modification.
{% endif %}

## Instructions

Create implementation phases and tasks that build this project incrementally. The plan should take the project from its current state ({{ project.status }}) to a working system that satisfies all "must" requirements and addresses "should" requirements.

### Phase guidelines

1. **Phase 1** — Foundation: project structure, core module scaffolding, configuration, initial tests
2. **Phase 2+** — Layer functionality in priority order: "must" requirements first, then "should"
3. **Final phase** — Integration, documentation, and verification
4. Each phase should represent a meaningful milestone — the project is more capable after each phase
5. A phase with more than 8-10 tasks is likely too large — split it

### For each phase, provide:

- **number** — sequential starting at 1
- **name** — short descriptive name
- **intent** — what this phase accomplishes and why it comes at this point
- **goal** — what is true after this phase that was not true before
- **status** — `"planned"`
- **success_criteria** — array of `{ criterion, verify_method }` (verify_method: "command", "inspect", or "test")
- **dependencies** — array of phase numbers this depends on (empty for phase 1)
- **inputs** — what this phase needs from prior phases or external sources
- **outputs** — what this phase produces for later phases or users

### For each task, provide:

- **id** — unique, formatted as T-001, T-002, etc.
- **description** — clear statement of what to do
- **status** — `"planned"`
- **phase** — phase number this belongs to
- **files** — array of file paths this task creates or modifies
- **acceptance_criteria** — array of specific, verifiable statements
- **depends_on** — array of task IDs this depends on (empty if none)
- **notes** — optional: any implementation guidance or caveats

### Task sizing

- Each task should be completable by one agent in one context window
- A task touching more than 3-5 files likely needs splitting
- A task with more than 5 acceptance criteria may be doing too much
- Group related changes: schema + implementation + test = one task when files are few

### Traceability

- Every "must" requirement should be addressed by at least one task
- Every task's files should map to at least one architecture module
- Note requirement IDs in task descriptions or notes where the mapping is clear

### Output format

Produce a single JSON object with two arrays:

```json
{
  "phases": [
    {
      "number": 1,
      "name": "string",
      "intent": "string",
      "goal": "string",
      "status": "planned",
      "success_criteria": [{ "criterion": "string", "verify_method": "command" }],
      "dependencies": [],
      "inputs": ["string"],
      "outputs": ["string"]
    }
  ],
  "tasks": [
    {
      "id": "T-001",
      "description": "string",
      "status": "planned",
      "phase": 1,
      "files": ["src/file.ts"],
      "acceptance_criteria": ["string"],
      "depends_on": [],
      "notes": "optional string"
    }
  ]
}
```
