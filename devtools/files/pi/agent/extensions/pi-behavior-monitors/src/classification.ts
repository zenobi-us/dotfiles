import { complete } from "@mariozechner/pi-ai";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import nunjucks from "nunjucks";
import { EXAMPLES_DIR, resolveProjectMonitorsDir } from "./discovery";
import { collectors, extractText } from "./context";
import { loadPatterns, formatPatternsForPrompt } from "./patterns";
import { loadInstructions, formatInstructionsForPrompt } from "./rules";
import type { ClassifyResult } from "./types";

function isDir(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Create a Nunjucks environment for monitor prompt templates.
 * Three-tier search: project monitors dir > user monitors dir > package examples.
 */
export function createMonitorTemplateEnv() {
  const projectDir = resolveProjectMonitorsDir();
  const userDir = path.join(os.homedir(), ".pi", "agent", "monitors");
  const searchPaths = [];
  if (isDir(projectDir)) searchPaths.push(projectDir);
  if (isDir(userDir)) searchPaths.push(userDir);
  if (isDir(EXAMPLES_DIR)) searchPaths.push(EXAMPLES_DIR);
  const loader =
    searchPaths.length > 0
      ? new nunjucks.FileSystemLoader(searchPaths)
      : undefined;
  return new nunjucks.Environment(loader, {
    autoescape: false,
    throwOnUndefined: false,
  });
}

export function renderClassifyPrompt(monitor, branch, monitorTemplateEnv) {
  const patterns = loadPatterns(monitor);
  if (patterns.length === 0) return null;
  const instructions = loadInstructions(monitor);
  const collected = {};
  for (const key of monitor.classify.context) {
    const fn = collectors[key];
    if (fn) collected[key] = fn(branch);
    else collected[key] = ""; // unknown collectors produce empty string (graceful degradation)
  }
  const context = {
    patterns: formatPatternsForPrompt(patterns),
    instructions: formatInstructionsForPrompt(instructions),
    iteration: monitor.whileCount,
    ...collected,
  };
  if (monitor.classify.promptTemplate && monitorTemplateEnv) {
    // Nunjucks template file
    try {
      return monitorTemplateEnv.render(
        monitor.classify.promptTemplate,
        context,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(
        `[${monitor.name}] Template render failed (${monitor.classify.promptTemplate}): ${msg}`,
      );
      // Fall through to inline prompt if available
      if (!monitor.classify.prompt) return null;
    }
  }
  // Fallback: inline string with {placeholder} replacement
  if (!monitor.classify.prompt) return null;
  return monitor.classify.prompt.replace(/\{(\w+)\}/g, (match, key) => {
    return String(context[key] ?? match);
  });
}

export function parseVerdict(raw: string): ClassifyResult {
  const text = raw.trim();
  if (text.startsWith("CLEAN")) return { verdict: "clean" };
  if (text.startsWith("NEW:")) {
    const rest = text.slice(4);
    const pipe = rest.indexOf("|");
    if (pipe !== -1)
      return {
        verdict: "new",
        newPattern: rest.slice(0, pipe).trim(),
        description: rest.slice(pipe + 1).trim(),
      };
    return {
      verdict: "new",
      newPattern: rest.trim(),
      description: rest.trim(),
    };
  }
  if (text.startsWith("FLAG:"))
    return { verdict: "flag", description: text.slice(5).trim() };
  return { verdict: "clean" };
}

export function parseModelSpec(spec: string): { provider: string; modelId: string } {
  const slashIndex = spec.indexOf("/");
  if (slashIndex !== -1) {
    return {
      provider: spec.slice(0, slashIndex),
      modelId: spec.slice(slashIndex + 1),
    };
  }
  return { provider: "anthropic", modelId: spec };
}

export async function classifyPrompt(ctx, monitor, prompt, signal) {
  const { provider, modelId } = parseModelSpec(monitor.classify.model);
  const model = ctx.modelRegistry.find(provider, modelId);
  if (!model) throw new Error(`Model ${monitor.classify.model} not found`);
  const apiKey = await ctx.modelRegistry.getApiKey(model);
  if (!apiKey) throw new Error(`No API key for ${monitor.classify.model}`);
  const response = await complete(
    model,
    {
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: prompt }],
          timestamp: Date.now(),
        },
      ],
    },
    { apiKey, maxTokens: 150, signal },
  );
  return parseVerdict(extractText(response.content));
}
