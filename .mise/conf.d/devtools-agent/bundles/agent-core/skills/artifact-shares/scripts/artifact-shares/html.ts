/*!
 * HTML to MDX.
 *
 * A share is converted, not embedded. The published page is a fumadocs page,
 * so it gets the site theme, the sidebar, and full-text search.
 *
 * What survives: headings, paragraphs, lists, tables, code blocks, links,
 * images, and video.
 *
 * What does not: the artifact's own CSS, its own scripts, and any custom
 * markup with no Markdown equivalent. A report that depends on its own
 * JavaScript will not behave the same way here. Keep the original files as
 * well when that matters: `share` copies them under `public/s/<hash>/`.
 */

/*
 * Both converters are loaded at call time, not by a static import.
 *
 * A script run through `--install=fallback` resolves the pinned specifier and
 * needs no node_modules. `bun test` does not apply that flag, so it resolves
 * the plain name from the bundle's node_modules instead. Trying both keeps one
 * module working in both places.
 */
type TurndownCtor = typeof import("turndown");
type GfmPlugin = (service: unknown) => void;

let loaded: { Turndown: TurndownCtor; gfm: GfmPlugin } | undefined;

async function loadConverters(): Promise<{ Turndown: TurndownCtor; gfm: GfmPlugin }> {
  if (loaded) return loaded;

  const [turndown, plugin] = await Promise.all([
    import("turndown@^7.2.4").catch(() => import("turndown")),
    import("turndown-plugin-gfm@^1.0.2").catch(() => import("turndown-plugin-gfm")),
  ]);

  loaded = {
    Turndown: ((turndown as any).default ?? turndown) as TurndownCtor,
    gfm: (plugin as any).gfm as GfmPlugin,
  };
  return loaded;
}

export type Figure = {
  /** The `src` exactly as the source HTML wrote it. */
  src: string;
  caption: string;
  video: boolean;
};

export type ConvertResult = {
  title: string;
  /** MDX body. No frontmatter. */
  markdown: string;
  /** Referenced files, in the order they appear, without duplicates. */
  figures: Figure[];
};

const TOKEN = (index: number) => `@@AFIG${index}@@`;
const TOKEN_PATTERN = /@@AFIG(\d+)@@/g;

export function isRemote(src: string): boolean {
  return /^(?:[a-z]+:)?\/\//i.test(src) || src.startsWith("data:");
}

function textOf(node: { textContent?: string | null }): string {
  return (node.textContent ?? "").replace(/\s+/g, " ").trim();
}

/**
 * Convert one HTML document.
 *
 * `assetPrefix` is prepended to every local `src`, so it must end with "/".
 * Pass the repository-relative prefix, such as `s/<hash>/`. Do NOT include the
 * site base path: the components add that at render time.
 */
export async function convertHtmlToMdx(html: string, assetPrefix: string): Promise<ConvertResult> {
  if (!assetPrefix.endsWith("/")) throw new Error('assetPrefix must end with "/"');

  const { Turndown, gfm } = await loadConverters();

  const figures: Figure[] = [];
  const seen = new Map<string, number>();

  function record(src: string, caption: string, video: boolean): string {
    const key = `${src} ${caption}`;
    const existing = seen.get(key);
    if (existing !== undefined) return TOKEN(existing);
    const index = figures.length;
    figures.push({ src, caption, video });
    seen.set(key, index);
    return TOKEN(index);
  }

  const turndown = new Turndown({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
  });
  turndown.use(gfm);
  // "title" is removed as well as "head": a fragment parser can leave the
  // title text behind as a bare text node above the first heading.
  turndown.remove(["script", "style", "link", "head", "title", "noscript", "template"]);

  // A figure becomes one <Figure>, caption included, so the caption is not
  // orphaned as a stray paragraph under the image.
  turndown.addRule("artifact-figure", {
    filter: (node: any) =>
      node.nodeName === "FIGURE" && Boolean(node.querySelector?.("img, video")),
    replacement: (_content: string, node: any) => {
      const media = node.querySelector("img, video");
      const src = media?.getAttribute("src") ?? "";
      if (!src) return "";
      const captionNode = node.querySelector("figcaption");
      const caption = captionNode ? textOf(captionNode) : textOf(media);
      return `\n\n${record(src, caption, media.nodeName === "VIDEO")}\n\n`;
    },
  });

  // Turndown converts children first, so an <img> inside a <figure> would be
  // recorded twice: once here with its alt text, once by the rule above with
  // its caption. A figure's own media is left to the figure rule.
  turndown.addRule("artifact-media", {
    filter: (node: any) =>
      (node.nodeName === "IMG" || node.nodeName === "VIDEO") &&
      node.parentNode?.nodeName !== "FIGURE",
    replacement: (_content: string, node: any) => {
      const src = node.getAttribute("src") ?? "";
      if (!src) return "";
      const caption = node.getAttribute("alt") ?? "";
      return `\n\n${record(src, caption, node.nodeName === "VIDEO")}\n\n`;
    },
  });

  const body = turndown.turndown(html);
  const title = readTitle(html) || "Untitled share";

  return {
    title,
    markdown: renderTokens(stripLeadingHeading(escapeMdx(body), title), figures, assetPrefix),
    figures,
  };
}

