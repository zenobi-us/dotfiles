/*!
 * A dated run of events, in one of three densities.
 *
 * Ported from the zeno app component (assets/app/v1/components/Timeline.js).
 * Two things changed on the way in.
 *
 * Styling. There the classes came from a pinned assets/timeline/v1/timeline.css
 * that hand-written report pages linked as well. This repository has no such
 * pages and no such stylesheet, so the classes moved into the component and
 * read the theme tokens declared in src/app.css.
 *
 * Variant plumbing. There the root put the variant in a React context and each
 * part read it back. That does not survive here: this site renders through
 * React Server Components, `createContext` is not allowed in a server
 * component, and a `"use client"` module loses the statics that make
 * `<Timeline.Item>` resolve. So the root clones its items with the variant and
 * an item clones its parts with the variant and the kind. Nothing in the block
 * is stateful, so it ships no JavaScript. The one cost is that a part must be
 * a direct child of its item, and an item a direct child of the root. MDX
 * writes exactly that.
 *
 * A compound component. The author sets the variant once:
 *
 *   <Timeline variant="rail">
 *     <Timeline.Item kind="cut">
 *       <Timeline.When>2026-09-22<br />08:25</Timeline.When>
 *       <Timeline.Sha>36964dcf</Timeline.Sha>
 *       <Timeline.Kind>Removed</Timeline.Kind>
 *       <Timeline.Headline>Removed the SuperStream schema</Timeline.Headline>
 *       <Timeline.Meta repo="reckon-graphql" pr="PR #1376" ticket="RWR-19585" />
 *       <Timeline.Note>Deleted the member and the resolver map entry.</Timeline.Note>
 *     </Timeline.Item>
 *   </Timeline>
 *
 * The three variants:
 *
 *   rail     4 to 8 events, one story. A date gutter, a spine, and a mark
 *            whose shape carries the kind of event.
 *   ledger   20 or more events. One row per event, fixed columns, the body
 *            behind a <details> disclosure.
 *   span     duration is the point. The track between two marks is painted,
 *            so the reader gets the interval without date arithmetic.
 *
 * The four kinds. The mark carries each one as a shape as well as a colour, so
 * the run reads without colour vision:
 *
 *   (none)   a neutral commit        filled circle, muted ink
 *   add      the thing arrived       filled circle, pass green
 *   cut      the thing was removed   filled diamond, fail red
 *   open     still unresolved        dashed ring, warn amber
 *
 * How the parts find their place:
 *
 *   rail, span   Every part except When renders into the body, in the order
 *                the author wrote them. When is hoisted into the date gutter,
 *                because the gutter is the first cell of the grid.
 *   ledger       The row is a fixed five-cell grid, so the item picks the
 *                parts it needs by type: When, Sha, the repo out of Meta, and
 *                Headline. Everything else drops into the disclosure.
 *
 * Every class list below is a whole string. Tailwind cannot see a class built
 * by joining pieces, so a variant that shares a shape repeats it.
 */

import {
  Children,
  cloneElement,
  isValidElement,
  type ComponentType,
  type ReactElement,
  type ReactNode,
} from "react";

export type TimelineVariant = "rail" | "ledger" | "span";
export type TimelineKind = "" | "add" | "cut" | "open";
export type MeterState = "" | "live" | "gone";

/**
 * What the root and the item clone into their children. An author never writes
 * these; they carry the variant down in place of a context.
 */
type Inherited = {
  variant?: TimelineVariant;
  kind?: TimelineKind;
};

/** Where a part belongs. `item` marks the one child the root clones. */
type Slot = "item" | "when" | "body";

