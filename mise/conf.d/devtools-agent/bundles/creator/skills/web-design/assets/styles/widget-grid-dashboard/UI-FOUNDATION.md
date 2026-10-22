# Ledger UI foundation

## Visual system

The production app uses the approved compact design studies as its visual reference. Existing editor, report, dashboard, and persistence behavior remains unchanged.

- JetBrains Mono weights 400 and 500 are bundled in `src/assets/fonts/` with their OFL license. The app makes no external font requests.
- Interface text is 13px. Section labels are 10px, uppercase, with 0.1em tracking. The 16px rem baseline preserves the existing 4px spacing scale.
- Controls and panels use square corners, one-pixel borders, and no decorative shadows or blur. Focus rings remain visible.
- The header uses flush navigation dividers. Desktop navigation scrolls within the header. Mobile navigation retains its modal sheet. The Theme selector is in Settings under Appearance.
- The header identity uses study option 21, Journal brackets: a 20px text-record mark beside lowercase `ledger`, separated by 8px. The icon inherits the primary colour; the home link retains its accessible name.
- Settings appears directly below Ledger in the workspace drawer, not in desktop or mobile header navigation. Its `/settings` route remains unchanged.
- Without a workspace, the initial view fills the content area with a centered `OnboardingCard`: folder icon, title, subtitle, and folder-opening action. The workspace drawer trigger appears only after a project is loaded.
- A missing dashboard selected by URL uses `OnboardingCard` with a dashboard icon, title, and description. Its actions list every available dashboard by title, followed by a separator and Settings linking to dashboard settings. With no available dashboards, only Settings appears.
- The app defaults to Rose Pine. `src/services/theme.ts` defines the 20 theme choices, restores `ledger-theme`, and applies `data-theme`, `.dark`, and native `color-scheme` together.
- Vite generates a synchronous head initializer from that catalog. It restores the saved theme before application modules load.
- `src/styles.css` imports the copied palettes and maps shared component, chart, activity, and editor roles to semantic tokens. Light themes also update editor syntax and caret colors.
- Monoslate uses `#999999` for muted text. It measures 5.31:1 against cards and 4.63:1 against muted controls.
- Activity cells have fixed 36px desktop targets and 44px coarse-pointer targets. Narrow containers scroll the calendar locally.

Start the application on a fixed local port:

```sh
bun run dev -- --host 127.0.0.1 --port 4275 --strictPort
```

The design studies share the production theme catalog and font assets. Their fixture journals and simulation controls do not enter application routes.

The identity comparison at `demos/identity.html` contains 40 custom icon-and-`ledger` lockups, actual-size header placement, light/dark surfaces, and a narrow-header control. Run `bunx vite --config demos/vite.config.ts --port 4276 --strictPort` from this package and open `http://127.0.0.1:4276/identity.html`. Numbered selections are shareable through the URL fragment; they do not change production branding.

## Component layers

- `src/components/ui/` contains the official shadcn primitives and the existing calendar controls.
- `src/components/ledger-ui/variants.ts` contains shared button, navigation link, status, and icon control variants.
- `AppHeader` and `WorkspaceDrawer` compose the shell controls.
- `src/styles.css` defines semantic surface, state, sidebar, chart, and activity tokens.

The application uses the `new-york` style, Radix primitives, Lucide icons, and Tailwind CSS v4. `components.json` defines the aliases. Keep application colors in semantic tokens.

The shared CodeMirror editor is a host-neutral boundary. It consumes the `--ledger-editor-*` semantic custom properties supplied by the host instead of importing application tokens or hard-coding a palette. Hosts embedding `@rustledger/editor` MUST define those properties.

The existing Button, Badge, Card, Breadcrumb, and Calendar APIs remain compatible. Button supports `asChild` for router links and drawer triggers. Calendar retains React Day Picker v10 behavior. The date range control remains unchanged. It does not filter view data.

## Component updates

Run the shadcn CLI from this package. Review each generated diff before replacement. Do not overwrite the existing calendar controls without browser tests.

```sh
bunx shadcn@latest add <component>
```

