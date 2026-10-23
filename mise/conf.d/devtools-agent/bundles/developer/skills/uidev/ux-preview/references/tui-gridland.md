# Gridland TUI Browser Preview

Use this reference after `tui-framework-compatibility.md`. Gridland is the default preview renderer, not a required production framework. Keep the comparison report in HTML.

## 1. Record the boundary

Record the production framework, version, host, and integration point. Record Gridland and its exact version separately. Generate options only from supported target capabilities.

Use independent evidence fields for each option:

```yaml
preview:
  renderer: gridland
  version: "<installed exact version>"
  browser_verification: passed | failed | not-run
target:
  framework: "<production framework>"
  version: "<detected version>"
  integration: "<host integration point>"
  compatibility: supported | constrained | unverified
  runtime_verification: passed | failed | not-run
```

Browser success does not grant target compatibility. Gridland support does not prove support in Pi TUI, Ratatui, or another host. Apply the status vocabulary from `scenario-tui-display.md` alongside these evidence fields.

## 2. Set up the preview

Create a small React/Vite app in a temporary or requested directory. Reuse an existing suitable preview app when available. Use ESM (`"type": "module"` in `package.json`). Pin direct dependencies and keep the package-manager lockfile.

Consult the official installation guide and installed package metadata for compatible React, reconciler, and OpenTUI dependencies. Do not assume that similarly named OpenTUI packages have interchangeable APIs.

Configure the public Vite plugin:

```ts
import { defineConfig } from "vite"
import { gridlandWebPlugin } from "@gridland/web/vite-plugin"

export default defineConfig({
  plugins: [...gridlandWebPlugin()],
})
```

For TypeScript, include `@gridland/web/jsx` declarations. Import `TUI` from `@gridland/web`. Use portable keyboard and dimension hooks from `@gridland/utils`. Add registry components only when an option needs them. Do not copy the entire component library or build a renderer abstraction.

## 3. Compose the report

Keep headings, option tabs, comparison controls, evidence, and recommendation in semantic HTML. Render each terminal option inside `TUI`, using terminal primitives such as `box` and `text` rather than DOM elements inside the terminal tree.

Use `autoFocus={false}` so mounting panels does not steal report focus. Provide an explicit way to enter the active preview. Document and implement an exit shortcut that returns focus to a report control. Scope keyboard handlers to the active preview; hidden options must not consume keys. Check cleanup when changing options.

Use deterministic sample data and explicit states. Share comparison inputs across options: columns, rows, character set, color mode, content, and scenario state. Preserve each option's selection and recovery behavior when resizing, unless reset is the deliberate behavior under comparison.

Provide a readable representation of the current screen and available actions outside the canvas. Update it after keyboard actions, state transitions, and resizing. Static SSR text alone does not describe later interactive states or prove accessibility. Verify report navigation and canvas focus transfer independently.

## 4. Apply terminal constraints

Treat columns and rows as logical dimensions, not CSS scale factors. Inspect the pinned version's public API and font metrics. Size the `TUI` container accordingly, then confirm the resulting dimensions through `useTerminalDimensions`. Display the measured dimensions in the report. Check them again after resizing and font loading.

`fallbackCols` and `fallbackRows` configure SSR fallback dimensions, not the live browser grid. A one-time `onReady` resize can be overwritten by automatic container resizing. Do not use either as proof of fixed live dimensions.

Implement ASCII and monochrome variants explicitly. A single-line border style can still use Unicode. Replace unsupported characters and borders, and preserve focus and selection without color. Mode controls simulate constraints; they do not prove target-terminal capability detection.

Keep foreground and background contrast explicit. A transparent canvas can make otherwise valid terminal text invisible against the report background.

## 5. Record renderer limitations

Use public exports. Browser-renderer internals are not stable integration points. Compare required browser behavior with the pinned package and current official docs.

Browser clipboard, file-drop, pointer events, font metrics, and key routing are not evidence of terminal support. For example, the documented browser syntax-style shim returns no highlighting; do not claim syntax-highlighting parity without evidence.

If Gridland cannot represent a required behavior, disclose the limitation. A labelled static sketch is allowed only when it still answers the decision question. Mark the affected behavior unverified and the sketch static. If the missing behavior prevents the decision, report that blocker rather than silently switching renderers or claiming completion.

## 6. Verify and serve

Before handoff:

- Render the exact requested option count at every requested logical terminal size.
- Exercise each option's keyboard selection and relevant state paths, including error, retry, cancel, and recovery.
- Verify entry into and exit from the terminal preview, option switching, focus restoration, and handler cleanup.
- Check ASCII and monochrome alignment, long labels, wide glyphs, and narrow-layout behavior.
- Confirm that comparison controls update the canvas and readable state together.
- Inspect the actual canvas visually. DOM snapshots alone cannot prove it rendered.
- Check browser console errors and asset-loading failures.
- Record browser results independently from target compatibility and runtime results.

Build the app and serve only the output directory using the shared fixed-port serving rule. Bundle runtime assets locally. Retain source files, exact versions, and the lockfile for reproduction. Return the URL, PID, renderer version, exercised checks, and known gaps.

When the target is Gridland, reuse the terminal component tree with `@gridland/bun` for runtime verification when requested. For other targets, verify their actual host integration. Only a successful run in that target earns `Runtime-verified`.

## Official references

- [Architecture and runtimes](https://www.gridland.io/docs)
- [Installation](https://www.gridland.io/docs/getting-started/installation)
- [Vite setup](https://www.gridland.io/docs/getting-started/vite)
- [Browser API](https://www.gridland.io/docs/api/gridland-web)
- [Rendering and TUI props](https://www.gridland.io/docs/core-concepts/rendering)
- [Focus and keyboard routing](https://www.gridland.io/docs/interaction/focus)
