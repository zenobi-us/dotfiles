"use client";

/*!
 * A directory of files, grouped by the folder that holds them.
 *
 * Kept from the zeno app:
 *   - one flat grid, headings included, so a badge lines up across the whole
 *     tree rather than only inside its own group
 *   - the root group first, then the rest by name, so a reader meets a
 *     ticket's own notes before its imported sources
 *   - images and video become thumbnails, everything else stays a row
 *   - one viewer across every group, so prev and next cross group boundaries
 *
 * New: a row is drawn by the renderer the registry gives for its `kind`. The
 * `kind` comes from the `.types` file at the repository root, which `share`
 * writes and `bun run validate` checks.
 */

import { useMemo, useState } from "react";
import { Thumb, Viewer } from "./Viewer";
import { rendererFor } from "./renderers";
import { baseName, isMedia, type Slide } from "./media";
import { asset } from "./base";
import type { FileEntry } from "./FileLink";

export type TreeFile = FileEntry & {
  /** Registry key. Absent means the default row renderer. */
  kind?: string;
};

type Group = { name: string; rows: TreeFile[]; shots: Slide[]; total: number };

function groupByDirectory(files: TreeFile[], root?: string): Group[] {
  const groups = new Map<string, TreeFile[]>();

  for (const file of files) {
    const relative = root && file.path.startsWith(`${root}/`)
      ? file.path.slice(root.length + 1)
      : file.path;
    const cut = relative.lastIndexOf("/");
    const name = cut === -1 ? "" : relative.slice(0, cut);
    const bucket = groups.get(name);
    if (bucket) bucket.push(file);
    else groups.set(name, [file]);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => (a === "" ? -1 : b === "" ? 1 : a.localeCompare(b)))
    .map(([name, entries]) => ({
      name,
      rows: entries.filter((file) => !isMedia(file.path)),
      shots: entries
        .filter((file) => isMedia(file.path))
        .map((file) => ({ src: asset(file.path), caption: baseName(file.path) })),
      total: entries.length,
    }));
}

// The needle matches the path and the commit hash. Once the hash is on screen
// a reader will paste it in, so it has to find its own row.
function matches(file: TreeFile, query: string): boolean {
  return (
    file.path.toLowerCase().includes(query) ||
    (file.short ?? "").toLowerCase().includes(query)
  );
}

export function FileTree({ files, root }: { files: TreeFile[]; root?: string }) {
  const [needle, setNeedle] = useState("");
  const [index, setIndex] = useState<number | null>(null);

  const groups = useMemo(() => {
    const query = needle.trim().toLowerCase();
    const visible = query ? files.filter((file) => matches(file, query)) : files;
    return groupByDirectory(visible, root);
  }, [files, needle, root]);

  const slides = useMemo(() => groups.flatMap((group) => group.shots), [groups]);
  const empty = groups.every((group) => group.total === 0);

  let shotOffset = 0;

  return (
    <section className="not-prose my-6 overflow-hidden rounded-panel border border-border bg-surface shadow-panel">
      <div className="flex gap-3 border-b border-border p-3.5">
        <input
          type="search"
          value={needle}
          onChange={(event) => setNeedle(event.target.value)}
          aria-label="Filter files"
          placeholder="Filter files"
          className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-ink focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-accent"
        />
      </div>

      {empty ? (
        <p className="m-0 px-4 py-6 text-ink-muted">No files match filter.</p>
      ) : (
        <div className="grid grid-cols-[1fr_auto_auto] gap-x-3">
          {groups.map((group) => {
            const offset = shotOffset;
            shotOffset += group.shots.length;

            return (
              <div key={group.name} className="col-span-full grid grid-cols-subgrid">
                <h3 className="col-span-full m-0 border-b border-t border-border bg-bg px-4 py-3 font-mono text-[12.5px] font-semibold text-ink-muted first:border-t-0">
                  {group.name || "root"}
                  <span className="ml-2 inline-block rounded-full bg-info-bg px-2 py-0.5 align-middle text-xs font-semibold text-info">
                    {group.total}
                  </span>
                </h3>

                {group.rows.map((file) => {
                  const Row = rendererFor(file.kind);
                  return <Row key={file.path} file={file} root={root} />;
                })}

                {group.shots.length > 0 ? (
                  <div className="col-span-full grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3.5 px-4 py-3.5">
                    {group.shots.map((slide, position) => (
                      <Thumb
                        key={slide.src}
                        slide={slide}
                        onOpen={() => setIndex(offset + position)}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      <Viewer
        slides={slides}
        index={index}
        onIndex={setIndex}
        onClose={() => setIndex(null)}
        hint="Click image to zoom · Esc to close"
      />
    </section>
  );
}
