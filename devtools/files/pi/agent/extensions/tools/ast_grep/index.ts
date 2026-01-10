/**
 * AST-Grep Tools
 *
 * Search and replace code patterns using AST-aware matching.
 */

import { Type } from "@sinclair/typebox";
import { spawn } from "child_process";

const LANGUAGES = [
  "c", "cpp", "csharp", "css", "dart", "elixir", "go", "haskell", "html",
  "java", "javascript", "json", "kotlin", "lua", "php", "python", "ruby",
  "rust", "scala", "sql", "swift", "tsx", "typescript", "yaml",
] as const;

interface Match {
  file: string;
  range: { start: { line: number; column: number }; end: { line: number; column: number } };
  text: string;
  replacement?: string;
}

async function runSg(args: string[]): Promise<{ matches: Match[]; error?: string }> {
  return new Promise((resolve) => {
    const proc = spawn("sg", args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => (stdout += data.toString()));
    proc.stderr.on("data", (data) => (stderr += data.toString()));

    proc.on("error", (err) => {
      if (err.message.includes("ENOENT")) {
        resolve({ matches: [], error: "ast-grep CLI not found. Install: npm i -g @ast-grep/cli" });
      } else {
        resolve({ matches: [], error: err.message });
      }
    });

    proc.on("close", (code) => {
      if (code !== 0 && !stdout.trim()) {
        resolve({ matches: [], error: stderr.includes("No files found") ? undefined : stderr.trim() || `Exit code ${code}` });
        return;
      }
      if (!stdout.trim()) { resolve({ matches: [] }); return; }
      try {
        resolve({ matches: JSON.parse(stdout) });
      } catch {
        resolve({ matches: [], error: "Failed to parse output" });
      }
    });
  });
}

function formatMatches(matches: Match[], isDryRun = false): string {
  if (matches.length === 0) return "No matches found";
  const MAX = 100;
  const shown = matches.slice(0, MAX);
  const lines = shown.map((m) => {
    const loc = `${m.file}:${m.range.start.line}:${m.range.start.column}`;
    const text = m.text.length > 100 ? m.text.slice(0, 100) + "..." : m.text;
    return isDryRun && m.replacement ? `${loc}\n  - ${text}\n  + ${m.replacement}` : `${loc}: ${text}`;
  });
  if (matches.length > MAX) lines.unshift(`Found ${matches.length} matches (showing first ${MAX}):`);
  return lines.join("\n");
}

const factory: CustomToolFactory = (_pi) => [
  {
    name: "ast_grep_search",
    label: "AST Search",
    description: "Search code patterns using AST-aware matching. Use meta-variables: $VAR (single node), $$$ (multiple). Examples: 'console.log($MSG)', 'def $FUNC($$$):'",
    parameters: Type.Object({
      pattern: Type.String({ description: "AST pattern with meta-variables" }),
      lang: Type.Union(LANGUAGES.map((l) => Type.Literal(l)), { description: "Target language" }),
      paths: Type.Optional(Type.Array(Type.String(), { description: "Paths to search" })),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate) {
      const { pattern, lang, paths } = params as { pattern: string; lang: string; paths?: string[] };
      const args = ["run", "-p", pattern, "--lang", lang, "--json=compact", ...(paths?.length ? paths : ["."])];
      const result = await runSg(args);
      if (result.error) return { content: [{ type: "text", text: `Error: ${result.error}` }], details: {}, isError: true };
      return { content: [{ type: "text", text: formatMatches(result.matches) }], details: { matchCount: result.matches.length } };
    },
  },
  {
    name: "ast_grep_replace",
    label: "AST Replace",
    description: "Replace code patterns with AST-aware rewriting. Dry-run by default. Example: pattern='console.log($MSG)' rewrite='logger.info($MSG)'",
    parameters: Type.Object({
      pattern: Type.String({ description: "AST pattern to match" }),
      rewrite: Type.String({ description: "Replacement pattern" }),
      lang: Type.Union(LANGUAGES.map((l) => Type.Literal(l)), { description: "Target language" }),
      paths: Type.Optional(Type.Array(Type.String(), { description: "Paths to search" })),
      apply: Type.Optional(Type.Boolean({ description: "Apply changes (default: false)" })),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate) {
      const { pattern, rewrite, lang, paths, apply } = params as { pattern: string; rewrite: string; lang: string; paths?: string[]; apply?: boolean };
      const args = ["run", "-p", pattern, "-r", rewrite, "--lang", lang, "--json=compact"];
      if (apply) args.push("--update-all");
      args.push(...(paths?.length ? paths : ["."]));

      const result = await runSg(args);
      if (result.error) return { content: [{ type: "text", text: `Error: ${result.error}` }], details: {}, isError: true };

      let output = formatMatches(result.matches, !apply);
      if (!apply && result.matches.length > 0) output += "\n\n(Dry run - use apply=true to apply)";
      if (apply && result.matches.length > 0) output = `Applied ${result.matches.length} replacements:\n${output}`;

      return { content: [{ type: "text", text: output }], details: { matchCount: result.matches.length, applied: apply } };
    },
  },
];

export default factory;