Application compositions use `tailwind-variants`. The registry primitives retain their upstream variant helper where applicable. Keep application colors in semantic tokens.

## Explicit prop access

Name each component's props parameter `props`. Read values through their full
path, such as `props.thing.header.title`. Do not destructure props in parameters
or function bodies. Do not assign props or nested prop values to local aliases.
Keep optional chaining and default values at the point of use.

```tsx
function Foo(props: PropsWithChildren<FooProps>) {
  return <div>{props.thing.header.title}{props.children}</div>;
}
```

Use `PropsWithChildren` only when the component accepts children. Derived
calculations and hook return tuples remain allowed.

Object destructuring is prohibited throughout `src`, not just in components.
Use named objects and explicit property access for hook results, parameters,
assignments, and loop bindings. Array/tuple destructuring remains allowed,
including React state tuples and Map entries. Nested object patterns inside
arrays are still prohibited.

```tsx
const querystring = useSearch({ from: "__root__" });
const account = querystring.account;
```

`finance/no-object-destructuring` reports every object binding pattern without
an automatic fix. Its real-Oxlint regression cases run with
`bun test tests/no-object-destructuring.test.ts`.

When replacing rest destructuring, preserve the forwarding contract. Explicitly
forward native props or spread `omitProps(props, ["consumedProp"])` from
`src/lib/utils.ts` directly. List every key excluded by the original rest
pattern, including `className`, `children`, and refs when consumed separately.
The helper preserves discriminated prop unions and does not mutate its input.
Do not forward consumed custom props to DOM elements. Preserve undefined-only
defaults; use `??` only when `null` should also select the fallback.

`finance/explicit-prop-access` enforces this policy in the existing Oxlint
pipeline. It uses the installed React plugin's component detection and
scope resolution, including component props captured by closures. The rule has
no automatic fix because alias removal can change evaluation timing and defaults.
The regression cases run the actual Oxlint executable:

```sh
bun test tests/explicit-prop-access.test.ts
```


## Shell behavior

Desktop navigation remains visible from 1024px. Smaller screens use a Radix navigation sheet. Workspace uses a left-opening Vaul Drawer at all screen sizes, inset 12px from the top, bottom, and left window edges with a border on every side. It has an explicit Close button, Escape dismissal, backdrop dismissal, and focus return to the workspace trigger.

Navigation selection closes its sheet. When the viewport expands to desktop, the navigation sheet closes and focus returns to the brand link.

Without an open workspace, the header hides Add dashboard (+) in desktop and mobile navigation and hides the date range picker. Settings keeps Appearance and Engine available. Storage and Dashboards explain that a Ledger Project must be opened or created first. Opening or importing a journal restores the header controls and enables the Storage and Dashboards section controls; closing it hides the header controls and restores the section prerequisite messages.

These are reversible ticket 01 choices. They do not resolve the drawer contract in ticket 11 or the shell state contract in ticket 10.

Workspace shows the loaded folder name, storage status, and Save control without listing individual files or marking the entry point. File-only imports retain their project display name. It opens a native directory when the browser supports directory access. Other browsers use folder import. Users can also import individual files. The existing project store owns persistence. File import detaches the previous directory handle before it replaces the project. Imported files cannot use the previous folder as a save destination.

## Checks

Run `bun install --frozen-lockfile` from the repository root. Then run the
package checks from `pkgs/ledger-app`:

```sh
bun run typecheck
bun run lint
bun run test:ui
bun run build
bunx playwright install chromium
E2E_PORT=18473 bun run test:e2e e2e/shell.spec.ts --workers=2
E2E_PORT=18473 bun run test:e2e --workers=4
```

Use a free port. Playwright refuses to reuse an existing server by default. To test an explicitly managed server, set `E2E_BASE_URL` instead.

The shell tests use isolated browser contexts. The native-directory test substitutes the browser's origin-private directory for the operating-system picker. It tests real file reads and writes, but not the operating-system permission dialog.

The focused primitive tests cover Progress accessibility and Item list semantics. These unused primitives have no route-level test surface.

