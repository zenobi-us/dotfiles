import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { fuzzyScore } from "../../lib/fuzzy";
import { Disclosure } from "../Disclosure";
import { SkillIndexContext, useSkillIndex } from "./useSkillIndex";

export type SkillIndexItem = { name: string; anchor: string };

type Group<T> = { category: string; items: T[] };

function Root(props: { children: ReactNode }) {
  const [query, setQuery] = useState("");
  const context = useMemo(() => ({ query, setQuery }), [query]);
  return <SkillIndexContext.Provider value={context}>{props.children}</SkillIndexContext.Provider>;
}

/** A search field. Typing narrows the groups to skills that fuzzy match, as fzf does. */
function Filter(props: { label: string; placeholder: string }) {
  const index = useSkillIndex();
  return (
    <label className="mb-3 flex items-center gap-3 border border-border px-3 py-2 text-[12px] focus-within:border-primary">
      <span className="whitespace-nowrap text-muted">{props.label}</span>
      <input
        type="search"
        className="min-w-0 flex-1 bg-transparent font-mono text-foreground outline-none placeholder:text-muted"
        placeholder={props.placeholder}
        autoComplete="off"
        spellCheck={false}
        value={index.query}
        onChange={(event) => index.setQuery(event.currentTarget.value)}
      />
    </label>
  );
}

/**
 * One closed disclosure for each category. While the query is not empty, only matching
 * skills show, best match first, and their categories open. A link to a skill's anchor
 * opens its category and scrolls to its row.
 */
function Groups<T extends SkillIndexItem>(props: {
  categories: (readonly [string, T[]])[];
  children: (category: string, items: T[]) => ReactNode;
}) {
  const index = useSkillIndex();
  const [opened, setOpened] = useState<ReadonlySet<string>>(new Set());
  const searching = index.query.trim() !== "";
  const total = props.categories.reduce((sum, [, items]) => sum + items.length, 0);

  const groups: Group<T>[] = searching
    ? props.categories
        .map(([category, items]) => ({ category, items: rank(index.query, category, items) }))
        .filter((group) => group.items.length > 0)
    : props.categories.map(([category, items]) => ({ category, items }));
  const shown = groups.reduce((sum, group) => sum + group.items.length, 0);

  const categoriesRef = useRef(props.categories);
  useEffect(() => {
    categoriesRef.current = props.categories;
  });

  const setQuery = index.setQuery;
  useEffect(() => {
    const reveal = () => {
      const anchor = decodeURIComponent(window.location.hash.slice(1));
      const owner = categoriesRef.current.find(([, items]) => items.some((item) => item.anchor === anchor));
      if (!owner) return;
      setQuery("");
      setOpened((current) => new Set(current).add(owner[0]));
      requestAnimationFrame(() => {
        const row = document.getElementById(anchor);
        if (!row) return;
        // A filter can hide the row when the link is followed, so the browser sets no :target. Navigating again sets it.
        if (row.matches(":target")) row.scrollIntoView();
        else window.location.replace(`#${encodeURIComponent(anchor)}`);
      });
    };
    reveal();
    window.addEventListener("hashchange", reveal);
    return () => window.removeEventListener("hashchange", reveal);
  }, [setQuery]);

  const toggle = (category: string, open: boolean) =>
    setOpened((current) => {
      if (current.has(category) === open) return current;
      const next = new Set(current);
      if (open) next.add(category);
      else next.delete(category);
      return next;
    });

  return (
    <>
      <p className="mb-3 text-[11px] text-muted" aria-live="polite">
        {searching ? `${shown} of ${total} skills match` : `${total} skills`}
      </p>
      {groups.map((group) => (
        <Disclosure
          key={group.category}
          open={searching || opened.has(group.category)}
          onToggle={(open) => {
            if (!searching) toggle(group.category, open);
          }}
        >
          <Disclosure.Summary title={group.category} count={group.items.length} />
          <Disclosure.Content>{props.children(group.category, group.items)}</Disclosure.Content>
        </Disclosure>
      ))}
    </>
  );
}

/** The items that match the query, best first. A skill matches by its name, or by `<category>/<name>`. */
function rank<T extends SkillIndexItem>(query: string, category: string, items: T[]): T[] {
  return items
    .map((item) => ({ item, score: best(fuzzyScore(query, item.name), fuzzyScore(query, `${category}/${item.name}`)) }))
    .filter((match): match is { item: T; score: number } => match.score !== undefined)
    .toSorted((a, b) => b.score - a.score)
    .map((match) => match.item);
}

function best(a: number | undefined, b: number | undefined) {
  if (a === undefined) return b;
  if (b === undefined) return a;
  return Math.max(a, b);
}

export const SkillIndex = Object.assign(Root, { Root, Filter, Groups });
