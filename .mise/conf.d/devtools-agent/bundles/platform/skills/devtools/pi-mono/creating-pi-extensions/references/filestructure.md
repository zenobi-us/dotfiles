# Extension File Structure

## Single-File Extension

For simple extensions (< 200 lines):

```
my-extension.ts
```

## Multi-File Extension

For complex extensions with TUI overlays:

```
my-extension/
├── index.ts              # Entry point, command registration
├── types.ts              # Interfaces and type definitions
├── render-helpers.ts     # Reusable TUI rendering functions
├── components/
│   ├── list-view.ts      # List/picker component
│   ├── detail-view.ts    # Detail/edit view
│   └── picker.ts         # Selection overlay
├── services/
│   ├── StoreService.ts   # Data persistence
│   ├── ConfigService.ts  # Uses pi-extension-config
│   └── ApiService.ts     # External API calls
└── core/
    ├── Strings.ts        # String constants, templates
    └── Validators.ts     # Validation logic
```

- **index.ts** - Extension entry point; registers commands and shortcuts
- **types.ts** - TypeScript interfaces for items, state, action results
- **render-helpers.ts** - Reusable functions: `pad()`, `row()`, `renderHeader()`, `renderFooter()`
- **components/** - One file per screen/view for complex overlays
- **services/** - Stateful services for data, config, external APIs
- **core/** - Pure functions, constants, validators (no side effects)

## Data Storage Location

Use XDG-compliant paths:

```
~/.local/share/my-extension/     # User data (XDG_DATA_HOME)
├── config.json                  # Settings
├── data.json                    # Persistent data
└── cache/                       # Temporary files
```

- Store user data in `XDG_DATA_HOME` (defaults to `~/.local/share/`)
- Use `mkdirSync(path, { recursive: true })` to ensure directories exist
- JSON for config files; newline-delimited for simple lists

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Extension file | kebab-case | `ghostty-shaders.ts` |
| Component class | PascalCase | `ShaderPickerComponent` |
| Helper functions | camelCase | `renderHeader()` |
| Type interfaces | PascalCase | `ListState` |
| Constants | UPPER_SNAKE | `VIEWPORT_HEIGHT` |
