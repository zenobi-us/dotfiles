import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, join } from "node:path";
import { CONFIG_DIR_NAME, DynamicBorder, getSelectListTheme, type ExtensionAPI, type ExtensionContext } from "@earendil-works/pi-coding-agent";
import { pipeline } from "@huggingface/transformers";
import { Container, SelectList, type SelectItem } from "@earendil-works/pi-tui";
import { type Static, Type } from "typebox";
import { Value } from "typebox/value";

const CONFIG_NAME = "pi-summarised-title";
const CUSTOM_TYPE = "pi-summarised-title:state";
const STATUS = {
  downloading: "↓ dl",
  download_fail: "! dl",
  downloaded: "✓ dl",
  generating: "… gen",
  writing: "✎ write",
  ok: "✓",
} as const;
/**
 * Transformers. Is title model options:
 *
 * - pipelineTask: "text2text-generation", model: "Xenova/flan-t5-small" 
 *   (small, default, can return empty titles)
 * - pipelineTask: "text-generation", model: "onnx-community/gemma-3-270m-it-ONNX" 
 *   (valid, slow first load)
 * - pipelineTask: "text-generation", model: "onnx-community/LFM2-350M-ONNX" 
 *   (valid; no 230M LFM2 found)
 */
const ConfigSchema = Type.Object(
  {
    enabled: Type.Boolean({
      default: true,
      description: "Whether pi should generate and persist a short session title summary.",
    }),
    model: Type.String({
      default: "Xenova/flan-t5-small",
      description: "Transformers.js model id. See model options comment above.",
    }),
    pipelineTask: Type.Union([Type.Literal("text2text-generation"), Type.Literal("text-generation")], {
      default: "text2text-generation",
      description: "Transformers.js pipeline task. Use text-generation for Gemma/LFM2 ONNX models.",
    }),
    dtype: Type.String({
      default: "q8",
      description: "Transformers.js dtype, usually q8 or q4 for local/browser-sized inference.",
    }),
    maxNewTokens: Type.Integer({
      default: 12,
      minimum: 1,
      maximum: 64,
      description: "Maximum generated title tokens.",
    }),
    numBeams: Type.Integer({
      default: 4,
      minimum: 1,
      maximum: 8,
      description: "Beam count for deterministic title generation. 1 disables beam search.",
    }),
    stateLabel: Type.String({
      default: "pi-summarised-title:session-summary",
      description: "Label used to find the persisted session summary entry on resume.",
    }),
    setSessionName: Type.Boolean({
      default: true,
      description: "Set pi's session display name from the generated summary.",
    }),
    titleTemplate: Type.String({
      default: "π - {summary}",
      description: "Template for the session title. Use {summary} to insert the generated summary.",
    }),
    prompt: Type.String({
      default: [
        "Create a short title for this terminal thread from the first user message.",
        "Return only the title text as one concise sentence fragment.",
        "Follow these rules exactly:",
        "- 3 to 7 words",
        "- Title Case or concise sentence case",
        "- No quotes, emoji, punctuation, prefixes, or explanations",
        "- Prefer the user's actual task over generic words like Help or Chat",
      ].join("\n"),
      description: "Prompt template. Use {message} where the first user message should be inserted.",
    }),
  },
  { additionalProperties: false },
);


type TitleConfig = Static<typeof ConfigSchema>;

const SummaryStateSchema = Type.Object({
  label: Type.String(),
  summary: Type.String(),
  sourceId: Type.String(),
  sourceText: Type.String(),
  model: Type.String(),
  createdAt: Type.String({ format: "date-time" }),
})
type SummaryState = Static<typeof SummaryStateSchema>;

type StoredSummary = {
  entryId: string;
  state: SummaryState;
};

type ConfigReadResult = {
  data: Record<string, unknown>;
  error?: string;
};

type SourceMessage = {
  id: string;
  text: string;
  label?: string;
};

