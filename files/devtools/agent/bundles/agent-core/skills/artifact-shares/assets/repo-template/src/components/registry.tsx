/*!
 * The share type registry.
 *
 * `.types` at the repository root holds one `<hash>=<kind>` line per share.
 * That file is the filesystem record of a share's type. The registry turns a
 * kind into the things the site needs:
 *
 *   kindFor(kind)     the badge shown by <ShareMeta>          (./kinds.ts)
 *   rendererFor(kind) the row component <FileTree> draws with (./renderers.ts)
 *
 * To add a kind:
 *   1. Add an entry to `shareKinds` in `./kinds.ts`.
 *   2. Add a renderer to `fileRenderers` in `./renderers.ts`, but only when
 *      the default row is wrong for it.
 *   3. Teach the `share` command the kind. See the skill's references/types.md.
 */

import { FileLink } from "./FileLink";
import { FileTree } from "./FileTree";
import { Figure, Gallery } from "./Gallery";
import { ShareMeta } from "./ShareMeta";
import { Timeline } from "./Timeline";

export { DEFAULT_KIND, isKnownKind, kindFor, shareKinds } from "./kinds";
export type { KindEntry } from "./kinds";
export { fileRenderers, rendererFor } from "./renderers";
export type { FileRenderer } from "./renderers";

/** Every component the generated MDX is allowed to name. */
export const mdxComponents = {
  ShareMeta,
  FileTree,
  Gallery,
  Figure,
  FileLink,
  Timeline,
};
