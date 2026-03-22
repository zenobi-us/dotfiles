Capture a handoff snapshot for the project at `{{ path }}`.

## Current Project State

{% if project_state.project is defined %}
### Project
**{{ project_state.project.name | default("unnamed") }}** — {{ project_state.project.description | default("no description") }}
Status: {{ project_state.project.status | default("unknown") }}
{% endif %}

{% if project_state.phases is defined and project_state.phases | length > 0 %}
### Phases
{% for phase in project_state.phases %}
- Phase {{ phase.number | default(loop.index) }}: {{ phase.name | default("unnamed") }} ({{ phase.status | default("unknown") }})
{% endfor %}
{% endif %}

{% if project_state.blockSummaries is defined %}
### Block Summaries
{% for block in project_state.blockSummaries %}
- **{{ block.name }}**: {{ block.count | default("?") }} entries
{% endfor %}
{% endif %}

{% if project_state.gaps is defined %}
### Open Gaps
{% for gap in project_state.gaps %}
{% if gap.status == "open" %}
- [{{ gap.priority }}] {{ gap.id }}: {{ gap.description }}
{% endif %}
{% endfor %}
{% endif %}

{% if project_state.decisions is defined %}
### Recent Decisions
{% for decision in project_state.decisions %}
- {{ decision.id | default("?") }}: {{ decision.description | default(decision.title | default("no description")) }}
{% endfor %}
{% endif %}

{% if project_state.recentCommits is defined %}
### Recent Commits
{% for commit in project_state.recentCommits %}
- `{{ commit.sha | default("?") | truncate(7, true, "") }}` {{ commit.message | default("no message") }}
{% endfor %}
{% endif %}

## Instructions

Synthesize the project state above into a handoff block that enables a future agent or human to resume work seamlessly.

1. **context** — Write a paragraph capturing:
   - What was being worked on (current phase, recent commits, active changes)
   - The current state of thinking (what decisions were made, what approach is being taken)
   - Any momentum or direction that should be preserved

2. **timestamp** — Current datetime in ISO 8601 format (e.g., 2026-03-18T14:30:00Z)

3. **current_phase** — The phase currently being worked on (number or name)

4. **current_tasks** — Task IDs currently in progress (from project state if available, otherwise infer from recent activity)

5. **blockers** — Anything preventing progress:
   - Unresolved decisions that block implementation
   - Failing tests or broken builds
   - Missing dependencies or external requirements
   - Only include genuine blockers, not wishes

6. **next_actions** — Concrete next steps, ordered by priority:
   - What should the next session do first?
   - What's the next logical step in the current phase?
   - Keep to 3-5 actionable items

7. **open_questions** — Genuine unknowns requiring input:
   - Design decisions that need human judgment
   - Ambiguities discovered during development
   - Technical choices with trade-offs that haven't been resolved

8. **key_decisions_pending** — Decision IDs from the project state that need resolution

9. **files_in_flux** — Files with incomplete or in-progress changes (NOT every recently committed file — only files that have partial work)

Read project blocks if needed to get more detail than the summary provides. Focus on in-flight state, not project overview.

## Required Output Schema

You MUST produce JSON conforming exactly to this schema. Every required field must be present.

```json
{{ output_schema }}
```
