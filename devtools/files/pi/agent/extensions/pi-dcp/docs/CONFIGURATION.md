# Configuration Guide

Pi-DCP uses [bunfig](https://bunfig.sh) for flexible, type-safe configuration management.

## Configuration Priority

Configuration is loaded in the following priority order (highest to lowest):

1. **CLI Flags** - Override any config value
2. **Project Config** - `./dcp.config.ts` in current working directory
3. **User Config** - `~/.dcprc` in home directory
4. **Default Config** - Built-in defaults

## Configuration File Formats

Bunfig supports multiple configuration file formats:

- **TypeScript**: `dcp.config.ts` (recommended, provides type safety)
- **JavaScript**: `dcp.config.js`
- **JSON**: `dcp.config.json` or `.dcprc.json`
- **TOML**: `dcp.config.toml`
- **YAML**: `dcp.config.yaml`
- **RC File**: `.dcprc` (JSON format)

## Configuration Options

```typescript
export interface DcpConfig {
  // Enable/disable DCP entirely
  enabled: boolean;

  // Enable debug logging
  debug: boolean;

  // Rules to apply (in order)
  rules: Array<string | PruningRule>;

  // Number of recent messages to always keep
  keepRecentCount: number;
}
```

## Example Configurations

### TypeScript (Recommended)

Create `dcp.config.ts`:

```typescript
import type { DcpConfig } from "@pi-dcp/types";

export default {
  enabled: true,
  debug: false,
  rules: [
    "deduplication",
    "superseded-writes",
    "error-purging",
    "recency"
  ],
  keepRecentCount: 10,
} satisfies DcpConfig;
```

### JSON

Create `.dcprc`:

```json
{
  "enabled": true,
  "debug": false,
  "rules": [
    "deduplication",
    "superseded-writes",
    "error-purging",
    "recency"
  ],
  "keepRecentCount": 10
}
```

### TOML

Create `dcp.config.toml`:

```toml
enabled = true
debug = false
rules = ["deduplication", "superseded-writes", "error-purging", "recency"]
keepRecentCount = 10
```

## CLI Flags

Override configuration values with CLI flags:

```bash
# Disable DCP for this session
pi --dcp-enabled=false

# Enable debug logging
pi --dcp-debug=true

# Combine flags
pi --dcp-enabled=true --dcp-debug=true
```

## Runtime Commands

DCP provides commands to adjust configuration during a session:

- `/dcp-toggle` - Enable/disable DCP
- `/dcp-debug` - Toggle debug logging
- `/dcp-recent <number>` - Set number of recent messages to keep
- `/dcp-stats` - Show pruning statistics

## Available Rules

Built-in pruning rules:

1. **deduplication** - Remove duplicate tool outputs
2. **superseded-writes** - Remove older file versions
3. **error-purging** - Remove resolved errors
4. **recency** - Always keep recent messages

Rules are applied in the order specified in the `rules` array.

## Configuration Locations

### Project-Specific

Best for team settings or project requirements:

```bash
# Create in project root
cd /path/to/project
touch dcp.config.ts
```

### User-Wide

Best for personal preferences:

```bash
# Create in home directory
touch ~/.dcprc
```

### Extension Default

The extension includes a default configuration at:
```
devtools/files/pi/agent/extensions/pi-dcp/dcp.config.ts
```

This serves as a fallback and reference example.

## Type Safety

When using TypeScript configuration files, you get:

- Autocomplete for configuration options
- Type checking for values
- IntelliSense documentation
- Compile-time validation

```typescript
import type { DcpConfig } from "@pi-dcp/types";

// Type error if you misspell or use wrong type
export default {
  enabled: "yes", // ❌ Type error: must be boolean
  debugg: true,   // ❌ Type error: unknown property
  rules: [],
  keepRecentCount: -5, // ✅ Type-safe but validation will catch at runtime
} satisfies DcpConfig;
```

## Troubleshooting

### Configuration Not Loading

1. Check file location and naming
2. Ensure valid syntax (JSON/TOML/TypeScript)
3. Enable debug mode: `--dcp-debug=true`
4. Check console for error messages

### Validation Errors

If configuration fails validation, DCP will log the error and disable itself:

```
[pi-dcp] Configuration error: Unknown rule: "typo"
[pi-dcp] Extension disabled due to configuration error
```

### Config File Discovery

DCP searches for config files in this order:

1. Current working directory
2. Home directory
3. Extension directory (default fallback)

Use debug mode to see which config file is loaded:

```bash
pi --dcp-debug=true
```

## Advanced Usage

### Custom Rule Order

Change the order of rules to adjust pruning behavior:

```typescript
export default {
  rules: [
    "recency",           // Protect recent messages first
    "error-purging",     // Then clean up errors
    "deduplication",     // Then deduplicate
    "superseded-writes"  // Finally remove old file versions
  ],
  keepRecentCount: 15,
} satisfies DcpConfig;
```

### Minimal Configuration

Only specify what you want to change from defaults:

```typescript
export default {
  keepRecentCount: 20, // Only override this, use defaults for rest
} satisfies DcpConfig;
```

### Disable Specific Rules

```typescript
export default {
  rules: [
    "deduplication",
    // Omit "superseded-writes" to disable it
    "error-purging",
    "recency"
  ],
} satisfies DcpConfig;
```

## Best Practices

1. **Use TypeScript configs** for type safety
2. **Start with defaults** and adjust based on needs
3. **Use project configs** for team settings
4. **Use user configs** for personal preferences
5. **Test with debug mode** when changing configuration
6. **Monitor with `/dcp-stats`** to see pruning effectiveness
