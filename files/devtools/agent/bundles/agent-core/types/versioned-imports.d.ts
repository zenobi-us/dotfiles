// Scripts import pinned versions inline, e.g. `import { Crust } from
// "@crustjs/core@^0.0.19"`. Bun resolves that specifier at runtime through
// `--install=fallback`. TypeScript cannot, so it is declared here.
//
// This file is types only. Do NOT solve this with tsconfig `paths`: bun reads
// `paths` at runtime too, so a mapping aimed at a `.d.ts` makes bun import the
// declaration file and the script dies with "Export named 'X' not found".
//
// When a script pins a new version, add a line for it here.

declare module "@crustjs/core@^0.0.19" {
  export * from "@crustjs/core";
}

declare module "@crustjs/plugins@^0.1.2" {
  export * from "@crustjs/plugins";
}
