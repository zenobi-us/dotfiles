---
name: html-artifact
description: "Generate standalone HTML artifacts for human consumption from conversations, plans, approaches, reports, reviews, explainers, prototypes, or editors. Use instead of long replies or Markdown files when the user asks for an artifact."
license: MIT
user-invocable: true
argument-hint: "<artifact request>"
metadata:
  author: vanillagreen
  source: vstack
  repository: "https://github.com/vanillagreencom/vstack"
  bugs: "https://github.com/vanillagreencom/vstack/issues"
  version: "1.0.0"
---

# HTML Artifact

Use when the user wants a human-readable artifact from a conversation, plan, approach, report, review, explainer, prototype, or custom editor instead of a long reply or Markdown file.

## Repository style

Before selecting a template, resolve the target repository root from the task context.
Read its `AGENTS.md` and follow its artifact-style pointers. When present, read
`DESIGN.md` for visual style and `UI_FOUNDATION.md` for implementation and verification.
Resolve these files from the target repository, not this skill's installed directory
or an artifact output directory. If no repository style is defined, use the template defaults.

Apply the repository style to the template's colors, typography, spacing, and controls.
Keep the template's useful structure and behavior. An explicit user-requested visual
direction overrides style defaults, not accessibility or verification requirements.
Do not copy the repository's style rules into this skill.

For example, when a repository specifies square monospace reports, restyle the chosen
report template accordingly instead of retaining its rounded cards and display font.
Verify the rendered artifact using the repository's guidance before delivery.

Rules:
1. Always write one standalone `.html` file with inline CSS/JS and no build step.
2. Start from the closest `templates/` file, then replace demo content with the user's content.
3. Default path: `artifacts/<short-slug>.html` unless the user gave a path; create parent dirs.
4. After writing, open it in the user's default browser and give the `file://` link in chat.
5. Chat reply stays short: link + one-line note.

Templates:

| Template | Use when |
|---|---|
| `01-exploration-code-approaches.html` | Compare code approaches side by side when direction or tradeoff is unclear. |
| `02-exploration-visual-designs.html` | Compare visual/layout directions before choosing one. |
| `03-code-review-pr.html` | Review a PR or diff with annotations, severity, and jump links. |
| `04-code-understanding.html` | Explain an unfamiliar module, package, call graph, or hot path. |
| `05-design-system.html` | Show design tokens, colors, type, spacing, and reusable UI rules. |
| `06-component-variants.html` | Review one component across variants, states, sizes, and intents. |
| `07-prototype-animation.html` | Tune motion/animation with sliders or live controls. |
| `08-prototype-interaction.html` | Prototype a small clickable flow across screens. |
| `09-slide-deck.html` | Turn a thread, plan, or report into an arrow-key presentation. |
| `10-svg-illustrations.html` | Create editable SVG figures, diagrams, or visual explanations. |
| `11-status-report.html` | Produce weekly/project status with highlights, slips, chart, and next steps. |
| `12-incident-report.html` | Write an incident/postmortem timeline with logs and follow-up checklist. |
| `13-flowchart-diagram.html` | Draw a process, pipeline, or workflow with clickable step details. |
| `14-research-feature-explainer.html` | Explain how a repo feature works with snippets, flow, FAQ, and gotchas. |
| `15-research-concept-explainer.html` | Teach a concept with interaction, glossary, comparison, and examples. |
| `16-implementation-plan.html` | Create implementation plan with milestones, data flow, mockups, risks, code snippets. |
| `17-pr-writeup.html` | Create reviewer-facing PR writeup: motivation, before/after, file tour, focus areas. |
| `18-editor-triage-board.html` | Build a drag/drop editor for prioritizing, bucketing, or triaging items. |
| `19-editor-feature-flags.html` | Build a constrained config/flag editor with dependency warnings and copy diff. |
| `20-editor-prompt-tuner.html` | Build a prompt/template tuner with live preview, variables, and copy output. |

