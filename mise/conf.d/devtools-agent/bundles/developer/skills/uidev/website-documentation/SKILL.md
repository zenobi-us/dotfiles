---
name: website-documentation
description: Authors, edits, and maintains the Dotfiles documentation website when modules, capabilities, guides, or pages change; preserves source ownership, information hierarchy, and the existing design system.
---

# Website documentation

Preserve one hierarchy: module → user-facing capability → overview and task guide. Keep one canonical source for each document.

## Workflow

1. Resolve the repository root. Read its loaded instructions and `docs/website/AGENTS.md`. Use `mq-query` for local Markdown, with explicit input/output formats and the required OKF import.
2. Read repository-root `DESIGN.md` and `UI_FOUNDATION.md`, then `docs/website/content/sections/03-reference/07-design-system.md`. Follow its live guidance in `src/components/DesignSystemOverview/DesignSystemOverview.tsx`, `src/components/PageKinds/page-kinds.ts`, and the component catalogue under `src/components/DesignSystem/`, relative to `docs/website/`. Use the actual component APIs. If a task names `design.md`, locate and read that file when present; otherwise state that the current entry point is the design-system guide. Do not invent a competing design specification.
3. Inspect the affected `mise/conf.d/<module>/` source, its platform-specific mise files, and existing documentation. Treat tool declarations and filenames as candidates, not proof of behavior or activation. Read behavior before describing commands, installation, permissions, or supported platforms. Never inspect or publish credential values for a documentation inventory.
4. Group related implementation files into user-facing capabilities. Give each independently usable managed tool its own capability; do not merge unrelated tools such as fzf and jq into a terminal-tools page. Include custom commands, extensions, plugins, and meaningful configuration workflows. Keep helper files, lockfiles, generated output, individual variables, and individual aliases within their parent capability. Confirm genuinely ambiguous capability boundaries with the user.
5. Preserve the agreed content hierarchy and choose the page kind from the table below. Read [content ownership and authoring](references/content-model.md) before creating or moving content. Preserve existing destinations, particularly bundle and skill pages.
6. Reuse the existing compound components, visual tokens, and content build pipeline. For a preview request, use `ux-preview` and leave production routes unchanged until a direction is selected. A preview is not approval to implement its storage paths or layout.
7. Run the relevant website command from `docs/website/AGENTS.md`. For a site change, build once and open the actual affected surface in a browser. Exercise module → capability → how-to, back links, existing bundle links, missing visuals, and narrow layout. For content-only edits, verify rendering and links, not just Markdown syntax. State only checks you performed.

## Page-kind reference

| Reader goal | Page kind and existing components | Content rule |
| --- | --- | --- |
| Choose a module | Directory: `Page.Header`, `ReferenceList` | Use linked rows. Use `DataTable` only to compare shared attributes. |
| Explore a module | Adapt bundle overview: `Page.Header`, `SectionLinks`, `DocSection`, `ReferenceList` | Show purpose, notable capabilities, and source context. Keep procedures in guides. |
| Understand a capability | Reference article: `Page.Header`, `Prose`, `SourceNote`, provenance rail | Lead with the capability and visual. Do not force generic items into skill-specific metadata. |
| Complete one task | How-to: `Heading`, `Prose`; use `SkillDocument` only for skill guides | Show result, prerequisites, ordered steps, verification, and recovery. Keep consecutive steps visible. |

The current page-kind catalogue and component APIs remain authoritative when they change.

## Example boundary

Group `shells-zsh/modules/mise__env.zsh`, `mise__config.zsh`, and `mise__profile.zsh` as one **Mise shell integration** capability. Keep its overview in a module-local capability directory with `README.md` and `HOWTO.md`; leave executable sources in place. Link from the `shells-zsh` module overview to the capability, then to its how-to. Select the exact documentation directory against existing conventions before writing it.

## Completion

Every changed capability has a reachable module parent, a canonical overview, a separate task guide when authored, and source links. Existing documentation stays canonical. Missing or unverified facts remain explicit. Finish all requested documents; do not publish empty scaffolds or claim inventory candidates are completed documentation.

## Common mistakes

- **File-shaped hierarchy:** give one capability a page, not each implementation file.
- **Duplicate content:** link existing bundle and skill pages instead of copying them.
- **Promotional directory:** use the directory recipe instead of a card grid.
- **Invented proof:** use real captures or an explicit authoring prompt; never present a mock as a screenshot.
- **Guessed behavior:** inspect source and exercise the task before publishing instructions.



