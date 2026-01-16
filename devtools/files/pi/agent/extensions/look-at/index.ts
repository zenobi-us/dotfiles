/**
 * Look At Tool
 *
 * Extract key information from a file to save context tokens.
 */

import { Type } from "@sinclair/typebox";
import { readFileSync, statSync } from "fs";
import { extname, basename } from "path";
import type { ExtensionFactory } from "@mariozechner/pi-coding-agent";

const LARGE_FILE_THRESHOLD = 100 * 1024;
const MAX_LINES_WITHOUT_EXTRACT = 200;

function extractStructure(content: string, ext: string): string {
  const lines = content.split("\n");

  if ([".ts", ".tsx", ".js", ".jsx"].includes(ext)) {
    const output: string[] = ["## Structure\n"];
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (/^(export |class |interface |type |function |const |async function )/.test(trimmed)) {
        output.push(`Line ${i + 1}: ${trimmed.slice(0, 80)}${trimmed.length > 80 ? "..." : ""}`);
      }
    }
    return output.join("\n");
  }

  if (ext === ".py") {
    const output: string[] = ["## Structure\n"];
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (/^(class |def |async def |@)/.test(trimmed)) {
        output.push(`Line ${i + 1}: ${trimmed.slice(0, 80)}${trimmed.length > 80 ? "..." : ""}`);
      }
    }
    return output.join("\n");
  }

  if (ext === ".go") {
    const output: string[] = ["## Structure\n"];
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (/^(type |func |package )/.test(trimmed)) {
        output.push(`Line ${i + 1}: ${trimmed.slice(0, 80)}${trimmed.length > 80 ? "..." : ""}`);
      }
    }
    return output.join("\n");
  }

  if (ext === ".md") {
    const output: string[] = ["## Outline\n"];
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith("#")) {
        output.push(`Line ${i + 1}: ${lines[i]}`);
      }
    }
    return output.join("\n");
  }

  if (ext === ".json") {
    try {
      const obj = JSON.parse(content);
      const keys = Object.keys(obj);
      return `## Top-level keys (${keys.length})\n\n${keys.slice(0, 50).join(", ")}${keys.length > 50 ? "..." : ""}`;
    } catch {
      return "## Invalid JSON";
    }
  }

  // Generic
  const total = lines.length;
  return `## File Preview (${total} lines)\n\n### First 10 lines:\n${lines.slice(0, 10).join("\n")}\n\n### Last 5 lines:\n${lines.slice(-5).join("\n")}`;
}

const factory: ExtensionFactory = (pi) => {
  pi.registerTool({
    name: "look_at",
    label: "Look At",
    description: `Extract key information from a file to save context tokens.
For large files, returns structure/outline instead of full content.
Use when you need to understand a file without loading all content.`,
    parameters: Type.Object({
      filePath: Type.String({ description: "Path to the file" }),
    }),
    async execute(_toolCallId, params, _onUpdate, _ctx, _signal) {
      try {
        const filePath = params.filePath;
        const stats = statSync(filePath);
        const ext = extname(filePath).toLowerCase();
        const name = basename(filePath);
        const content = readFileSync(filePath, "utf-8");
        const lines = content.split("\n");

        if (stats.size < LARGE_FILE_THRESHOLD && lines.length <= MAX_LINES_WITHOUT_EXTRACT) {
          return {
            content: [{ type: "text", text: `## ${name} (${lines.length} lines)\n\n${content}` }],
            details: { full: true, lines: lines.length },
          };
        }

        let output = `## ${name}\n**Size**: ${Math.round(stats.size / 1024)}KB | **Lines**: ${lines.length}\n\n`;
        output += extractStructure(content, ext);
        output += `\n\n---\n*Use Read tool with line offset/limit for specific sections*`;

        return {
          content: [{ type: "text", text: output }],
          details: { full: false, lines: lines.length, size: stats.size },
        };
      } catch (e) {
        return {
          content: [{ type: "text", text: `Error: ${e instanceof Error ? e.message : String(e)}` }],
          details: {},
          isError: true,
        };
      }
    },
  });
};

export default factory;
