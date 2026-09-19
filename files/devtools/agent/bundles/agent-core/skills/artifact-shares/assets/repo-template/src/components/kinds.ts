/*!
 * The share kinds this site knows.
 *
 * Plain TypeScript with no React import, so both the site and
 * `scripts/validate-types.ts` can read it.
 *
 * Every `tone` is a whole Tailwind class string. A class built by joining
 * pieces is invisible to Tailwind and produces no CSS.
 */

export type KindEntry = {
  label: string;
  description: string;
  tone: string;
};

export const DEFAULT_KIND = "artifact";

export const shareKinds: Record<string, KindEntry> = {
  session: {
    label: "session",
    description: "An agent session export, converted to MDX.",
    tone: "bg-info-bg text-info",
  },
  doc: {
    label: "doc",
    description: "A hand-written Markdown or MDX document.",
    tone: "bg-pass-bg text-pass",
  },
  [DEFAULT_KIND]: {
    label: "artifact",
    description: "Anything with no more specific kind.",
    tone: "bg-warn-bg text-warn",
  },
};

export function kindFor(kind?: string): KindEntry {
  return (kind && shareKinds[kind]) || shareKinds[DEFAULT_KIND]!;
}

export function isKnownKind(kind: string): boolean {
  return Object.hasOwn(shareKinds, kind);
}