function selectMessage(ctx: ExtensionContext, messages: SourceMessage[]): Promise<SourceMessage | undefined> {
  if (ctx.mode !== "tui") {
    const labels = messages.map((message) => message.label ?? message.id);
    return ctx.ui.select("Pick message to summarise", labels)
      .then((choice) => messages.find((message) => (message.label ?? message.id) === choice));
  }

  const byId = new Map(messages.map((message) => [message.id, message]));
  const items: SelectItem[] = messages.map((message) => ({
    value: message.id,
    label: message.label ?? message.id,
    description: message.text.replace(/\s+/g, " ").trim().slice(0, 160),
  }));

  return ctx.ui.custom<string | undefined>((tui, theme, _kb, done) => {
    const container = new Container();
    container.addChild(new DynamicBorder((text) => theme.fg("accent", text)));
    container.addChild({
      render: () => [theme.fg("accent", theme.bold("Pick message to summarise")), ""],
      invalidate() { },
    });

    const list = new SelectList(items, Math.min(items.length, 12), getSelectListTheme(), {
      minPrimaryColumnWidth: 12,
      maxPrimaryColumnWidth: 32,
    });
    list.onSelect = (item) => done(item.value);
    list.onCancel = () => done(undefined);
    container.addChild(list);
    container.addChild(new DynamicBorder((text) => theme.fg("accent", text)));

    return {
      render: (width: number) => container.render(width),
      invalidate: () => container.invalidate(),
      handleInput: (data: string) => {
        list.handleInput(data);
        tui.requestRender();
      },
    };
  }).then((id) => id ? byId.get(id) : undefined);
}

class ConfigService {
  config: TitleConfig = Value.Parse(ConfigSchema, Value.Default(ConfigSchema, {}));
  private warned = new Set<string>();

  async reload(ctx: ExtensionContext): Promise<TitleConfig> {
    const homePath = join(homedir(), CONFIG_DIR_NAME, "agent", `${CONFIG_NAME}.json`);
    const projectPath = join(ctx.cwd, CONFIG_DIR_NAME, `${CONFIG_NAME}.json`);
    const home = await this.readJson(homePath);
    const project = ctx.isProjectTrusted() ? await this.readJson(projectPath) : { data: {} };

    this.warn(ctx, homePath, home.error);
    this.warn(ctx, projectPath, project.error);

    try {
      this.config = Value.Parse(ConfigSchema, Value.Default(ConfigSchema, { ...home.data, ...project.data }));
    } catch (error) {
      this.warn(ctx, `${homePath} + ${projectPath}`, this.errorMessage(error));
      this.config = Value.Parse(ConfigSchema, Value.Default(ConfigSchema, {}));
    }
    return this.config;
  }

  private async readJson(path: string): Promise<ConfigReadResult> {
    try {
      const value = JSON.parse(await readFile(path, "utf8"));
      return { data: value && typeof value === "object" && !Array.isArray(value) ? value : {} };
    } catch (error: any) {
      if (error?.code === "ENOENT") return { data: {} };
      return { data: {}, error: this.errorMessage(error) };
    }
  }

  private warn(ctx: ExtensionContext, path: string, error?: string): void {
    if (!error || !ctx.hasUI) return;
    const key = `${path}:${error}`;
    if (this.warned.has(key)) return;
    this.warned.add(key);
    ctx.ui.notify(`${CONFIG_NAME}: ignored invalid config ${path}: ${error}`, "error");
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}

class SessionSummaryService {
  private titleer: any;
  private unavailableModelKey?: string;

  constructor(
    private readonly pi: ExtensionAPI,
    private config: TitleConfig,
  ) { }

  private messageText(message: any): string {
    const content = message?.content;
    if (typeof content === "string") return content;
    if (!Array.isArray(content)) return "";
    return content
      .filter((part) => part?.type === "text" && typeof part.text === "string")
      .map((part) => part.text)
      .join("\n");
  }

  firstUserMessage(ctx: ExtensionContext): SourceMessage | undefined {
    for (const entry of ctx.sessionManager.getBranch()) {
      if (entry.type !== "message" || entry.message?.role !== "user") continue;
      const text = this.messageText(entry.message).trim();
      if (!text) continue;
      return {
        id: entry.id,
        text,
      }
    }
    return undefined;
  }

