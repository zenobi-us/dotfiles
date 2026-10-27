#!/usr/bin/env -S mise exec -- bun run --install=fallback
/**
 * Kept so that older notes, reports and SKILL.md revisions that name
 * `acceptance.ts` still work. The CLI is browser-evidence.ts; the subcommands
 * and arguments are the same.
 */
await import("./browser-evidence.ts");
