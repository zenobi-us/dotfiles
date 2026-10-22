# Web design skill scenarios

These are authoring and routing checks, not a UI regression suite. Run the prompts in fresh, stateless model calls. The observed runs used the smol model alias. The routing calls have no tools; they prove source/task selection and scope planning, not filesystem or browser execution by an agent.

## Baseline

Run without the skill. Give the model this request:

```text
Create a borderless HTML landing page with project-info styling. Available assets: assets/styles/project-info/DESIGN.md, assets/styles/project-info/EDITOR-DESIGN.md, assets/styles/widget-grid-dashboard/DESIGN.md, assets/styles/widget-grid-dashboard/UI-FOUNDATION.md. The widget DESIGN.md has the same checksum as project-info/DESIGN.md. Give a brief plan. List exact source paths you would read and UI elements you would build.
```

Observed response, verbatim:

```text
### Brief plan
Review the project-info design guidance, then build a responsive, borderless landing page using its typography, spacing, and visual style. Use whitespace and subtle background changes—not outlines or dividers—to separate content.

### Source paths I would read
- `assets/styles/project-info/DESIGN.md`
- `assets/styles/project-info/EDITOR-DESIGN.md`
- `assets/styles/widget-grid-dashboard/UI-FOUNDATION.md`

I’d skip `assets/styles/widget-grid-dashboard/DESIGN.md` because it has the same checksum as `assets/styles/project-info/DESIGN.md`.

### UI elements I would build
- A compact header with project name and navigation
- A prominent hero with a title, short description, and primary action
- A project overview with key details and metadata
- A visually grouped set of project highlights or features
- A responsive footer with secondary links
```

Failure: the model loaded both project-info sources and the unrelated widget foundation. It also proposed unrequested navigation, hero, feature, and footer content. The selected-source and scope rules address these failures.

## Scenario matrix

Load SKILL.md and references/style-selection.md as the routing context. Keep asset contents out of these routing tests. Ask for a plan, not implementation, when filesystem access is unavailable.

| Case | Request | Task route | Expected style assets |
| --- | --- | --- | --- |
| baseline-retest | Create a borderless HTML landing page with project-info styling. Available assets: assets/styles/project-info/DESIGN.md, assets/styles/project-info/EDITOR-DESIGN.md, assets/styles/widget-grid-dashboard/DESIGN.md, assets/styles/widget-grid-dashboard/UI-FOUNDATION.md. The widget DESIGN.md has the same checksum as project-info/DESIGN.md. Give a brief plan. List exact source paths you would read and UI elements you would build. | html-pages | assets/styles/project-info/DESIGN.md |
| react-widgets | Add a widget dashboard page to an existing React app that uses Radix and Tailwind v4. Use widget-grid-dashboard. Preserve current widget data and save behavior. Return a concise plan with exact reference and asset paths. | react-pages | assets/styles/widget-grid-dashboard/DESIGN.md, assets/styles/widget-grid-dashboard/UI-FOUNDATION.md |
| theme-report | Apply the report-dashboard theme to an existing report archive. Change styling only; preserve chart data, filters, and report selection. Return a concise plan with exact reference and asset paths. | themes | assets/styles/report-dashboard/DESIGN.md |
| system-editor | Write a project-info design-system specification. Do not implement components. Use the Neovim reference as primary. Return a concise plan with exact reference and asset paths. | design-systems | assets/styles/project-info/EDITOR-DESIGN.md |
| duplicate-source | Build a project-info React page from the Dotfiles reference. The widget-grid-dashboard DESIGN.md has identical bytes. Should that cause you to load its UI-FOUNDATION.md too? Explain your source and task choices briefly. | react-pages | assets/styles/project-info/DESIGN.md |
| offline-assets | Create a plain HTML report-dashboard page. The original sibling repositories are unavailable and source frontmatter names the Margin dashboard. Explain which files are required at runtime and whether you need the original apps. | html-pages | assets/styles/report-dashboard/DESIGN.md |

For each case, require a structured decision with task, style, taskReference, assets, scope, requiresOriginalRepositories, and addsUnrequestedFeatures. List only assets selected for reading, not excluded alternatives. Check that the task route matches, the selected style-asset set is exact, the original repositories are not required, and the scope adds no unrequested features.

## Refactor findings

| Observed failure | Response excerpt | Correction |
| --- | --- | --- |
| Dotfiles source confused with editor source | “I would load `EDITOR-DESIGN.md` if that is the Dotfiles reference you mean—not the widget-dashboard companion.” | Explicitly map Dotfiles to DESIGN.md and Neovim to EDITOR-DESIGN.md. |
| Explanation request became a fabricated dashboard | “Runtime requirements are just the standalone HTML file and a modern browser: the CSS, sample report data, and filtering/drill-down behavior are embedded in the file.” | Require reading the chosen asset before implementation. Return the requested plan or explanation instead of generating a page. |

Red flags: an unrelated companion loaded because checksums match; original repository paths treated as runtime dependencies; a Neovim asset selected for an explicit Dotfiles request; implementation or a token claim made without the selected source; application behavior replaced during a theme-only change.

## Final routing results

All six cases passed the assertions above on 2026-10-22. The exact structured decisions are retained below. A different model can vary its prose; compare source selection, task choice, and behavior boundaries rather than wording.