The browser suite covers workspace gating, editor operations, date filtering, responsive controls, and guarded dashboard saves.

## Dashboard canvas

All Dashboard pages use `DashboardGrid`. Read mode uses semantic articles and native touch scrolling. It derives 12, 6, or 1 columns at container widths of 1200px and 768px. These derived layouts never change source.

Empty dashboards fill the available content height and width with a centered, borderless `OnboardingCard`. Its compound `Icon`, `Title`, `Subtitle`, and `Actions` parts provide reusable onboarding content. Add widget starts the existing dashboard draft and focuses the widget picker; in edit mode the same action focuses and opens the native picker when supported. Selecting a widget still opens its settings modal, and saving remains explicit.

Use the app navbar to switch dashboards or its + control to create one. Dashboard pages do not repeat navigation or creation controls. Select Edit dashboard at the top right to start a draft, edit the page title in place, and reveal widget edit, move, and resize controls. Save changes appears only when the draft differs from the saved dashboard. Add widget is a dropdown of supported widgets; selecting Cash flow adds it to the draft and immediately opens its configuration modal. Dashboard settings opens the advanced dashboard and header controls in a separate modal. Select Edit widget to configure an existing widget. The modal provides title, numeric placement, date range, order, and removal controls. Other package settings remain unchanged. Done, Close, Escape, and backdrop dismissal retain draft edits without writing Ledger Files. Cancel discards the entire draft. Removal returns focus to Add widget; other dismissals return focus to the invoking widget.

Edit mode uses Snapgrid 0.10.0 and a canonical 12-column canvas with 36px rows, 16px gaps, zero padding, and vertical compaction. The edit canvas fits the available page width, including on narrow screens, without an outer scroll container. Widget contents retain their own scrolling. Drag only the header handle, or resize with the corner handle. Widget data controls and Edit buttons are separate targets. Numeric controls remain available in the modal. Empty rows compact upward.

Only committed layout callbacks change the draft. The full layout includes collision-displaced widgets. `commitDashboardLayout` matches placement IDs, normalizes geometry with the existing packer, and assigns deterministic spatial order. Widget, placement, and Dashboard IDs remain stable.

Save changes validates the draft and uses the existing source-aware mutation plan and DashboardOperation. It saves to the journal folder for a folder-backed Ledger Project, or browser storage otherwise. The operation and base Revision are captured when editing starts. Journal switches, stale Revisions, concurrent saves, directory ownership, and recovery guards remain active. A failed save retains the draft and displays the error. Normal saves preserve unrelated directives, comments, formatting, and unknown package settings. Schema version 1 is unchanged.

Settings use an owner-specific type hierarchy in `services/dashboard-metadata.ts`. `DashboardBaseSetting` defines the shared record fields. `DashboardGridBaseSetting` adds `ownerType: "dashboard"` and is the element type of `Dashboard.settings`. `DashboardWidgetBaseSetting` adds `ownerType: "widget"` and is the element type of `DashboardWidget.settings`. The parser narrows validated records to these branches. Editors retain the corresponding owner type. This split changes TypeScript ownership constraints only; the persisted schema remains version 1 with the same fields and values.

Focused canvas checks: `bun test tests/dashboard-layout.test.ts` and `bunx playwright test e2e/dashboard-canvas.spec.ts e2e/dashboard-management.spec.ts e2e/dashboard-metadata.spec.ts`. Set `DASHBOARD_EVIDENCE_DIR` to capture real browser screenshots from these scenarios.

### Journal timeline Widget

The ordinary Widget editor configures `airtonix.reports/journal-timeline`.
Its package-owned JSON `config` supports an optional positive safe integer `limit`
and optional boolean `footer`. Entry limit is blank for unlimited entries.
Show entry counts and journal link enables the footer. Both options use the
existing Dashboard draft, source-preserving save, and reload path.
Invalid limits are rejected; invalid persisted options show a Diagnostic
without losing their source through unrelated edits.

