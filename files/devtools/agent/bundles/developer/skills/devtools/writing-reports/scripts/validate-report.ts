#!/usr/bin/env -S mise exec -- bun run --install=fallback
/**
 * Validate a report written from the writing-reports template.
 *
 *     validate-report.ts <path-to-index.html>
 *
 * Prints one line per violation and exits 1. Prints "report validation: ok"
 * and exits 0 when the page is clean.
 */
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import { sizeOf } from "./imgsize.ts";

const REQUIRED_ASSETS = [
  "assets/theme/v1/tokens.css",
  "assets/theme/v1/base.css",
  "assets/report/v1/report.css",
  "assets/lightbox/v1/lightbox.js",
];

const PLACEHOLDERS = [
  "TICKET &mdash; report title",
  "short claim",
  "Plain description of the screenshot",
];

function attrsOf(tag: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of tag.matchAll(/(\w+)\s*=\s*"([^"]*)"/g)) out[m[1]] = m[2];
  return out;
}

async function validate(page: string): Promise<string[]> {
  const root = dirname(resolve(page));
  const raw = await Bun.file(page).text();

  // HTML comments carry the template's own instructions, which name the very
  // things this script forbids. Strip them before checking anything.
  const src = raw.replace(/<!--[\s\S]*?-->/g, "");
  const bad: string[] = [];
  const fail = (msg: string) => bad.push(msg);

  // <pre> and <code> contents are exempt from the colour rule.
  const exempt = src
    .replace(/<pre\b[\s\S]*?<\/pre>/gi, "")
    .replace(/<code\b[\s\S]*?<\/code>/gi, "");

  // 1. no <style> block, no style attribute, no inline script body
  if (/<style\b/i.test(src))
    fail("a <style> block is present. Every rule belongs in assets/report/v1/report.css.");
  if (/\sstyle\s*=/i.test(src))
    fail('a style="" attribute is present. Use a class from references/markup.md.');
  for (const m of src.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
    if (m[1].trim())
      fail("an inline <script> body is present. The lightbox is linked, never pasted.");
  }

  // 2. no raw hex colour outside <pre> and <code>
  for (const m of exempt.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
    const at = m.index ?? 0;
    const before = exempt.slice(Math.max(0, at - 8), at);
    if (before.includes('href="') || before.includes("href='")) continue; // an anchor
    const tail = exempt.slice(at, at + 40).split("\n")[0];
    fail(`raw colour ${tail} outside <pre>/<code>. Use a token class instead.`);
  }

  // 3. the four assets, linked in order, sibling-relative
  const seen = REQUIRED_ASSETS.filter((a) => src.includes(a));
  if (seen.join("|") !== REQUIRED_ASSETS.join("|")) {
    fail(
      `assets must be linked in this order and no other: ${REQUIRED_ASSETS.join(", ")} ` +
        `(found: ${seen.join(", ") || "none"})`,
    );
  }
  for (const asset of REQUIRED_ASSETS) {
    if (src.includes(asset) && !existsSync(join(root, asset)))
      fail(`linked asset is missing on disk: ${asset}`);
  }
  if (/(href|src)="\.\.\//.test(src))
    fail("an asset path starts with ../ . The report must be self-contained.");

  // 4. every <img> carries class, src, alt, width, height — and the size is real
  const imgs = [...src.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  if (imgs.length === 0)
    fail("the report has no <img>. A report without screenshots is not evidence.");

  for (const tag of imgs) {
    const attrs = attrsOf(tag);
    for (const need of ["class", "src", "alt", "width", "height"]) {
      if (!attrs[need]) fail(`<img> is missing ${need}: ${tag.slice(0, 90)}`);
    }
    if (attrs.class && !attrs.class.includes("figure__image"))
      fail(`<img> is not class="figure__image": ${tag.slice(0, 90)}`);

    const src_ = attrs.src;
    if (!src_) continue;
    const file = join(root, src_);
    if (!existsSync(file)) {
      fail(`screenshot file is missing: ${src_}`);
      continue;
    }
    if (attrs.width && attrs.height) {
      const size = await sizeOf(file);
      if (!size) {
        fail(
          `cannot read the real size of ${src_}, so its width and height cannot be ` +
            `trusted. Save it as PNG, or install ImageMagick.`,
        );
      } else if (String(size.width) !== attrs.width || String(size.height) !== attrs.height) {
        fail(
          `${src_} declares ${attrs.width}x${attrs.height} but the file is ` +
            `${size.width}x${size.height}. Read sizes with scripts/imgsize.ts, do not guess.`,
        );
      }
    }
  }

  // 5. every .figure holds a .figure__caption
  for (const m of src.matchAll(/<figure\b[^>]*class="([^"]*)"[^>]*>([\s\S]*?)<\/figure>/gi)) {
    if (m[1].includes("figure") && !m[2].includes("figure__caption"))
      fail("a .figure has no .figure__caption. Say what the shot proves.");
  }

  // 6. every summary link resolves to an id that exists
  const ids = new Set([...src.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
  for (const m of src.matchAll(/class="summary__link"\s+href="#([^"]+)"/g)) {
    if (!ids.has(m[1]))
      fail(`summary row links to #${m[1]}, which no element on the page declares.`);
  }
  for (const row of src.matchAll(/<tr class="summary__row">([\s\S]*?)<\/tr>/g)) {
    const cells = [...row[1].matchAll(/<td class="summary__cell">([\s\S]*?)<\/td>/g)].map(
      (m) => m[1],
    );
    if (cells.length > 0 && cells.some((c) => !c.includes("summary__link")))
      fail("a summary row has a cell with no jump link. The whole row must be clickable.");
  }

  // 7. the sections the skill requires
  if (!src.includes('id="notdone"')) {
    fail(
      'the report has no id="notdone" section. A report that hides its gaps is worth ' +
        "less than one that names them.",
    );
  }

  // 8. the template placeholders are gone
  for (const ph of PLACEHOLDERS) {
    if (src.includes(ph)) fail(`template placeholder left in place: "${ph}"`);
  }

  return [...new Set(bad)];
}

if (import.meta.main) {
  const page = Bun.argv[2];
  if (!page || Bun.argv.length !== 3) {
    console.error("usage: validate-report.ts <path-to-index.html>");
    process.exit(2);
  }
  if (!existsSync(page)) {
    console.error(`error: no such file: ${page}`);
    process.exit(1);
  }

  const bad = await validate(page);
  if (bad.length > 0) {
    for (const line of bad) console.log(`  ${line}`);
    console.log(`report validation: ${bad.length} problem(s)`);
    process.exit(1);
  }
  console.log("report validation: ok");
}
