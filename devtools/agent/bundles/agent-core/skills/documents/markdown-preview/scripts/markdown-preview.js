#!/usr/bin/env node
import process from "node:process";

import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";

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

function htmlDocument(markdown, title = "Markdown preview") {
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

async function startServer(file, host = "127.0.0.1") {
  const filePath = path.resolve(file);
  const markdown = await fs.readFile(filePath, "utf8");
  const server = http.createServer((request, response) => {
    if (request.url !== "/" && request.url !== "/index.html") {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Not found\n");
      return;
    }
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(htmlDocument(markdown, path.basename(filePath)));
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(PORT, host, resolve);
  });
  const address = server.address();
  return { server, url: `http://${host}:${address.port}/` };
}

const file = process.argv[2];
if (!file || file === "-h" || file === "--help") {
  console.error("Usage: md-preview <file.md>");
  process.exit(file ? 0 : 2);
}

startServer(file)
  .then(({ url }) => console.log(url))
  .catch((error) => {
    console.error(`md-preview: ${error.message}`);
    process.exitCode = 1;
  });
