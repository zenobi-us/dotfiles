
import { spawn } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { ExtensionAPI, ExtensionContext, Theme } from "@earendil-works/pi-coding-agent";
import { SessionManager, getAgentDir, type SessionInfo } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import {
  Key,
  matchesKey,
  type AutocompleteItem,
  type Component,
  type Focusable,
  type KeybindingsManager,
  truncateToWidth,
  type TUI,
  visibleWidth,
} from "@earendil-works/pi-tui";

const EXTENSION_KEY = "session-mention";
const SESSION_REF_PREFIX = "@S-";
const CACHE_TTL_MS = 60_000;
const MAX_VISIBLE_SESSIONS = 14;
const SESSION_AUTOCOMPLETE_TIMESTAMP_WIDTH = 6;
const SUMMARY_TIMEOUT_MS = 45_000;
const SUMMARY_TIMEOUT_SECONDS = Math.round(SUMMARY_TIMEOUT_MS / 1000);
const SESSION_EXCERPT_BUDGETS = [60_000, 25_000, 12_000];
const MAX_SESSION_EXCERPT_MESSAGES = 120;
const SESSION_CONFIG_PATH = join(getAgentDir(), "sessions.json");
const SESSION_LOG_PATH = join(getAgentDir(), "pi-sessions.log");
const DEFAULT_SUMMARY_CONFIG = {
  summary: {
    provider: "openai-codex",
    model: "gpt-5.5",
  },
};

let sessionsCache: { loadedAt: number; promise: Promise<SessionInfo[]> } | undefined;
let sessionMentionPickerOpen = false;

type SessionItem = AutocompleteItem & {
  createdMs: number;
  searchable: string;
};

function normalizeTitle(text: string | undefined): string {
  const cleaned = (text ?? "").replace(/\s+/g, " ").trim();
  return cleaned.length > 0 ? cleaned : "Untitled session";
}

function clip(text: string, max = 72): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

function extractText(content: unknown): string {
  if (typeof content === "string") return content.trim();
  if (!Array.isArray(content)) return "";
  return content
    .map((part) => {
      if (!part || typeof part !== "object") return "";
      const block = part as { type?: string; text?: string };
      return block.type === "text" && typeof block.text === "string" ? block.text : "";
    })
    .filter(Boolean)
    .join("\n")
    .trim();
}

function writeSessionLog(event: string, details: string): void {
  try {
    appendFileSync(SESSION_LOG_PATH, `[${new Date().toISOString()}] ${event}: ${details}\n`, "utf8");
  } catch {
    // Logging must never break session commands.
  }
}

function sessionReference(sessionId: string): string {
  return `${SESSION_REF_PREFIX}${sessionId}`;
}

function extractSessionRefs(text: string): string[] {
  return [...text.matchAll(/@S-([A-Za-z0-9_-]+)/g)].map((match) => `${SESSION_REF_PREFIX}${match[1]}`);
}

type SummaryConfig = {
  provider: string;
  model: string;
  thinking: string;
};

type SessionFileEntry = {
  type?: string;
  id?: string;
  parentId?: string | null;
  timestamp?: string;
  message?: unknown;
  summary?: string;
  provider?: string;
  modelId?: string;
  thinkingLevel?: string;
  command?: string;
  output?: string;
  role?: string;
  content?: unknown;
  toolName?: string;
  isError?: boolean;
};

type SpawnResult = {
  stdout: string;
  stderr: string;
  code: number | null;
  signal: NodeJS.Signals | null;
};

function loadSummaryConfig(): SummaryConfig {
  try {
    const raw = JSON.parse(readFileSync(SESSION_CONFIG_PATH, "utf8")) as Partial<{ summary: Partial<SummaryConfig> }>;
    writeSessionLog("config", `loaded ${SESSION_CONFIG_PATH}`);
    return {
      provider: raw.summary?.provider?.trim() || DEFAULT_SUMMARY_CONFIG.summary.provider,
      model: raw.summary?.model?.trim() || DEFAULT_SUMMARY_CONFIG.summary.model,
      thinking: raw.summary?.thinking?.trim() || "off",
    };
  } catch (error) {
    writeSessionLog("config", `fallback to defaults (${error instanceof Error ? error.message : String(error)})`);
    return { ...DEFAULT_SUMMARY_CONFIG.summary, thinking: "off" };
  }
}

