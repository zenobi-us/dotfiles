/*!
 * One file, linked.
 *
 * The row is a grid subgrid of the tree's three tracks, so a badge lines up
 * with the badge in every other row however wide the name beside it runs.
 */

import { baseName } from "./media";
import { asset } from "./base";

export type FileEntry = {
  /** URL of the file, already prefixed with the site base path. */
  path: string;
  /** Text for the right-hand badge. Defaults to the file extension. */
  label?: string;
  /** Short commit hash. Absent when the file has no commit. */
  short?: string;
  /** Where the commit badge links. */
  commitHref?: string;
};

function extensionLabel(path: string): string {
  const name = baseName(path);
  const cut = name.lastIndexOf(".");
  return cut === -1 ? "file" : name.slice(cut + 1).toLowerCase();
}

export function FileLink({ file, root }: { file: FileEntry; root?: string }) {
  const name = root && file.path.startsWith(`${root}/`)
    ? file.path.slice(root.length + 1)
    : file.path;

  return (
    <div className="relative col-span-full grid grid-cols-subgrid items-baseline border-l-3 border-l-transparent px-4 py-2.5 text-ink hover:border-l-accent hover:text-accent [&+&]:border-t [&+&]:border-t-border">
      <a
        href={asset(file.path)}
        className="col-start-1 min-w-0 text-inherit no-underline after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-accent"
      >
        <span className="font-mono text-[13.5px] break-words">{baseName(name)}</span>
      </a>

      {file.short && file.commitHref ? (
        <a
          href={file.commitHref}
          target="_blank"
          rel="noopener"
          className="relative z-10 col-start-2 rounded-badge bg-accent/15 px-2 py-0.5 font-mono text-[11px] font-semibold whitespace-nowrap text-accent no-underline hover:bg-accent/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {file.short}
        </a>
      ) : null}

      <span className="col-start-3 rounded-badge bg-warn-bg px-2 py-0.5 text-[11px] font-semibold tracking-[0.04em] text-warn uppercase">
        {file.label ?? extensionLabel(file.path)}
      </span>
    </div>
  );
}
