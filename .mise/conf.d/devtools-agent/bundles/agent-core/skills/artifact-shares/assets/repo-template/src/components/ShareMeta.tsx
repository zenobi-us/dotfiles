/*!
 * The header of one share: what kind it is, when it landed, and where the
 * bytes came from.
 *
 * `share` writes this call at the top of every generated MDX file.
 */

import { kindFor } from "./kinds";
import { asset } from "./base";

export type ShareMetaProps = {
  kind?: string;
  hash?: string;
  date?: string;
  /** Original path or URL the artifact was taken from. */
  source?: string;
  /** Link to the untouched bytes under /s/<hash>/. */
  raw?: string;
};

export function ShareMeta({ kind, hash, date, source, raw }: ShareMetaProps) {
  const entry = kindFor(kind);

  return (
    <div className="not-prose mb-6 flex flex-wrap items-center gap-2 border-b border-border pb-4">
      <span className={`rounded-badge px-2.5 py-1 text-[11px] font-semibold tracking-[0.04em] uppercase ${entry.tone}`}>
        {entry.label}
      </span>
      {date ? <span className="font-mono text-xs text-ink-muted">{date}</span> : null}
      {hash ? (
        <span className="rounded-badge bg-accent/15 px-2 py-0.5 font-mono text-[11px] font-semibold text-accent">
          {hash}
        </span>
      ) : null}
      {source ? (
        <span className="min-w-0 truncate font-mono text-xs text-ink-muted" title={source}>
          {source}
        </span>
      ) : null}
      {raw ? (
        <a
          href={asset(raw)}
          className="ml-auto rounded-badge bg-info-bg px-2.5 py-1 text-[11px] font-semibold text-info no-underline hover:bg-info-bg/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Original files
        </a>
      ) : null}
    </div>
  );
}