function extractSessionMessageText(message: unknown): string {
  if (!message || typeof message !== "object") return "";
  const block = message as SessionFileEntry;
  if (block.role === "bashExecution") {
    return [typeof block.command === "string" ? `Command: ${block.command}` : "", typeof block.output === "string" ? block.output : ""]
      .filter(Boolean)
      .join("\n")
      .trim();
  }
  if (block.role === "branchSummary" || block.role === "compactionSummary") {
    return typeof block.summary === "string" ? block.summary.trim() : "";
  }
  if (typeof block.content !== "undefined") return extractText(block.content);
  if (typeof block.output === "string") return block.output.trim();
  if (typeof block.summary === "string") return block.summary.trim();
  return "";
}

function normalizeFocusTokens(focus: string): string[] {
  return [...new Set((focus.toLowerCase().match(/[a-z0-9_-]{4,}/g) ?? []).slice(0, 12))];
}

function readSessionFileEntries(sessionPath: string): SessionFileEntry[] {
  const entries: SessionFileEntry[] = [];
  const lines = readFileSync(sessionPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      entries.push(JSON.parse(line) as SessionFileEntry);
    } catch {
      // Skip malformed lines.
    }
  }
  return entries;
}

function buildSessionExcerpt(sessionPath: string, focus: string, maxChars: number, maxEntries = MAX_SESSION_EXCERPT_MESSAGES): string {
  const entries = readSessionFileEntries(sessionPath);
  const byId = new Map<string, SessionFileEntry>();
  let leaf: SessionFileEntry | undefined;

  for (const entry of entries) {
    if (entry.id) byId.set(entry.id, entry);
    if (entry.id) leaf = entry;
  }

  const branch: SessionFileEntry[] = [];
  for (let current = leaf; current;) {
    branch.push(current);
    if (!current.parentId) break;
    current = byId.get(current.parentId) ?? undefined;
  }
  branch.reverse();

  const focusTokens = normalizeFocusTokens(focus);
  let selected = branch;
  if (focusTokens.length > 0) {
    const matches = branch
      .map((entry, index) => ({ entry, index, text: extractSessionMessageText((entry as SessionFileEntry).message ?? entry) }))
      .filter(({ text }) => focusTokens.some((token) => text.toLowerCase().includes(token)));
    if (matches.length > 0) {
      const pivot = matches[matches.length - 1]!.index;
      const start = Math.max(0, pivot - Math.floor(maxEntries / 3));
      const end = Math.min(branch.length, start + maxEntries);
      selected = branch.slice(start, end);
    }
  }

  if (selected.length > maxEntries) selected = selected.slice(selected.length - maxEntries);

  const linesOut = selected
    .map((entry) => {
      const timestamp = typeof entry.timestamp === "string" ? entry.timestamp : "";
      const kind = entry.type ?? "entry";
      const text = kind === "message" ? extractSessionMessageText(entry.message) : typeof entry.summary === "string" ? entry.summary : "";
      if (!text.trim()) return "";
      return `${timestamp ? `[${timestamp}] ` : ""}${kind}: ${clip(text.trim(), 1200)}`;
    })
    .filter(Boolean);

  let excerpt = linesOut.join("\n\n").trim();
  if (!excerpt) {
    excerpt = readFileSync(sessionPath, "utf8")
      .split(/\r?\n/)
      .filter(Boolean)
      .slice(-80)
      .join("\n")
      .trim();
  }
  if (excerpt.length > maxChars) excerpt = excerpt.slice(excerpt.length - maxChars);
  return excerpt;
}

function isContextLengthExceeded(stderr: string): boolean {
  return /context_length_exceeded/i.test(stderr);
}

function spawnCommand(command: string, args: string[], stdinText: string, signal: AbortSignal | undefined, timeoutMs?: number): Promise<SpawnResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: process.env,
      signal,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let timer: ReturnType<typeof setTimeout> | undefined;

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (code, procSignal) => {
      if (timer) clearTimeout(timer);
      resolve({ stdout, stderr, code, signal: procSignal });
    });

    if (timeoutMs) {
      timer = setTimeout(() => {
        child.kill("SIGTERM");
      }, timeoutMs);
    }

    if (stdinText.length > 0) {
      child.stdin.write(stdinText);
    }
    child.stdin.end();
  });
}

