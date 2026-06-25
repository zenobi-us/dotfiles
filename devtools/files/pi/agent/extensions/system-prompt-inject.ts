import { spawn } from "node:child_process";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

type RunOptions = {
  cwd: string;
  timeoutMs: number;
  maxBytes: number;
  signal?: AbortSignal;
};

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_MAX_BYTES = 20_000;

function parseAttrs(attrs: string): { timeoutMs?: number } {
  const timeout = attrs.match(/\btimeout=(\d+)\b/)?.[1];
  return timeout ? { timeoutMs: Number(timeout) * 1_000 } : {};
}

function clip(text: string, maxBytes: number): { text: string; clipped: boolean } {
  const bytes = Buffer.byteLength(text, "utf8");
  if (bytes <= maxBytes) return { text, clipped: false };

  const clipped = Buffer.from(text, "utf8").subarray(0, maxBytes).toString("utf8");
  return { text: `${clipped}\n[pi-inject: truncated at ${maxBytes} bytes]`, clipped: true };
}

function runShell(command: string, options: RunOptions): Promise<string> {
  return new Promise((resolve) => {
    const child = spawn(command, {
      cwd: options.cwd,
      shell: true,
      stdio: ["ignore", "pipe", "pipe"],
      signal: options.signal,
    });

    let output = "";
    const timer = setTimeout(() => child.kill("SIGTERM"), options.timeoutMs);

    const append = (chunk: Buffer) => {
      if (Buffer.byteLength(output, "utf8") <= options.maxBytes) output += chunk.toString("utf8");
    };

    child.stdout.on("data", append);
    child.stderr.on("data", append);
    child.on("error", (error) => resolve(`[pi-inject: ${error.message}]`));
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      const clipped = clip(output.trimEnd(), options.maxBytes).text;
      resolve(`<pi_inject command=${JSON.stringify(command)} exit_code="${code ?? ""}" signal="${signal ?? ""}">\n${clipped}\n</pi_inject>`);
    });
  });
}

async function expandInjects(text: string, options: RunOptions): Promise<string> {
  const fence = /```inject(?:\[(.*?)\])?\n([\s\S]*?)\n```/g;
  text = await replaceAsync(text, fence, async (_match, attrs, command) => {
    const parsed = parseAttrs(attrs ?? "");
    return runShell(command.trim(), { ...options, timeoutMs: parsed.timeoutMs ?? options.timeoutMs });
  });

  const inline = /!`([^`\n]+)`/g;
  return replaceAsync(text, inline, (_match, command) => runShell(command.trim(), options));
}

async function replaceAsync(
  text: string,
  regex: RegExp,
  replacer: (...args: string[]) => Promise<string>,
): Promise<string> {
  const matches = [...text.matchAll(regex)];
  const replacements = await Promise.all(matches.map((match) => replacer(...(match as unknown as string[]))));
  let result = text;
  for (let i = matches.length - 1; i >= 0; i--) {
    const match = matches[i]!;
    result = result.slice(0, match.index) + replacements[i] + result.slice(match.index! + match[0].length);
  }
  return result;
}

export default function systemPromptInject(pi: ExtensionAPI): void {
  pi.on("before_agent_start", async (event, ctx) => {
    if (process.env.PI_INJECT !== "1") return;

    const systemPrompt = await expandInjects(event.systemPrompt, {
      cwd: event.systemPromptOptions.cwd,
      timeoutMs: DEFAULT_TIMEOUT_MS,
      maxBytes: DEFAULT_MAX_BYTES,
      signal: ctx.signal,
    });

    if (systemPrompt === event.systemPrompt) return;
    ctx.ui.notify("Expanded system prompt injections", "info");
    return { systemPrompt };
  });
}

export { expandInjects, parseAttrs };