  branchTextMessages(ctx: ExtensionContext): SourceMessage[] {
    return ctx.sessionManager.getBranch()
      .filter((entry: any) => entry.type === "message")
      .map((entry: any) => {
        const text = this.messageText(entry.message).trim();
        if (!text) return undefined;
        const role = entry.message?.role ?? "message";
        return {
          id: entry.id,
          text,
          label: `${role} ${entry.id.slice(0, 8)}`,
        };
      })
      .filter(Boolean) as SourceMessage[];
  }

  private preview(text: string): string {
    return text.replace(/\s+/g, " ").trim().slice(0, 120);
  }

  private cleanTitle(text: string): string {
    return text
      .replace(/^[\s"“”'`]+|[\s"“”'`.!?]+$/g, "")
      .replace(/^title:\s*/i, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  private fallbackTitle(text: string): string {
    const cleaned = this.cleanTitle(text
      .replace(/@\S+/g, (match) => basename(match.slice(1)).replace(/\.[^.]+$/, ""))
      .replace(/[-_/\\]+/g, " ")
      .replace(/[`*_#>\[\](){}]/g, " ")
      .replace(/\s+/g, " "));

    return cleaned.split(" ").filter(Boolean).slice(0, 7).join(" ");
  }

  private buildPrompt(text: string): string {
    const source = text.slice(0, 4_000);
    if (this.config.prompt.includes("{message}")) {
      return this.config.prompt.replaceAll("{message}", source);
    }
    return [this.config.prompt, "```", source, "```"].join("\n");
  }

  private setStatus(ctx: ExtensionContext, status?: string): void {
    if (!ctx.hasUI) return;
    ctx.ui.setStatus(CONFIG_NAME, status ? `[ t: ${status} ]` : undefined);
  }

  private async summarise(ctx: ExtensionContext, text: string): Promise<string> {
    const modelKey = `${this.config.pipelineTask}:${this.config.model}:${this.config.dtype}`;

    if (this.unavailableModelKey === modelKey) return this.fallbackTitle(text);

    if (!this.titleer) {
      try {
        this.setStatus(ctx, `${STATUS.downloading} load`);
        this.titleer = await pipeline(this.config.pipelineTask, this.config.model, {
          dtype: this.config.dtype as any,
          progress_callback: (event: any) => {
            if (!ctx.hasUI) return;
            if (event.status === "progress") {
              const pct = event.total ? ` ${Math.round((event.loaded / event.total) * 100)}%` : "";
              this.setStatus(ctx, `${STATUS.downloading}${pct}`);
              return;
            }
            if (event.status === "initiate" || event.status === "download") {
              this.setStatus(ctx, STATUS.downloading);
            }
          },
        } as any);
        this.setStatus(ctx, STATUS.downloaded);
      } catch (error) {
        this.unavailableModelKey = modelKey;
        this.setStatus(ctx, STATUS.download_fail);
        if (ctx.hasUI) ctx.ui.notify(`${CONFIG_NAME}: model unavailable, using fallback title: ${this.errorMessage(error)}`, "warning");
        return this.fallbackTitle(text);
      } finally {
        // Status intentionally persists until next stage replaces it.
      }
    }
    const prompt = this.buildPrompt(text);
    this.setStatus(ctx, STATUS.generating);
    try {
      const out = await this.titleer(prompt, {
        max_new_tokens: this.config.maxNewTokens,
        num_beams: this.config.numBeams,
        do_sample: false,
        early_stopping: true,
      });

      const generated = this.cleanTitle((out[0]?.generated_text ?? "").replace(prompt, ""));
      return generated || this.fallbackTitle(text);
    } catch (error) {
      if (ctx.hasUI) ctx.ui.notify(`${CONFIG_NAME}: generation failed, using fallback title: ${this.errorMessage(error)}`, "warning");
      return this.fallbackTitle(text);
    }
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  updateConfig(config: TitleConfig): void {
    if (
      config.model !== this.config.model ||
      config.dtype !== this.config.dtype ||
      config.pipelineTask !== this.config.pipelineTask
    ) {
      this.titleer = undefined;
      this.unavailableModelKey = undefined;
    }
    this.config = config;
  }

  private applyTitle(ctx: ExtensionContext, summary: string): void {
    const title = this.config.titleTemplate.replaceAll("{summary}", summary);
    if (this.config.setSessionName) this.pi.setSessionName(summary);
    if (ctx.hasUI) ctx.ui.setTitle(title);
  }

  async process(ctx: ExtensionContext, message?: SourceMessage): Promise<void> {
    const stored = this.read(ctx);

    if (stored) {
      this.applyTitle(ctx, stored.state.summary);
      return;
    }

    if (!message) return;

    await this.save(message, ctx);
  }

  async resummarise(ctx: ExtensionContext, source: SourceMessage): Promise<string | undefined> {
    return this.save(source, ctx);
  }

  read(ctx: ExtensionContext): StoredSummary | undefined {
    for (const entry of ctx.sessionManager.getBranch().toReversed()) {
      if (entry.type !== "custom" || entry.customType !== CUSTOM_TYPE) continue;
      if (!entry.data || typeof entry.data !== "object" || !("label" in entry.data)) continue;
      if (entry.data.label !== this.config.stateLabel) continue;
      if (Value.Check(SummaryStateSchema, entry.data)) {
        return { entryId: entry.id, state: entry.data };
      }
    }
    return undefined;
  }

  private async save(source: SourceMessage, ctx: ExtensionContext): Promise<string | undefined> {
    const summary = await this.summarise(ctx, source.text);
    this.setStatus(ctx, STATUS.writing);
    if (!summary) return undefined;

    const state: SummaryState = {
      label: this.config.stateLabel,
      summary,
      sourceText: source.text,
      sourceId: source.id,
      model: this.config.model,
      createdAt: new Date().toISOString(),
    };

    this.pi.appendEntry(CUSTOM_TYPE, state);
    const stored = this.read(ctx);
    if (stored) this.pi.setLabel(stored.entryId, this.config.stateLabel);
    this.applyTitle(ctx, summary);
    this.setStatus(ctx, STATUS.ok);
    if (ctx.hasUI) ctx.ui.notify(`pi-summarised-title: saved summary "${summary}"`, "info");
    return summary;
  }
}

export default function piSummarisedTitle(pi: ExtensionAPI) {
  const configService = new ConfigService();
  const summaries = new SessionSummaryService(pi, configService.config);

  const reload = async (ctx: ExtensionContext) => {
    const config = await configService.reload(ctx);
    summaries.updateConfig(config);
    return config;
  };

  pi.registerCommand("summarised-title", {
    description: "Manage pi session title summary: force | pick",
    getArgumentCompletions: (prefix: string) => {
      const items = ["force", "pick"].map((value) => ({ value, label: value }));
      const filtered = items.filter((item) => item.value.startsWith(prefix.trim()));
      return filtered.length ? filtered : null;
    },
    handler: async (args, ctx) => {
      const action = args?.trim().split(/\s+/)[0] ?? "";
      const config = await reload(ctx);
      if (!config.enabled) {
        ctx.ui.notify("pi-summarised-title: disabled", "warning");
        return;
      }

      await ctx.waitForIdle();

      if (action === "force") {
        const source = summaries.firstUserMessage(ctx);
        if (!source) {
          ctx.ui.notify("pi-summarised-title: no user message to summarise", "warning");
          return;
        }
        await summaries.resummarise(ctx, source);
        return;
      }

      if (action === "pick") {
        const messages = summaries.branchTextMessages(ctx);
        if (!messages.length) {
          ctx.ui.notify("pi-summarised-title: no text messages to summarise", "warning");
          return;
        }
        const source = await selectMessage(ctx, messages);
        if (!source) return;
        await summaries.resummarise(ctx, source);
        return;
      }

      ctx.ui.notify("Usage: /summarised-title force | pick", "info");
    },
  });

  pi.on("session_start", async (event, ctx) => {
    const config = await reload(ctx);
    if (!config.enabled) return;
    const message = summaries.firstUserMessage(ctx);
    await summaries.process(ctx, message);
  });

  pi.on("before_agent_start", async (event, ctx) => {
    const config = await reload(ctx);

    if (!config.enabled) return;

    await summaries.process(ctx, {
      text: event.prompt,
      id: 'first'
    });
  });
}