async function runPiSummary(prompt: string, stdinText: string, summaryConfig: SummaryConfig, signal: AbortSignal | undefined, timeoutMs: number): Promise<SpawnResult> {
  const args = [
    "--provider",
    summaryConfig.provider,
    "--model",
    summaryConfig.model,
    "--thinking",
    summaryConfig.thinking,
    "-p",
    "--no-session",
    "--no-tools",
    "--no-extensions",
    "--no-skills",
    "--no-prompt-templates",
    "--no-context-files",
    prompt,
  ];

  try {
    return await spawnCommand("timeout", [`${SUMMARY_TIMEOUT_SECONDS}s`, "pi", ...args], stdinText, signal);
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String((error as { code?: unknown }).code) : "";
    if (code !== "ENOENT") throw error;
    writeSessionLog("summarize:timeout_fallback", "timeout binary not found; using node timeout");
    return spawnCommand("pi", args, stdinText, signal, timeoutMs);
  }
}

async function summarizeSessionWithPi(
  sessionPath: string,
  focus: string,
  signal: AbortSignal | undefined,
  ctx: ExtensionContext,
): Promise<string> {
  const summaryConfig = loadSummaryConfig();
  const prompt = [
    "Summarize the following pi session excerpt and return only the most relevant excerpt plus a short rationale.",
    "Use markdown headings exactly: ## Excerpt and ## Rationale.",
    focus ? `Focus: ${focus}` : "Focus on the user's current request and the most useful surrounding context.",
  ].join("\n");
  const commandPreview = `timeout ${SUMMARY_TIMEOUT_SECONDS}s pi --provider ${summaryConfig.provider} --model ${summaryConfig.model} --thinking ${summaryConfig.thinking} -p --no-session --no-tools --no-extensions --no-skills --no-prompt-templates --no-context-files`;

  for (let i = 0; i < SESSION_EXCERPT_BUDGETS.length; i += 1) {
    const excerptBudget = SESSION_EXCERPT_BUDGETS[i]!;
    const transcript = buildSessionExcerpt(sessionPath, focus, excerptBudget);
    writeSessionLog(
      "summarize:start",
      `cmd=${commandPreview} transcriptChars=${transcript.length} excerptBudget=${excerptBudget} sessionPath=${sessionPath} focus=${focus || "<none>"}`,
    );
    ctx.ui.setStatus(EXTENSION_KEY, `Spawning ${commandPreview}...`);
    try {
      const { stdout } = await runPiSummary(prompt, transcript, summaryConfig, signal, SUMMARY_TIMEOUT_MS);
      const output = stdout.trim();
      if (!output) {
        throw new Error("pi returned empty output");
      }
      writeSessionLog("summarize:ok", `sessionPath=${sessionPath} outputChars=${output.length}`);
      return output;
    } catch (error) {
      const code = typeof error === "object" && error && "code" in error ? String((error as { code?: unknown }).code) : "";
      const stderr = typeof error === "object" && error && "stderr" in error && typeof (error as { stderr?: unknown }).stderr === "string" ? (error as { stderr: string }).stderr.trim() : "";
      const message = error instanceof Error ? error.message : String(error);
      writeSessionLog("summarize:fail", `sessionPath=${sessionPath} code=${code || "<none>"} stderr=${stderr || "<none>"} message=${message}`);
      if (isContextLengthExceeded(stderr) && i < SESSION_EXCERPT_BUDGETS.length - 1) {
        writeSessionLog("summarize:retry", `context_length_exceeded; reducing excerpt budget to ${SESSION_EXCERPT_BUDGETS[i + 1]}`);
        continue;
      }
      throw error;
    } finally {
      ctx.ui.setStatus(EXTENSION_KEY, undefined);
    }
  }

  throw new Error("Unable to summarize session after excerpt retries.");
}

