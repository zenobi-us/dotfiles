#!/usr/bin/env -S mise exec -- bun run --install=fallback
/**
 * Create a self-contained HTML report directory from the writing-reports template.
 *
 *     new-report.ts <destination-dir> <title>
 *
 * The destination directory MUST NOT already exist. On success the script
 * prints the path of the created index.html.
 */
import { cp, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const PLACEHOLDER = "TICKET &mdash; report title";

const USAGE = `usage: new-report.ts <destination-dir> <title>

  <destination-dir>  Directory to create. Must not exist.
                     Example: "$ALIGNMENT_ROOT/TICKET-1/manual-tests/report"
  <title>            Report title. Appears in <title> and the page heading.

The created directory is self-contained: index.html, its own assets/ copy and
an empty shots/ directory. Move it anywhere and it still renders.`;

if (import.meta.main) {
  const [dest, title] = Bun.argv.slice(2);
  if (Bun.argv.length !== 4 || !dest || !title) {
    console.error(USAGE);
    process.exit(2);
  }

  const scriptDir = dirname(import.meta.path);
  const template = resolve(scriptDir, "..", "assets", "report-template");

  if (!existsSync(template)) {
    console.error(`error: template missing at ${template}`);
    process.exit(1);
  }
  if (existsSync(dest)) {
    console.error(`error: ${dest} already exists. Refusing to overwrite.`);
    process.exit(1);
  }

  await mkdir(dirname(resolve(dest)), { recursive: true });
  await cp(template, dest, { recursive: true });

  // Stamp the title. The template carries the same placeholder in <title> and
  // in the <h1>, so one substitution covers both.
  const index = join(dest, "index.html");
  const page = await Bun.file(index).text();
  await Bun.write(index, page.replaceAll(PLACEHOLDER, title));

  console.log(index);
  console.error(`next: save screenshots into ${join(dest, "shots")} as NN-slug.png`);
  console.error(`      read their sizes with: ${join(scriptDir, "imgsize.ts")} ${join(dest, "shots")}/*.png`);
  console.error(`      then validate with: ${join(scriptDir, "validate-report.ts")} ${index}`);
}