```json
[
  {
    "id": "baseline-retest",
    "decision": {
      "task": "Provide a brief plan for a borderless HTML landing page, without generating page code.",
      "style": "project-info (Dotfiles DESIGN.md), with borderless layout as an explicit override",
      "taskReference": "references/html-pages.md",
      "assets": [
        "assets/sources.json",
        "assets/styles/project-info/DESIGN.md",
        "references/html-pages.md"
      ],
      "scope": "State exact source paths to read and list the UI elements to build for the landing page. Do not implement or generate code.",
      "requiresOriginalRepositories": false,
      "addsUnrequestedFeatures": false
    }
  },
  {
    "id": "react-widgets",
    "decision": {
      "task": "Concise plan for adding a widget dashboard page to an existing React app using Radix and Tailwind v4; no page code.",
      "style": "widget-grid-dashboard",
      "taskReference": "references/react-pages.md; references/style-selection.md; references/verification.md",
      "assets": [
        "assets/sources.json",
        "assets/styles/widget-grid-dashboard/DESIGN.md",
        "assets/styles/widget-grid-dashboard/UI-FOUNDATION.md"
      ],
      "scope": "Routing decision only. Preserve existing widget data, save behavior, and app architecture; no implementation. Read selected style sources and task references, then plan verification of the actual changed surface.",
      "requiresOriginalRepositories": false,
      "addsUnrequestedFeatures": false
    }
  },
  {
    "id": "theme-report",
    "decision": {
      "task": "Apply report-dashboard theme to an existing report archive; styling-only change preserving chart data, filters, and report selection. Return a concise plan, no page code.",
      "style": "report-dashboard",
      "taskReference": "references/themes.md (styling-only theme request); references/verification.md",
      "assets": [
        "assets/sources.json",
        "assets/styles/report-dashboard/DESIGN.md"
      ],
      "scope": "Existing report archive styling only. Preserve architecture, chart data, filters, and report selection; do not add features or generate page code.",
      "requiresOriginalRepositories": false,
      "addsUnrequestedFeatures": false
    }
  },
  {
    "id": "system-editor",
    "decision": {
      "task": "Design-system specification (no component implementation)",
      "style": "project-info — Neovim reference primary",
      "taskReference": "references/design-systems.md",
      "assets": [
        "assets/sources.json",
        "assets/styles/project-info/EDITOR-DESIGN.md"
      ],
      "scope": "Concise plan only; specify project-info design tokens and component contracts without generating page code or implementing components. Use the Neovim reference as the primary visual source.",
      "requiresOriginalRepositories": false,
      "addsUnrequestedFeatures": false
    }
  },
  {
    "id": "duplicate-source",
    "decision": {
      "task": "Build a project-info React page; provide routing decision only and do not generate code.",
      "style": "project-info (Dotfiles reference)",
      "taskReference": "react-pages",
      "assets": [
        "references/style-selection.md",
        "assets/sources.json",
        "references/react-pages.md",
        "assets/styles/project-info/DESIGN.md"
      ],
      "scope": "Select the React page task and project-info style independently. The requested Dotfiles source is authoritative. Identical bytes in widget-grid-dashboard DESIGN.md do not make that style applicable and do not warrant loading its UI-FOUNDATION.md. No page implementation in this response.",
      "requiresOriginalRepositories": false,
      "addsUnrequestedFeatures": false
    }
  },
  {
    "id": "offline-assets",
    "decision": {
      "task": "Plain HTML report-dashboard page; provide routing decision only, with no page code.",
      "style": "report-dashboard, selected from the report archive/filter/result-inspection surface; apply only to requested page and no Margin app features inferred from frontmatter.",
      "taskReference": "references/html-pages.md",
      "assets": [
        "assets/sources.json",
        "assets/styles/report-dashboard/DESIGN.md"
      ],
      "scope": "Routing decision and runtime-file/original-repository requirement only. The original sibling repositories are unavailable; use bundled style assets and do not generate implementation.",
      "requiresOriginalRepositories": false,
      "addsUnrequestedFeatures": false
    }
  }
]
```

## Application smoke

Supply the exact contents of SKILL.md, style-selection.md, html-pages.md, verification.md, assets/sources.json, and project-info/DESIGN.md with explicit file labels. These supplied file contents count as already-read references. Run this request in a fresh model call:

```text
Apply the supplied skill to this request: create one borderless HTML project-info landing page with title Example tools and exactly three ghost links to https://zenobi-us.github.io/lazyvim.profile/, https://zenobi-us.github.io/dotfiles/, and https://zenobi-us.github.io/bazzite-workstation/. No hero illustration, header navigation, avatar, footer, or other sections. No font binary is available, so use the documented monospace fallback without remote requests. Return only the complete HTML, with inline CSS and no JavaScript. This is an isolated browser smoke fixture, not production deployment; the caller will perform browser verification.
```

Serve the generated HTML from a temporary directory. Verify it in a browser and remove the fixture afterward. Observed on 2026-10-22:

- Title and heading: Example tools.
- Body background: rgb(25, 21, 33), matching the selected source.
- Exactly the three requested destination links.
- No decorative borders, header, footer, or added application sections.
- First link reached by Tab with a visible solid focus outline.
- At 390px viewport width, document scroll width remained 390px.
- No browser errors recorded.

The generated page used the documented monospace fallback. No bundled font binary was claimed or required. Destination availability is independent of this fixture: the Bazzite Pages URL was already known to be unpublished.

## Deployment checklist

- Router metadata uses only name and description, with a discoverable third-person description.
- Task and style decisions are separate. Each task reference has one purpose and a router pointer.
- The source-selection reference owns precedence, provenance, identical-file handling, and one complete example.
- The five assets remain byte-identical to their sources. sources.json records locations, capture time, and SHA-256 values.
- Existing creator directory discovery remains in use; the explicit Claude skill list includes web-design.
- The creator plugin and marketplace versions agree.
- No extra templates, runtime scripts, domain features, or source rewrites were introduced.
