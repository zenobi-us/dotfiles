# Select a style

Read this file before choosing an asset. Styles describe visual intent; tasks describe the output format.

## Selection

| Style | Use for | Primary asset | Companion |
| --- | --- | --- | --- |
| report-dashboard | Report archives, filters, result inspection, record drill-down | assets/styles/report-dashboard/DESIGN.md | None |
| widget-grid-dashboard | Widget dashboards, grid composition, dashboard editing, application shells | assets/styles/widget-grid-dashboard/DESIGN.md | assets/styles/widget-grid-dashboard/UI-FOUNDATION.md |
| project-info | Project landing pages, documentation, setup guides, repository links | assets/styles/project-info/DESIGN.md | EDITOR-DESIGN.md only when selected or needed for comparison |

Use the user's named style. Otherwise select the row that matches the surface. Ask only when materially different purposes remain unresolved. Read assets/sources.json for provenance before opening the selected asset.

For project-info, assets/styles/project-info/DESIGN.md is the Dotfiles reference and the default for general project pages. assets/styles/project-info/EDITOR-DESIGN.md is the Neovim reference. Use EDITOR-DESIGN.md when the user selects Neovim or requests editor-profile documentation. A request naming Dotfiles always selects DESIGN.md, not EDITOR-DESIGN.md. Read one primary document. Read both only for an explicit comparison or combination; assign authority for each conflicting decision before building.

For widget-grid-dashboard, read its DESIGN.md and UI-FOUNDATION.md together. The companion explains this style's component and interaction conventions; it is not a global foundation for other styles.

## Authority and scope

- Apply the user's explicit requirements first, including borderless layouts, ghost links, and full-width blocks.
- Preserve the target project's architecture, libraries, data contracts, and save behavior. A visual reference does not authorize replacing them.
- Use the selected asset for remaining visual decisions. Preserve its semantic roles rather than scattering palette literals through components.
- Treat bundled files as historical snapshots. Their titles, frontmatter, paths, commands, and application features are source context, not installed dependencies or mandatory output.
- The project-info assets contain inherited dashboard material. Use their palette, typography, spacing, focus, and restrained geometry for project content. Do not add charts, Finder columns, ledger features, hero bands, or navigation merely because an asset mentions them.
- When assets conflict internally, use the target implementation for behavior and the user's selected direction for appearance. State an unresolved visual conflict before changing that decision.

## Provenance and identical files

assets/sources.json records original locations, snapshot time, and SHA-256 values. Read bundled copies at runtime. Original paths are refresh metadata only.

Identical checksums mean identical text, not interchangeable style identities. Select by style and provenance, not a document's historical name. Read the selected copy once; do not load an unrelated style or its companion because its DESIGN.md matches. Honor an explicitly requested cross-style combination, but state which source owns each rule.

To refresh snapshots, copy the named source files byte-for-byte and update their manifest checksums and capture time. If a source is unavailable, retain the existing snapshot and report it. Do not rewrite source content to resolve design conflicts.

## Example

Request: “Create a borderless HTML project landing page with my avatar and three ghost links.”

- Task: HTML page; read references/html-pages.md.
- Style: project-info; read assets/styles/project-info/DESIGN.md.
- Overrides: no decorative borders; ghost links instead of filled actions.
- Scope: avatar and three links only. No widget grid, chart, finance foundation, or extra feature sections.
- Check: desktop and narrow layouts, keyboard focus, link destinations, and asset loading.
