// Build-time transforms keep heading links and repository-relative links in static HTML.
import { compileMarkdown } from "@content-collections/markdown";
import type { Element, Root as HtmlRoot, RootContent as HtmlNode } from "hast";
import type { Root as MarkdownRoot, RootContent as MarkdownNode } from "mdast";
import remarkGfm from "remark-gfm";
import { headingLinkIcon, headingSlug } from "./headings";

export async function compileDocument(
  context: Parameters<typeof compileMarkdown>[0],
  document: Parameters<typeof compileMarkdown>[1],
  sourceDirectory?: string,
): Promise<string> {
  const prefix = `doc-${headingSlug(document._meta.path)}-`;
  return compileMarkdown(context, document, {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [() => (tree: HtmlRoot) => decorateHtml(tree, prefix, sourceDirectory)],
  });
}

function decorateHtml(tree: HtmlRoot, prefix: string, sourceDirectory?: string): void {
  const slugs = new Set<string>();
  const fragments = new Map<string, string>();
  walkHtml(tree, (node) => {
    if (!/^h[1-6]$/.test(node.tagName)) return;
    const title = htmlText(node);
    const slug = headingSlug(title);
    let fragment = slug;
    let suffix = 1;
    while (slugs.has(fragment)) fragment = `${slug}-${suffix++}`;
    slugs.add(fragment);
    const id = `${prefix}${fragment}`;
    fragments.set(fragment, id);
    node.properties.id = id;
    node.children.push({
      type: "element",
      tagName: "a",
      properties: {
        href: `#${id}`,
        className: ["heading-anchor"],
        ariaLabel: `Link to ${title}`,
        title: `Link to ${title}`,
      },
      children: [
        {
          type: "element",
          tagName: "svg",
          properties: {
            viewBox: headingLinkIcon.viewBox,
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "1.8",
            ariaHidden: "true",
          },
          children: [{ type: "element", tagName: "path", properties: { d: headingLinkIcon.path }, children: [] }],
        },
      ],
    });
  });
  walkHtml(tree, (node) => {
    for (const attribute of ["href", "src"] as const) {
      const value = node.properties[attribute];
      if (typeof value !== "string") continue;
      if (value.startsWith("#")) {
        const id = fragments.get(decodeURIComponent(value.slice(1)));
        if (id) node.properties[attribute] = `#${id}`;
      } else if (sourceDirectory && !/^(?:[a-z][a-z\d+.-]*:|\/)/i.test(value)) {
        const directory =
          attribute === "src"
            ? sourceDirectory.replace("github.com/", "raw.githubusercontent.com/").replace("/blob/", "/")
            : sourceDirectory;
        node.properties[attribute] = new URL(value, directory).href;
      }
    }
  });
}

function walkHtml(node: HtmlRoot | HtmlNode, visit: (node: Element) => void): void {
  if (node.type === "element") visit(node);
  if ("children" in node) for (const child of node.children) walkHtml(child, visit);
}

function htmlText(node: HtmlNode): string {
  if (node.type === "text") return node.value;
  return "children" in node ? node.children.map(htmlText).join("") : "";
}

export function markdownText(node: MarkdownRoot | MarkdownNode): string {
  if ("value" in node) return node.value;
  return "children" in node ? node.children.map((child) => markdownText(child as MarkdownNode)).join("") : "";
}