function cx(...parts: (string | false | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

// MDX passes whatever the author typed. Anything unknown falls back to the
// neutral commit rather than producing an undefined class list.
function toKind(value: string | undefined): TimelineKind {
  return value === "add" || value === "cut" || value === "open" ? value : "";
}

function toState(value: string | undefined): MeterState {
  return value === "live" || value === "gone" ? value : "";
}

function toVariant(value: string | undefined): TimelineVariant {
  return value === "ledger" || value === "span" ? value : "rail";
}

/*
 * Children arrive as one node, an array, or nested arrays, depending on how
 * the author wrote the MDX. `Children.toArray` flattens once and drops the
 * empties; `isValidElement` drops the whitespace text MDX leaves between tags.
 */
function partsOf(children: ReactNode): ReactElement[] {
  return Children.toArray(children).filter((child) => isValidElement(child));
}

// A part declares the cell it belongs to. An element with no slot is something
// the author wrote by hand, so it is left alone and dropped into the body.
function slotOf(child: ReactElement): Slot | undefined {
  const type = child.type;
  if (typeof type !== "function") return undefined;
  return (type as Partial<{ slot: Slot }>).slot;
}

// Clone the inherited values into a part. A hand-written element is returned
// untouched, or React would warn about unknown attributes on a DOM node.
function inherit(child: ReactElement, values: Inherited): ReactElement {
  if (!slotOf(child)) return child;
  return cloneElement(child as ReactElement<Inherited>, values);
}

function findOf<P>(
  parts: ReactElement[],
  type: ComponentType<P>,
): ReactElement<P> | undefined {
  return parts.find((part) => part.type === type) as ReactElement<P> | undefined;
}

/* ==========================================================================
   The mark, the bar, and the colours each kind takes
   ========================================================================== */

const MARK_SHAPE: Record<TimelineKind, string> = {
  "": "h-[9px] w-[9px] rounded-full bg-ink-muted",
  add: "h-[9px] w-[9px] rounded-full bg-pass",
  // A square turned 45 degrees. The shape, not the colour, says "removed".
  cut: "h-[9px] w-[9px] rotate-45 rounded-[1px] bg-fail",
  open: "h-[11px] w-[11px] rounded-full border-2 border-dashed border-warn bg-bg",
};

const MARK_TOP: Record<TimelineKind, string> = {
  "": "mt-1.5",
  add: "mt-1.5",
  cut: "mt-1.5",
  open: "mt-[5px]",
};

const BAR_STATE: Record<MeterState, string> = {
  "": "border border-border bg-bg",
  live: "border border-pass bg-pass-bg",
  gone:
    "border border-dashed border-fail " +
    "bg-[repeating-linear-gradient(135deg,var(--color-fail-bg)_0_5px,transparent_5px_10px)]",
};

const METER_STATE: Record<MeterState, string> = {
  "": "bg-bg text-ink-muted",
  live: "bg-pass-bg text-pass",
  gone: "bg-fail-bg text-fail",
};

const KIND_INK: Record<TimelineKind, string> = {
  "": "text-ink-muted",
  add: "text-pass",
  cut: "text-fail",
  open: "text-warn",
};

function Mark({ kind, variant }: { kind: TimelineKind; variant: TimelineVariant }) {
  return (
    <span
      className={cx(
        "relative z-[1] shrink-0",
        variant === "ledger" ? "" : MARK_TOP[kind],
        MARK_SHAPE[kind],
        // The mark cuts a hole in the bar it sits on, so the interval reads as
        // two runs rather than one.
        variant === "span" && "shadow-[0_0_0_3px_var(--color-bg)]",
      )}
    />
  );
}

/* ==========================================================================
   The parts
   ========================================================================== */

// A span, not a div: in a ledger this renders inside <summary>, which takes
// phrasing content only. Every place it lands is a grid cell, so the box is
// blockified anyway.
export function When({ variant, children }: Inherited & { children?: ReactNode }) {
  return (
    <span
      className={cx(
        "font-mono text-xs tabular-nums whitespace-nowrap text-ink-muted",
        variant === "ledger" ? "" : "pt-[3px] text-right",
      )}
    >
      {children}
    </span>
  );
}
When.slot = "when" as Slot;

export function Sha({ variant, children }: Inherited & { children?: ReactNode }) {
  return (
    <span
      className={
        variant === "ledger"
          ? // The row hides the hash below 640px. Its cell stays in the markup,
            // so three children meet the three columns left there.
            "overflow-hidden font-mono text-[12.5px] text-ellipsis whitespace-nowrap max-sm:hidden"
          : "font-mono text-[13.5px] font-semibold tracking-[-0.01em]"
      }
    >
      {children}
    </span>
  );
}
Sha.slot = "body" as Slot;

// The word for what happened, coloured by the kind its item already declared.
export function Kind({ kind, children }: Inherited & { children?: ReactNode }) {
  return (
    <span
      className={cx(
        "ml-2 font-mono text-[11px] tracking-[0.1em] uppercase",
        KIND_INK[toKind(kind)],
      )}
    >
      {children}
    </span>
  );
}
Kind.slot = "body" as Slot;

// A span for the same reason as When. It is given display: block.
export function Headline({
  variant,
  children,
}: Inherited & { children?: ReactNode }) {
  return (
    <span
      className={
        variant === "ledger"
          ? // One row, one line. A headline that outgrows its cell is cut here
            // and read in full in the detail below.
            "block overflow-hidden text-[13.5px] text-ellipsis whitespace-nowrap"
          : "mt-1.5 block text-[15px]"
      }
    >
      {children}
    </span>
  );
}
Headline.slot = "body" as Slot;

export type MetaProps = Inherited & {
  repo?: string;
  pr?: string;
  ticket?: string;
  who?: string;
};

// One muted line. A part left off is left out, so no page ends on a stray
// separator.
export function Meta({ variant, repo, pr, ticket, who }: MetaProps) {
  const parts = [repo, pr, ticket, who].filter(Boolean);
  if (parts.length === 0) return null;
  return (
    <p
      className={cx(
        "text-xs text-ink-muted",
        variant === "ledger" ? "m-0 mb-1.5 last:mb-0" : "mt-1.5",
      )}
    >
      {parts.join(" · ")}
    </p>
  );
}
Meta.slot = "body" as Slot;

export function Note({ variant, children }: Inherited & { children?: ReactNode }) {
  return (
    <p
      className={cx(
        "text-[13.5px]",
        variant === "ledger" ? "m-0 mb-1.5 last:mb-0" : "mt-2.5",
      )}
    >
      {children}
    </p>
  );
}
Note.slot = "body" as Slot;

export type MeterProps = Inherited & {
  state?: MeterState;
  children?: ReactNode;
};

// What the interval cost. Its state also paints the bar on the track above it,
// so the number and the drawing cannot disagree.
export function Meter({ state, children }: MeterProps) {
  return (
    <p
      className={cx(
        "mt-3 rounded-sm px-3 py-2 text-[12.5px]",
        METER_STATE[toState(state)],
      )}
    >
      {children}
    </p>
  );
}
Meter.slot = "body" as Slot;

/* ==========================================================================
   The item
   ========================================================================== */

// Five cells, always. A missing value keeps its empty cell, so the columns
// line up down the whole list. The hash and the repository leave the row below
// 640px, which leaves exactly three children for three columns.
const LEDGER_LINE =
  "grid cursor-pointer list-none grid-cols-[96px_10px_1fr] items-center gap-x-3 px-1.5 py-2.5 " +
  "hover:bg-surface focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent " +
  "sm:grid-cols-[116px_10px_82px_132px_1fr] " +
  // Safari draws its own triangle on a summary. The grid has five cells and no
  // room for a sixth.
  "[&::-webkit-details-marker]:hidden";

// 116px gutter + 10px mark + two 12px gaps + 6px of row padding.
const LEDGER_DETAIL = "pr-1.5 pb-4 pl-4 sm:pl-[156px]";

const ITEM_GRID: Record<"rail" | "span", string> = {
  rail: "grid grid-cols-[62px_20px_1fr] gap-x-3 sm:grid-cols-[82px_20px_1fr]",
  span: "grid grid-cols-[72px_26px_1fr] gap-x-3 sm:grid-cols-[96px_26px_1fr]",
};

// The spine runs the height of the track, then stops at the outer marks. The
// item does not know its own position, so the first and last rules are written
// as parent selectors rather than as props threaded down from the root.
const RAIL_SPINE =
  "before:absolute before:inset-y-0 before:w-px before:bg-border before:content-[''] " +
  "[li:first-child>&]:before:top-[10px] " +
  "[li:last-child>&]:before:bottom-auto [li:last-child>&]:before:h-[10px]";

export type ItemProps = Inherited & { children?: ReactNode };

export function Item({ variant, kind, children }: ItemProps) {
  const shape = toVariant(variant);
  const own = toKind(kind);
  const parts = partsOf(children);
  const pass = (child: ReactElement) => inherit(child, { variant: shape, kind: own });

  const when = findOf(parts, When);
  const mark = <Mark kind={own} variant={shape} />;

  if (shape === "ledger") {
    const sha = findOf(parts, Sha);
    const headline = findOf(parts, Headline);
    const meta = findOf(parts, Meta);
    // Kind drops out of a ledger altogether: the mark in the row carries it.
    const detail = parts.filter(
      (child) =>
        child !== when &&
        child !== sha &&
        child !== headline &&
        child.type !== Kind,
    );

    return (
      <details className="border-b border-border open:bg-surface">
        <summary className={LEDGER_LINE}>
          {when ? pass(when) : <When variant={shape} />}
          {mark}
          {sha ? pass(sha) : <Sha variant={shape} />}
          <span className="overflow-hidden font-mono text-xs text-ellipsis whitespace-nowrap text-ink-muted max-sm:hidden">
            {meta?.props.repo ?? ""}
          </span>
          {headline ? pass(headline) : <Headline variant={shape} />}
        </summary>
        <div className={LEDGER_DETAIL}>{detail.map(pass)}</div>
      </details>
    );
  }

  // The span variant paints the interval this event opened. The last event
  // carries no meter, so the track stops at its mark.
  const meter = findOf(parts, Meter);
  const bar =
    shape === "span" && meter ? (
      // The bar belongs to the event that opened the interval and runs past
      // the bottom of its own row into the next mark.
      <span
        className={cx(
          "absolute top-[14px] -bottom-1.5 w-2 rounded-full",
          BAR_STATE[toState(meter.props.state)],
        )}
      />
    ) : null;

  return (
    <li className={ITEM_GRID[shape]}>
      {when ? pass(when) : null}
      <div
        className={cx(
          "relative flex justify-center",
          shape === "rail" && RAIL_SPINE,
        )}
      >
        {bar}
        {mark}
      </div>
      <div className="pb-[26px] [li:last-child>&]:pb-0">
        {parts.filter((child) => slotOf(child) !== "when").map(pass)}
      </div>
    </li>
  );
}
Item.slot = "item" as Slot;

/* ==========================================================================
   The root
   ========================================================================== */

export function Timeline({
  variant = "rail",
  children,
}: {
  variant?: TimelineVariant;
  children?: ReactNode;
}) {
  const shape = toVariant(variant);
  const items = partsOf(children).map((child) => inherit(child, { variant: shape }));

  if (shape === "ledger") {
    // <details> is not valid inside <ol>, so the ledger root is a plain
    // container and its rows carry the order in their dates.
    return (
      <div className="not-prose my-6 border-t border-border">{items}</div>
    );
  }

  return <ol className="not-prose my-6 list-none p-0">{items}</ol>;
}

Timeline.Item = Item;
Timeline.When = When;
Timeline.Sha = Sha;
Timeline.Kind = Kind;
Timeline.Headline = Headline;
Timeline.Meta = Meta;
Timeline.Note = Note;
Timeline.Meter = Meter;
