/**
 * # at-include
 *
 * Expands `@file` references from Pi prompts and AGENTS.md context into the
 * system prompt before the model starts.
 *
 * ## User guide
 *
 * Put file references in `AGENTS.md`, `.pi/prompts/*.md`,
 * `~/.pi/agent/prompts/*.md`, or directly in a prompt:
 *
 * ```md
 * Read @./docs/api.md before changing routes.
 * Use @~/.pi/agent/prompts/review-rules.md for review rules.
 * Include @"docs/file with spaces.md" too.
 * ```
 *
 * Supported unquoted references must look like file paths and end in a known
 * text extension (`.md`, `.txt`, `.json`, `.yaml`, `.toml`, `.ts`, etc.). Quote
 * paths with spaces.
 *
 * Resolution order for relative references:
 * 1. Directory of the file containing the reference
 * 2. Current working directory
 * 3. Project `.pi/prompts/`
 * 4. Global `~/.pi/agent/prompts/`
 *
 * The extension injects matched files as:
 *
 * ```xml
 * <at_file_includes>
 *   <file path="..." ref="...">...</file>
 * </at_file_includes>
 * ```
 *
 * Limits: files over `MAX_BYTES` are skipped, recursive references are followed,
 * and cycles are reported instead of expanded forever.
 */
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const MAX_BYTES = 200_000;
const REF_RE = /@(?:"([^"]+)"|'([^']+)'|((?:~\/|\.{1,2}\/|\/|[A-Za-z0-9_.-]+\/)?[A-Za-z0-9_./~-]+\.(?:md|txt|json|ya?ml|toml|ts|tsx|js|jsx|css|html|sh|py|rs|go)))/g;

type Include = { ref: string; file: string; text: string; error?: never } | { ref: string; file?: string; text?: never; error: string };

type ContextFile = { path?: string; content?: string; text?: string };
/** Expands `~/...` because AGENTS.md and prompt templates often use shell-style paths. */

function expandHome(p: string): string {
  return p === "~" || p.startsWith("~/") ? path.join(os.homedir(), p.slice(2)) : p;
}
/**
 * Returns the small set of places users expect `@foo.md` to resolve from.
 *
 * The source file directory comes first so references inside shared prompt files
 * remain portable when the project cwd changes.
 */

function candidates(ref: string, baseDir: string, cwd: string): string[] {
  const expanded = expandHome(ref);
  if (path.isAbsolute(expanded)) return [expanded];

  return [
    path.resolve(baseDir, expanded),
    path.resolve(cwd, expanded),
    path.resolve(cwd, ".pi/prompts", expanded),
    path.resolve(os.homedir(), ".pi/agent/prompts", expanded),
  ];
}
/** Finds unique at-sign file references without treating emails or package names as files. */

function refsIn(text: string): string[] {
  const refs = new Set<string>();
  for (const match of text.matchAll(REF_RE)) refs.add(match[1] ?? match[2] ?? match[3]);
  return [...refs];
}
/**
 * Reads one include target, enforcing size and cycle guards.
 *
 * Missing files are returned as data instead of thrown errors so the model sees
 * exactly which reference failed and the turn can continue.
 */

async function readInclude(ref: string, baseDir: string, cwd: string, seen: Set<string>): Promise<Include> {
  for (const file of candidates(ref, baseDir, cwd)) {
    try {
      const stat = await fs.stat(file);
      if (!stat.isFile()) continue;
      if (stat.size > MAX_BYTES) return { ref, file, error: `too large (${stat.size} bytes)` };
      const real = await fs.realpath(file);
      if (seen.has(real)) return { ref, file, error: "cycle skipped" };
      seen.add(real);
      return { ref, file: real, text: await fs.readFile(real, "utf8") };
    } catch {
      // try next candidate
    }
  }
  return { ref, error: "not found" };
}
/** Recursively follows includes so prompt snippets can compose other snippets. */

async function collectIncludes(text: string, baseDir: string, cwd: string, seen: Set<string>): Promise<Include[]> {
  const out: Include[] = [];
  for (const ref of refsIn(text)) {
    const include = await readInclude(ref, baseDir, cwd, seen);
    out.push(include);
    if (include.text) out.push(...await collectIncludes(include.text, path.dirname(include.file), cwd, seen));
  }
  return out;
}
/** Serializes include results into an XML-ish block that is easy for the model to scan. */

function renderIncludes(includes: Include[]): string {
  if (!includes.length) return "";
  return [
    "\n\n<at_file_includes>",
    ...includes.map((i) => i.error
      ? `<missing ref=${JSON.stringify(i.ref)}>${i.error}</missing>`
      : `<file path=${JSON.stringify(i.file)} ref=${JSON.stringify(i.ref)}>\n${i.text}\n</file>`),
    "</at_file_includes>",
  ].join("\n");
}

/** Registers the turn hook. No startup work; extension stays cheap until a prompt runs. */
export default function atInclude(pi: ExtensionAPI): void {
  pi.on("before_agent_start", async (event, ctx) => {
    const seen = new Set<string>();
    const all: Include[] = [];

    all.push(...await collectIncludes(event.prompt ?? "", ctx.cwd, ctx.cwd, seen));

    for (const file of (event.systemPromptOptions.contextFiles ?? []) as ContextFile[]) {
      const text = file.content ?? file.text ?? "";
      if (!text || !file.path) continue;
      all.push(...await collectIncludes(text, path.dirname(file.path), ctx.cwd, seen));
    }

    const block = renderIncludes(all);
    if (!block) return;
    return { systemPrompt: event.systemPrompt + block };
  });
}