function formatSessionTimestamp(date: Date): string {
  const elapsedMs = Math.max(0, Date.now() - date.getTime());
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;
  const year = 365 * day;

  if (elapsedMs < minute) return "now";
  if (elapsedMs < hour) return `${Math.floor(elapsedMs / minute)}m ago`;
  if (elapsedMs < day) return `${Math.floor(elapsedMs / hour)}h ago`;
  if (elapsedMs < week) return `${Math.floor(elapsedMs / day)}d ago`;
  if (elapsedMs < month) return `${Math.floor(elapsedMs / week)}w ago`;
  if (elapsedMs < year) return `${Math.floor(elapsedMs / month)}mo ago`;
  return `${Math.floor(elapsedMs / year)}y ago`;
}

function formatSessionItem(session: SessionInfo): SessionItem {
  const title = clip(normalizeTitle(session.name ?? session.firstMessage), 160);
  return {
    value: sessionReference(session.id),
    label: title,
    description: formatSessionTimestamp(session.created),
    createdMs: session.created.getTime(),
    searchable: `${title} ${session.id} ${session.firstMessage ?? ""}`,
  };
}

function formatSessionAutocompleteLabel(item: SessionItem): string {
  const timestamp = (item.description ?? "").padEnd(SESSION_AUTOCOMPLETE_TIMESTAMP_WIDTH).slice(0, SESSION_AUTOCOMPLETE_TIMESTAMP_WIDTH);
  return `${timestamp} ${item.label}`;
}

function sessionAutocompleteItems(sessions: SessionInfo[], query: string): AutocompleteItem[] {
  const items = sessions.map(formatSessionItem);
  const trimmed = query
    .trim()
    .replace(/^@@/, "")
    .trim();
  const queryTokens = trimmed.toLowerCase().match(/[a-z0-9_-]+/g) ?? [];
  const filtered = queryTokens.length === 0
    ? items
    : items.filter((item) => {
      const searchable = item.searchable.toLowerCase();
      return queryTokens.every((token) => searchable.includes(token));
    });
  return filtered
    .sort((a, b) => b.createdMs - a.createdMs)
    .map((item) => ({ value: item.value, label: formatSessionAutocompleteLabel(item) }))
    .slice(0, 50);
}

async function loadSessions(ctx?: ExtensionContext): Promise<SessionInfo[]> {
  const fresh = sessionsCache && Date.now() - sessionsCache.loadedAt < CACHE_TTL_MS ? sessionsCache : undefined;
  if (fresh) {
    writeSessionLog("loadSessions:cache", "using cached session list");
    return fresh.promise;
  }

  writeSessionLog("loadSessions:start", "scanning session index");
  const promise = SessionManager.listAll((loaded, total) => {
    if (!ctx?.hasUI) return;
    ctx.ui.setStatus(EXTENSION_KEY, `Scanning sessions ${loaded}/${total}`);
  });

  sessionsCache = { loadedAt: Date.now(), promise };

  try {
    const sessions = await promise;
    writeSessionLog("loadSessions:ok", `count=${sessions.length}`);
    return sessions.sort((a, b) => {
      const createdDelta = b.created.getTime() - a.created.getTime();
      if (createdDelta !== 0) return createdDelta;
      const modifiedDelta = b.modified.getTime() - a.modified.getTime();
      if (modifiedDelta !== 0) return modifiedDelta;
      return normalizeTitle(a.name ?? a.firstMessage).localeCompare(normalizeTitle(b.name ?? b.firstMessage));
    });
  } catch (error) {
    sessionsCache = undefined;
    writeSessionLog("loadSessions:fail", error instanceof Error ? error.message : String(error));
    throw error;
  } finally {
    if (ctx?.hasUI) ctx.ui.setStatus(EXTENSION_KEY, undefined);
  }
}

class AmpSessionMentionPicker implements Component, Focusable {
  private _focused = false;
  private query = "";
  private selectedIndex = 0;
  private scrollOffset = 0;
  onSelect?: (reference: string) => void;
  onCancel?: () => void;

  constructor(
    private readonly tui: TUI,
    private readonly sessions: SessionInfo[],
    private readonly theme: Theme,
    private readonly keybindings: KeybindingsManager,
    initialQuery = "",
  ) {
    this.query = initialQuery;
  }

  get focused(): boolean {
    return this._focused;
  }

  set focused(value: boolean) {
    this._focused = value;
  }

