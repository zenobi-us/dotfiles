# Single-file Bun CLI with mise

Use this pattern for a small, standalone TypeScript CLI. The user should be able to save one executable file and run it without first creating a project or running a package-manager install command.

## Shebang

Start the file with a mise shebang that selects Bun and forwards the script path and arguments:

```ts
#!/usr/bin/env -S mise x -- bun --install=fallback

import { someFunction } from "some-package";

// CLI implementation
```

Make the file executable (`chmod +x my-cli.ts`), then invoke it directly (`./my-cli.ts`). The `--` separates mise options from the command. `bun --install=fallback` lets Bun resolve and fetch missing imported packages when the script runs, without a prior `npm install`, `bun install`, or `pnpm install`.

## Requirements

- Keep the entry point self-contained in one `.ts` or `.js` file. Do not require `package.json`, a lockfile, or a project-local `node_modules` directory.
- Use normal package imports; Bun fallback mode handles missing dependencies. Do not add install/bootstrap instructions or invoke a package manager as a setup step.
- Keep the shebang as the first line. Do not put a BOM or content before it.
- Explain that first-run dependency resolution needs network access and may take longer; later runs use Bun's cache.
- Use only dependencies needed by this CLI. If no external packages are needed, omit `--install=fallback` and imports altogether.

## Validate the invocation

Check the shebang against the installed mise and Bun versions and run the executable from a directory outside any project. Confirm that arguments reach the script and that a missing package is resolved on first run without a separate install command.
