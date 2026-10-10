/*!
 * Which component draws one file row.
 *
 * This module holds no JSX and imports no tree, so `FileTree` can read it
 * without the cycle that importing the registry back would make.
 */

import type { ComponentType } from "react";
import { FileLink, type FileEntry } from "./FileLink";

export type FileRenderer = ComponentType<{ file: FileEntry; root?: string }>;

/** A kind with no entry here is drawn by `FileLink`. */
export const fileRenderers: Record<string, FileRenderer> = {};

export function rendererFor(kind?: string): FileRenderer {
  return (kind && fileRenderers[kind]) || FileLink;
}
