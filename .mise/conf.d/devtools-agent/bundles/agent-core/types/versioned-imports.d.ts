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

declare module "turndown@^7.2.4" {
  export * from "turndown";
  export { default } from "turndown";
}

// turndown-plugin-gfm ships no types. It has one job: teach a TurndownService
// about tables, strikethrough, and task lists.
declare module "turndown-plugin-gfm@^1.0.2" {
  export const gfm: (service: unknown) => void;
  export const tables: (service: unknown) => void;
  export const strikethrough: (service: unknown) => void;
  export const taskListItems: (service: unknown) => void;
}

// The unpinned names, for `bun test`, which does not apply `--install=fallback`
// and resolves them from this bundle's node_modules instead.
declare module "turndown-plugin-gfm" {
  export const gfm: (service: unknown) => void;
  export const tables: (service: unknown) => void;
  export const strikethrough: (service: unknown) => void;
  export const taskListItems: (service: unknown) => void;
}