The timeline filters dates inclusively, uses its shared deterministic date/time/ID
order, then limits entries before grouping. The footer shows displayed and full
matching counts and links View journal to `/ledger`. The matching total and
running net movement use the full filtered range. Group totals describe visible
entries. Summary Widgets keep their existing calculations. Without either
option, existing timeline grouping, disclosure, and unlimited presentation remain
unchanged. Appearance presets and reset retain these selection options.

### Accounts widget

Add widget includes Accounts (`airtonix.reports/accounts`) with an initial
4 × 10 placement. The existing modal provides Expand accounts by default,
enabled by default, alongside shared appearance and placement controls.
Its optional JSON config accepts only the boolean `defaultExpanded` field.
There is no date selector: declared accounts and every posting account from
the entry point's included files form the catalog, including unused and closed
declared accounts. Invalid config displays a diagnostic and survives unrelated
title, appearance, and placement edits.

The account hierarchy follows the shadcn File Tree pattern using the existing
Radix Collapsible `asChild` API and Button. Folder disclosure and real account
selection are separate keyboard-accessible controls; synthetic ancestors only
disclose. The nested lists use semantic theme tokens and local scrolling.
Selecting an account updates the current URL's `account` query parameter without
leaving the dashboard, resetting scroll, or dropping other query parameters.
The root route validates the optional `account` string and retains it across
router links, redirects, and programmatic navigation. Journal timeline widgets
and the Ledger journal index read the root querystring and match that exact
account on any posting, not descendants. Existing date and text filters still
apply. Clear account filter explicitly removes the shared value; it stays
cleared on subsequent navigation. Loading and error states cannot publish a
previous source's tree after a journal switch.

### Summary widgets

Add widget includes four individual summary widgets: Entries (`entry-count`), Income (`income`), Expenses (`expenses`), and Net movement (`net-movement`), under `airtonix.reports`. Their calculations share `services/ledger-summary.ts` with the home-page cards. Income sums entries whose first posting account starts with `Assets`; expenses sums those starting with `Expenses`; net movement is income less expenses. Money retains the home page's AUD formatting.

Each summary widget defaults to the current global date range. Its settings also offer This month, This week (Monday–Sunday), and Specific date range with inclusive start and end dates. Calendar presets use the current local date, not the latest journal entry or global range. Custom ranges are independent of the global range. The widget stores `range` as a string and optional `from` and `to` values as date settings. Invalid or incomplete custom ranges display a diagnostic. Configuration and placement use the existing dashboard save operation and survive reload.

### Metric layout widgets

Add widget also offers the retained layouts 01, 02, 03, 07, 08, 09, 11, 12,
and 13 under Metric layouts. They use the type IDs `metric-01` through
`metric-13` for those retained numbers in `airtonix.reports`.
Each layout accepts the same source-neutral `WidgetDataContext`.

Metric source selects Entries, Income, Expenses, or Net movement. The date
settings use the summary widget range contract. Money shows explicit AUD units
and two decimal places. An empty range shows no-data text for money and zero
for entry count. Existing entries with a zero total still show a numeric zero.
The adapter does not invent portfolio returns, goals, or source timestamps.

Metric layouts own their title and info control, so the grid does not repeat
their read-mode header. The existing dashboard modal configures every layout.
Layouts 11, 12, and 13 reveal their edit overlay on hover or keyboard focus
while editing; coarse pointers retain a visible edit control. Drag handles,
corner resizing, numeric placement, draft guards, and schema-version-1 saving
remain grid-owned. Configuration, custom titles, and placement survive reload.

See `src/components/widgets/README.md` for the data and presentation boundary.

## Design studies

The isolated `demos/` preview uses the copied theme files and local JetBrains Mono fonts. It does not change the application styles.

From `pkgs/ledger-app`, start the preview:

```sh
bunx vite --config demos/vite.config.ts
```

Open `http://127.0.0.1:4274/`. The server uses a fixed port and refuses to switch ports automatically.

The three studies are Journal explorer (`#journal`), Report workbench (`#reports`), and Dashboard editor (`#dashboard`). Each study provides populated, empty, and unavailable states. All 20 copied themes are selectable.

The journal supports combined account, search, and date filters, with adjacent transaction and source inspectors. Reports derive account balances from the same sample entries.