  handleInput(data: string): void {
    const filtered = this.filteredItems();
    if (this.keybindings.matches(data, "tui.select.cancel") || matchesKey(data, Key.escape) || matchesKey(data, Key.ctrl("c"))) {
      this.onCancel?.();
      return;
    }
    if (this.keybindings.matches(data, "tui.select.up") || matchesKey(data, Key.up)) {
      this.selectedIndex = filtered.length === 0 ? 0 : Math.max(0, this.selectedIndex - 1);
      this.ensureSelectionVisible();
      this.tui.requestRender();
      return;
    }
    if (this.keybindings.matches(data, "tui.select.down") || matchesKey(data, Key.down)) {
      this.selectedIndex = filtered.length === 0 ? 0 : Math.min(filtered.length - 1, this.selectedIndex + 1);
      this.ensureSelectionVisible();
      this.tui.requestRender();
      return;
    }
    if (this.keybindings.matches(data, "tui.select.confirm") || matchesKey(data, Key.enter)) {
      const selected = filtered[this.selectedIndex];
      if (selected) this.onSelect?.(selected.value);
      return;
    }
    if (this.keybindings.matches(data, "tui.editor.deleteCharBackward") || matchesKey(data, Key.backspace)) {
      this.query = this.query.slice(0, -1);
      this.resetSelection();
      return;
    }
    if (data.length === 1 && data >= " " && data !== "\x7f") {
      this.query += data;
      this.resetSelection();
    }
  }

  render(width: number): string[] {
    const boxWidth = Math.max(40, width);
    const innerWidth = Math.max(1, boxWidth - 4);
    const filtered = this.filteredItems();
    this.selectedIndex = filtered.length === 0 ? 0 : Math.min(this.selectedIndex, filtered.length - 1);
    this.ensureSelectionVisible();
    const rows = filtered.slice(this.scrollOffset, this.scrollOffset + MAX_VISIBLE_SESSIONS).map((item, index) =>
      this.renderItem(item, this.scrollOffset + index === this.selectedIndex, innerWidth),
    );
    if (rows.length === 0) rows.push(this.theme.fg("warning", "No sessions match"));
    return [
      topBorder(boxWidth, this.theme, " Mention Session "),
      wrapPickerContent(this.renderInput(innerWidth), boxWidth, this.theme),
      wrapPickerContent("", boxWidth, this.theme),
      ...rows.map((row) => wrapPickerContent(row, boxWidth, this.theme)),
      wrapPickerContent(this.theme.fg("dim", `(${Math.min(filtered.length, MAX_VISIBLE_SESSIONS)}/${filtered.length})`), boxWidth, this.theme),
      bottomBorder(boxWidth, this.theme),
    ];
  }

  invalidate(): void { }

  private resetSelection(): void {
    this.selectedIndex = 0;
    this.scrollOffset = 0;
    this.tui.requestRender();
  }

  private ensureSelectionVisible(): void {
    if (this.selectedIndex < this.scrollOffset) this.scrollOffset = this.selectedIndex;
    const lastVisible = this.scrollOffset + MAX_VISIBLE_SESSIONS - 1;
    if (this.selectedIndex > lastVisible) this.scrollOffset = this.selectedIndex - MAX_VISIBLE_SESSIONS + 1;
  }

  private filteredItems(): AutocompleteItem[] {
    return sessionAutocompleteItems(this.sessions, this.query);
  }

  private renderInput(width: number): string {
    return truncateToWidth(`${this.theme.fg("dim", "> ")}${this.theme.fg("text", this.query)}`, width, "…", true);
  }

  private renderItem(item: AutocompleteItem, selected: boolean, width: number): string {
    const marker = selected ? this.theme.fg("accent", "→ ") : "  ";
    const text = selected ? this.theme.fg("accent", item.label) : this.theme.fg("text", item.label);
    return truncateToWidth(`${marker}${text}`, width, "…", true);
  }
}

function topBorder(width: number, theme: Theme, titleText: string): string {
  const innerWidth = Math.max(0, width - 2);
  const titleWidth = visibleWidth(titleText);
  if (innerWidth < titleWidth + 2) return theme.fg("accent", `╭${"─".repeat(innerWidth)}╮`);
  const leftFill = Math.max(1, Math.floor((innerWidth - titleWidth) / 2));
  const rightFill = Math.max(0, innerWidth - titleWidth - leftFill);
  return theme.fg("accent", `╭${"─".repeat(leftFill)}`) + theme.fg("accent", theme.bold(titleText)) + theme.fg("accent", `${"─".repeat(rightFill)}╮`);
}

