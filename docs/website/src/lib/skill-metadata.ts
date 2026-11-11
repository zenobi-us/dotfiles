// Metadata is descriptive, not a validation contract. Inferred output paths retain their source.
import { existsSync, readFileSync } from "node:fs";
import { relative, resolve, sep } from "node:path";
import matter from "gray-matter";
import type { Root, RootContent } from "mdast";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { markdownText } from "./markdown";

const parser = unified().use(remarkParse);
const repositorySource = "https://github.com/zenobi-us/dotfiles/blob/main/mise/conf.d/devtools-agent/bundles/";

export function skillSource(path: string): string {
  return repositorySource + path.split("/").map(encodeURIComponent).join("/");
}

export function skillMetadata(content: string, skillDirectory: string, bundlesDirectory: string) {
  const root = resolve(bundlesDirectory, skillDirectory);
  const document = parser.parse(content);
  const references: { label: string; href: string; path: string }[] = [];
  const seen = new Set<string>();
  visit(document, (node) => {
    if (node.type !== "link" || /^(?:[a-z][a-z\d+.-]*:|[/#])/i.test(node.url)) return;
    const file = resolve(root, decodeURIComponent(node.url.split(/[?#]/)[0] ?? ""));
    const path = relative(root, file);
    if (path.startsWith(`..${sep}`) || path === ".." || !existsSync(file) || seen.has(file)) return;
    seen.add(file);
    references.push({
      label: markdownText(node),
      href: skillSource(`${skillDirectory}/${path.split(sep).join("/")}`),
      path,
    });
  });
  const artifacts = new Map<string, { path: string; source: string }>();
  const documents = [
    { content, path: "SKILL.md" },
    ...references
      .filter((entry) => entry.path.endsWith(".md"))
      .map((entry) => ({ content: matter(readFileSync(resolve(root, entry.path), "utf8")).content, path: entry.path })),
  ];
  for (const source of documents) {
    let outputSection = false;
    for (const node of parser.parse(source.content).children) {
      if (node.type === "heading")
        outputSection = /\b(outputs?|artifacts?|render|report contract)\b/i.test(markdownText(node));
      const text = markdownText(node);
      if (!outputSection && !/\b(writes?|creates?|saves?|outputs?)\b/i.test(text)) continue;
      visit(node, (child) => {
        if (child.type !== "inlineCode") return;
        const path = child.value;
        const sentence = text.split(/(?<=[.!?])\s+/).find((part) => part.includes(path)) ?? "";
        if (!outputSection && !/\b(writes?|creates?|saves?|outputs?)\b/i.test(sentence)) return;
        if (
          !/\.(?:md|html|json|ya?ml|csv|png|jpe?g|webp|svg|log|txt)(?:$|[>])/i.test(path) ||
          /\s/.test(path) ||
          /^(?:https?:|references\/|scripts\/)/.test(path)
        )
          return;
        if (!artifacts.has(path))
          artifacts.set(path, { path, source: skillSource(`${skillDirectory}/${source.path}`) });
      });
    }
  }
  return { references, artifacts: [...artifacts.values()] };
}

function visit(node: Root | RootContent, callback: (node: RootContent) => void): void {
  if (node.type !== "root") callback(node);
  if ("children" in node) for (const child of node.children) visit(child as RootContent, callback);
}
