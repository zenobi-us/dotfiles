#!/usr/bin/env -S mise x -- bun --install=fallback
import path from "node:path";
import { Crust } from "@crustjs/core@^0.0.19";
import { helpPlugin } from "@crustjs/plugins@^0.1.2";

const PORT = 0;

export function escapeHtml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function inlineMarkdown(value) {
  let html = escapeHtml(value);
  const code = [];
  html = html.replaceAll(/`([^`]+)`/g, (_, text) => {
    code.push(`<code>${text}</code>`);
    return `\u0000${code.length - 1}\u0000`;
  });
  html = html.replaceAll(/!\[([^\]]*)\]\(([^\s)]+)(?:\s+"([^"]*)")?\)/g, (_, alt, src, title) => {
    const safeSrc = /^(https?:|mailto:|\/|#)/i.test(src) ? src : "#";
    const titleAttr = title ? ` title="${title}"` : "";
    return `<img src="${safeSrc}" alt="${alt}"${titleAttr}>`;
  });
  html = html.replaceAll(/\[([^\]]+)\]\(([^\s)]+)(?:\s+"([^"]*)")?\)/g, (_, text, href, title) => {
    const safeHref = /^(https?:|mailto:|\/|#)/i.test(href) ? href : "#";
    const titleAttr = title ? ` title="${title}"` : "";
    return `<a href="${safeHref}"${titleAttr}>${text}</a>`;
  });
  html = html.replaceAll(/\*\*([^*]+)\*\*|__([^_]+)__/g, (_, strong, strongAlt) => `<strong>${strong ?? strongAlt}</strong>`);
  html = html.replaceAll(/\*([^*]+)\*|_([^_]+)_/g, (_, emphasis, emphasisAlt) => `<em>${emphasis ?? emphasisAlt}</em>`);
  return html.replaceAll(/\u0000(\d+)\u0000/g, (_, index) => code[Number(index)]);
}

function markdownToHtml(markdown) {
  const lines = markdown.replaceAll("\r\n", "\n").split("\n");
  const output = [];
  let paragraph = [];
  let list = null;
  let code = null;

  const flushParagraph = () => {
    if (paragraph.length) output.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
    paragraph = [];
  };
  const closeList = () => {
    if (list) output.push(`</${list}>`);
    list = null;
  };

  for (const line of lines) {
    if (code) {
      if (line.startsWith("```")) {
        output.push(`<pre><code>${escapeHtml(code.lines.join("\n"))}</code></pre>`);
        code = null;
      } else code.lines.push(line);
      continue;
    }
    if (line.startsWith("```")) {
      flushParagraph();
      closeList();
      code = { lines: [] };
      continue;
    }
    if (!line.trim()) {
      flushParagraph();
      closeList();
      continue;
    }
    const heading = line.match(/^(#{1,6})\s+(.+?)\s*#*$/);
    if (heading) {
      flushParagraph();
      closeList();
      const level = heading[1].length;
      output.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }
    const unordered = line.match(/^\s*[-*+]\s+(.+)$/);
    const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);
    if (unordered || ordered) {
      flushParagraph();
      const nextList = ordered ? "ol" : "ul";
      if (list !== nextList) {
        closeList();
        output.push(`<${nextList}>`);
        list = nextList;
      }
      output.push(`<li>${inlineMarkdown((unordered ?? ordered)[1])}</li>`);
      continue;
    }
    closeList();
    paragraph.push(line.trim());
  }
  if (code) output.push(`<pre><code>${escapeHtml(code.lines.join("\n"))}</code></pre>`);
  flushParagraph();
  closeList();
  return output.join("\n");
}

export function htmlDocument(markdown, title = "Markdown preview") {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>body{max-width:52rem;margin:2rem auto;padding:0 1rem;font:16px/1.6 system-ui,sans-serif;color:#242424}pre{padding:1rem;overflow:auto;background:#f4f4f4;border-radius:6px}code{font-family:ui-monospace,monospace}img{max-width:100%}blockquote{margin-left:0;padding-left:1rem;border-left:4px solid #ddd;color:#555}</style>
</head>
<body>${markdownToHtml(markdown)}</body>
</html>`;
}

export async function startServer(file, host = "127.0.0.1") {
  const filePath = path.resolve(file);
  const markdown = await Bun.file(filePath).text();
  const server = Bun.serve({
    port: PORT,
    hostname: host,
    fetch(request) {
      const url = new URL(request.url);
      if (url.pathname !== "/" && url.pathname !== "/index.html") return new Response("Not found\n", { status: 404 });
      return new Response(htmlDocument(markdown, path.basename(filePath)), { headers: { "content-type": "text/html; charset=utf-8" } });
    },
  });
  return { server, url: `http://${host}:${server.port}/` };
}

async function runPreview(ctx) {
  const file = ctx.args.file;
  if (!file) {
    console.error("Usage: md-preview <file.md>");
    process.exitCode = 2;
    return;
  }
  try {
    const { url } = await startServer(file);
    console.log(url);
  } catch (error) {
    console.error(`md-preview: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}

function runDoctor() {
  console.log(`bun: ${Bun.version}`);
  console.log("status: ready");
}

const cli = new Crust("markdown-preview")
  .meta({ description: "Serve a local Markdown file as HTML" })
  .use(helpPlugin())
  .command("preview", (cmd) => cmd
    .meta({ description: "Serve one Markdown file on a free local port" })
    .args([{ name: "file", type: "string", required: true }])
    .run(runPreview))
  .command("doctor", (cmd) => cmd
    .meta({ description: "Check the Bun runtime" })
    .run(runDoctor));

if (import.meta.main) {
  // Keep the original direct path contract: <script> file.md means preview file.md.
  if (process.argv.length === 2) {
    console.error("Usage: md-preview <file.md>");
    process.exitCode = 2;
  } else {
    if (process.argv[2] && !["preview", "doctor"].includes(process.argv[2]) && !process.argv[2].startsWith("-")) process.argv.splice(2, 0, "preview");
    await cli.execute();
  }
}