function bottomBorder(width: number, theme: Theme): string {
  const innerWidth = Math.max(0, width - 2);
  return theme.fg("accent", `╰${"─".repeat(innerWidth)}╯`);
}

function wrapPickerContent(line: string, width: number, theme: Theme): string {
  const innerWidth = Math.max(1, width - 4);
  const clipped = truncateToWidth(line, innerWidth, "", true);
  return `${theme.fg("accent", "│")} ${padVisible(clipped, innerWidth)} ${theme.fg("accent", "│")}`;
}

function padVisible(line: string, width: number): string {
  return `${line}${" ".repeat(Math.max(0, width - visibleWidth(line)))}`;
}

async function showSessionMentionPicker(ctx: ExtensionContext, sessions: SessionInfo[], initialQuery = ""): Promise<string | null> {
  return ctx.ui.custom<string | null>(
    (tui, theme, keybindings, done) => {
      const picker = new AmpSessionMentionPicker(tui, sessions, theme, keybindings, initialQuery);
      picker.onSelect = (value) => done(value);
      picker.onCancel = () => done(null);
      return picker;
    },
    {
      overlay: true,
      overlayOptions: {
        anchor: "center",
        width: "90%",
        minWidth: 42,
        maxHeight: "80%",
        margin: 1,
      },
    },
  );
}

function openSessionMentionPickerFromEditor(ctx: ExtensionContext, initialQuery = ""): void {
  if (sessionMentionPickerOpen) return;
  sessionMentionPickerOpen = true;
  void (async () => {
    const sessions = await loadSessions(ctx);
    if (sessions.length === 0) {
      ctx.ui.notify("No sessions found.", "info");
      return;
    }

    const reference = await showSessionMentionPicker(ctx, sessions, initialQuery);
    if (!reference) return;
    ctx.ui.pasteToEditor(reference);
    ctx.ui.notify(`Inserted ${reference}`, "info");
  })().catch((error) => {
    ctx.ui.notify(`Session picker failed: ${error instanceof Error ? error.message : String(error)}`, "error");
  }).finally(() => {
    sessionMentionPickerOpen = false;
  });
}