The dashboard study follows task 07's selected canvas-and-modal design. It reuses `AppShell`, `DashboardGrid`, `DashboardEditor`, `RegisteredWidget`, and `DashboardOperation`. It stores a separate browser-backed sample journal on the preview origin. Saves use source-aware metadata plans and survive reload. No disk files change.

Read-mode Edit widget starts a dashboard draft and opens the invoking widget's modal. Done, Close, Escape, and outside dismissal retain draft edits. Dashboard Cancel discards the entire draft. The modal provides title, numeric placement, range, ordering, and removal controls. Drag and resize commit the complete canonical layout.

On narrow screens, the study scrolls a minimum 900px editing canvas internally. Read mode uses the production 12-, 6-, and 1-column layouts. The modal fits the viewport and scrolls internally.

The sample includes operating transactions, an unavailable widget, a comment, and an unknown package setting. The source inspector shows persisted metadata, not the draft. The failure checkbox simulates a save error and retains the draft. The study refuses to replace a different journal on its origin. It does not demonstrate folder-backed saving.

Check the study and application types with `bunx tsc --noEmit --project demos/tsconfig.json`.

`DESIGN.md` remains an unchanged copy of the source dashboard contract. Its benchmark-specific references describe the source, not implemented finance behavior.

## Shared Preparation Activities

The Dashboard exposes **Preparation Activities** for `airtonix.tax-preparation`. This manager uses Ledger Project records, not Widget settings. It supports employment, business, investments, and property. It does not register the later tax Widgets or calculate tax.

- **Explicit setup:** Include `tax-preparation.beancount` exactly once, directly relative to the Entry Point. Require the singleton version-1 schema header. Loading the Dashboard creates no files, includes, accounts, or commodities.
- **Existing source:** Validate an existing carrier before inclusion. Preserve its bytes and compatible declarations. Activity edits replace only changed field tokens and append new activity records. Preserve unknown outside-namespace records, comments, BOM, and line endings.
- **Shared draft:** `AppShell` owns one preparation draft through `usePreparation`. Dashboard copies read that draft. Save and Cancel remain separate from Dashboard layout editing. Cancel does not change unrelated editor drafts.
- **Guarded saves:** Normal activity saves use `commitGuardedSourcePlan`. Content Revisions, verified backups, readback, validation, and guarded rollback remain required. A conflict stops the save without an automatic retry. Pending results do not publish after a project switch.
- **Browser isolation:** Preparation plans use accepted browser source, not the journal editor draft. Acceptance rebases only preparation-owned changes into an unrelated editor draft. It retains the draft recovery and dirty state. A competing edit in a file that preparation must change rejects the save. A browser journal must first have accepted source; preparation does not accept an imported source draft implicitly.
- **Storage modes:** Initial folder-backed setup requires the native host started with `--root`, including explicit inclusion of an existing carrier. Native setup uses exclusive creation and verified recovery. Configured-browser activity saves retain the approved informed backup exception. Application-storage preparation changes remain in the browser and do not write source files on disk.
- **Validation:** `services/preparation.ts` owns discovery, versioned record shapes, compatible internal references, and activity mutation plans. Initial publication waits for current-Revision Rustledger loading and real multi-file journal validation. Pending source is not labelled saved/current. Setup and Save reject parser, loader, and journal errors, including balance assertions, before acceptance. Diagnostics include the source location and error code. Empty preparation records do not imply a completeness problem.
- **Accessible surface:** Desktop uses a right Sheet. Mobile uses a full-width bottom Drawer. The trigger exposes its expanded state and controlled surface. Escape, outside interaction, explicit close, and breakpoint changes use one close path. Closing restores trigger focus and does not cancel an in-flight guarded save. Delayed completion cannot move focus into a closed surface.
- **Accessible controls:** Activity labels and kinds have explicit labels. New activities focus their label. Status text identifies unsaved drafts, saved source, and Diagnostics without color alone.

Activity removal, mappings, Reports, source-ID insertion, review forms, measured entries, and handover remain in their later tickets.