export function readTitle(html: string): string {
  const titleTag = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1];
  if (titleTag?.trim()) return decodeEntities(titleTag).replace(/\s+/g, " ").trim();

  const heading = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html)?.[1];
  if (heading?.trim()) {
    return decodeEntities(heading.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
  }
  return "";
}

function decodeEntities(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

/** Fumadocs prints the frontmatter title as the page heading, so a first
 *  heading saying the same thing reads as a duplicate. */
function stripLeadingHeading(markdown: string, title: string): string {
  const trimmed = markdown.replace(/^\s+/, "");
  const match = /^#\s+(.+)\n?/.exec(trimmed);
  if (match && match[1]!.trim() === title.trim()) return trimmed.slice(match[0].length).trimStart();
  return trimmed;
}

/**
 * MDX reads `{` as an expression and `<` as a tag. Neither is safe in prose
 * that came from an arbitrary page, so both are escaped everywhere except
 * inside code, where MDX already treats them as text.
 */
export function escapeMdx(markdown: string): string {
  const parts = markdown.split(/(```[\s\S]*?```|`[^`\n]*`)/g);
  return parts
    .map((part, index) =>
      index % 2 === 1
        ? part
        : part.replace(/\{/g, "&#123;").replace(/\}/g, "&#125;").replace(/</g, "&lt;"),
    )
    .join("");
}

function renderTokens(markdown: string, figures: Figure[], assetPrefix: string): string {
  return markdown.replace(TOKEN_PATTERN, (_match, raw: string) => {
    const figure = figures[Number(raw)];
    if (!figure) return "";
    const src = isRemote(figure.src)
      ? figure.src
      : `${assetPrefix}${figure.src.replace(/^\.\//, "").replace(/^\/+/, "")}`;
    const caption = figure.caption ? ` caption=${JSON.stringify(figure.caption)}` : "";
    return `<Figure src=${JSON.stringify(src)}${caption} />`;
  });
}

/**
 * Markdown or MDX that a person wrote. The body is kept as it is: they chose
 * the markup, so nothing here second-guesses it. Only the frontmatter is
 * removed, because `share` writes its own.
 */
export function splitFrontmatter(text: string): { front: string; body: string } {
  if (!text.startsWith("---")) return { front: "", body: text };
  const end = text.indexOf("\n---", 3);
  if (end === -1) return { front: "", body: text };
  const after = text.indexOf("\n", end + 1);
  return {
    front: text.slice(4, end),
    body: after === -1 ? "" : text.slice(after + 1).replace(/^\s+/, ""),
  };
}

/** Read one scalar out of a frontmatter block, without a YAML parser. */
export function frontmatterValue(front: string, key: string): string | undefined {
  const match = new RegExp(`^${key}:\\s*(.+?)\\s*$`, "m").exec(front);
  if (!match) return undefined;
  return match[1]!.replace(/^["']|["']$/g, "");
}