export default function sessionsExtension(pi: ExtensionAPI) {
  pi.registerCommand("mention", {
    description: "[session] Pick a session and insert @S-id",
    getArgumentCompletions: async (argumentPrefix) => sessionAutocompleteItems(await loadSessions(), argumentPrefix),
    handler: async (args, ctx) => {
      const trimmedArgs = args.trim();
      const argReference = trimmedArgs.split(/\s+/)[0];
      if (argReference?.startsWith(SESSION_REF_PREFIX)) {
        const rest = trimmedArgs.slice(argReference.length).trimStart();
        const replacement = rest ? `${argReference} ${rest}` : argReference;
        ctx.ui.pasteToEditor(replacement);
        ctx.ui.notify(`Inserted ${argReference}`, "info");
        return;
      }

      if (ctx.mode !== "tui") {
        ctx.ui.notify("/mention requires an interactive TUI.", "warning");
        return;
      }

      const sessions = await loadSessions(ctx);
      if (sessions.length === 0) {
        ctx.ui.notify("No sessions found.", "info");
        return;
      }

      if (!trimmedArgs) {
        const reference = await showSessionMentionPicker(ctx, sessions);
        if (!reference) return;
        ctx.ui.pasteToEditor(reference);
        ctx.ui.notify(`Inserted ${reference}`, "info");
        return;
      }

      const reference = sessionAutocompleteItems(sessions, trimmedArgs)[0]?.value;
      if (!reference) {
        ctx.ui.notify(`No matching session for: ${trimmedArgs}`, "warning");
        return;
      }

      ctx.ui.pasteToEditor(reference);
      ctx.ui.notify(`Inserted ${reference}`, "info");
    },
  });

  pi.registerTool({
    name: "read_session",
    label: "Read Session",
    description: "Fetch a referenced session via a separate pi process and extract the relevant excerpt.",
    promptSnippet: "Read session references like @S-<session-id>",
    promptGuidelines: [
      "Use read_session immediately when the user's message contains an @S-<session-id> reference.",
      "Resolve every @S- reference before answering the user.",
    ],
    parameters: Type.Object({
      sessionRef: Type.String({ description: "Session reference in the form @S-<session-id>" }),
      focus: Type.Optional(Type.String({ description: "Optional focus for extraction" })),
    }),
    async execute(_toolCallId, params, signal, onUpdate, ctx) {
      const sessionRef = typeof params.sessionRef === "string" ? params.sessionRef.trim() : "";
      const focus = typeof params.focus === "string" ? params.focus.trim() : "";
      const sessionId = sessionRef.startsWith(SESSION_REF_PREFIX) ? sessionRef.slice(SESSION_REF_PREFIX.length).trim() : "";
      if (!sessionId) {
        writeSessionLog("read_session:invalid", `sessionRef=${sessionRef || "<empty>"}`);
        return { content: [{ type: "text", text: `Invalid session reference: ${sessionRef}` }], isError: true };
      }

      const sessions = await loadSessions(ctx);
      const session = sessions.find((item) => item.id === sessionId);
      if (!session) {
        writeSessionLog("read_session:not_found", `sessionRef=${sessionRef}`);
        return { content: [{ type: "text", text: `Session not found: ${sessionRef}` }], isError: true };
      }

      writeSessionLog("read_session:start", `sessionRef=${sessionRef} sessionPath=${session.path} focus=${focus || "<none>"}`);
      onUpdate?.({ content: [{ type: "text", text: `Reading ${sessionRef}...` }] });

      try {
        const text = await summarizeSessionWithPi(session.path, focus, signal, ctx);
        writeSessionLog("read_session:ok", `sessionRef=${sessionRef} sessionPath=${session.path} outputChars=${text.length}`);
        return {
          content: [{ type: "text", text: text || "No relevant excerpt found." }],
          details: { sessionRef, sessionPath: session.path },
        };
      } catch (error) {
        if (signal?.aborted) {
          writeSessionLog("read_session:aborted", `sessionRef=${sessionRef} sessionPath=${session.path}`);
          return { content: [{ type: "text", text: "read_session aborted." }], isError: true };
        }
        const code = typeof error === "object" && error && "code" in error ? String((error as { code?: unknown }).code) : "";
        const stderr = typeof error === "object" && error && "stderr" in error && typeof (error as { stderr?: unknown }).stderr === "string" ? (error as { stderr: string }).stderr.trim() : "";
        const message = error instanceof Error ? error.message : String(error);
        const timeoutNote = code === "ETIMEDOUT" ? ` after ${Math.round(SUMMARY_TIMEOUT_MS / 1000)}s` : "";
        writeSessionLog(
          "read_session:fail",
          `sessionRef=${sessionRef} sessionPath=${session.path} code=${code || "<none>"} stderr=${stderr || "<none>"} message=${message}`,
        );
        return {
          content: [{ type: "text", text: `read_session failed${timeoutNote}: ${stderr || message}` }],
          isError: true,
          details: { sessionRef, sessionPath: session.path, stderr: stderr || undefined },
        };
      }
    },
  });

  pi.on("input", async (event, ctx) => {
    if (event.source === "extension") return { action: "continue" };

    const refs = [...new Set(extractSessionRefs(event.text))];
    if (refs.length === 0) return { action: "continue" };

    const directive = [
      `Resolve the referenced session(s) with read_session before answering: ${refs.join(", ")}.`,
      "Do not answer until the session context has been read.",
      "Then answer the user's request using the retrieved context.",
    ].join(" ");

    return {
      action: "transform",
      text: `${event.text}\n\n${directive}`,
    };
  });

  pi.on("session_start", async (_event, ctx) => {
    sessionsCache = undefined;
    if (!ctx.hasUI) return;
    ctx.ui.onTerminalInput((data) => {
      if (sessionMentionPickerOpen || data !== "@") return undefined;

      const editorText = ctx.ui.getEditorText();
      if (!editorText.endsWith("@")) return undefined;

      ctx.ui.setEditorText(editorText.slice(0, -1));
      openSessionMentionPickerFromEditor(ctx);
      return { consume: true };
    });
  });
}
