import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, join } from "node:path";
import { CONFIG_DIR_NAME, type ExtensionAPI, type ExtensionContext } from "@earendil-works/pi-coding-agent";
import { pipeline } from "@huggingface/transformers";
import { type Static, Type } from "typebox";
import { Value } from "typebox/value";

const CONFIG_NAME = "pi-summarised-title";
const CUSTOM_TYPE = "pi-summarised-title:state";
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
};

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

  private async summarise(ctx: ExtensionContext, text: string): Promise<string> {
    if (!this.titleer) {
      try {
        if (ctx.hasUI) ctx.ui.setStatus(CONFIG_NAME, `Loading ${this.config.model}`);
        this.titleer = await pipeline(this.config.pipelineTask, this.config.model, {
          dtype: this.config.dtype as any,
          progress_callback: (event: any) => {
            if (!ctx.hasUI) return;
            if (event.status === "progress") {
              const pct = event.total ? ` ${Math.round((event.loaded / event.total) * 100)}%` : "";
              ctx.ui.setStatus(CONFIG_NAME, `Downloading ${event.file ?? this.config.model}${pct}`);
              return;
            }
            if (event.status === "initiate" || event.status === "download") {
              ctx.ui.setStatus(CONFIG_NAME, `Downloading ${event.file ?? this.config.model}`);
            }
          },
        } as any);
      } finally {
        if (ctx.hasUI) ctx.ui.setStatus(CONFIG_NAME, undefined);
      }
    }
    const prompt = this.buildPrompt(text);
    const out = await this.titleer(prompt, {
      max_new_tokens: this.config.maxNewTokens,
      num_beams: this.config.numBeams,
      do_sample: false,
      early_stopping: true,
    });

    const generated = this.cleanTitle((out[0]?.generated_text ?? "").replace(prompt, ""));
    return generated || this.fallbackTitle(text);
  }

  updateConfig(config: TitleConfig): void {
    if (
      config.model !== this.config.model ||
      config.dtype !== this.config.dtype ||
      config.pipelineTask !== this.config.pipelineTask
    ) {
      this.titleer = undefined;
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

  private async save(source: SourceMessage, ctx: ExtensionContext): Promise<void> {
    const summary = await this.summarise(ctx, source.text);
    if (!summary) return;

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
    if (ctx.hasUI) ctx.ui.notify(`pi-summarised-title: saved summary "${summary}"`, "info");
  }
}

export default function piSummarisedTitle(pi: ExtensionAPI) {
  const configService = new ConfigService();
  const summaries = new SessionSummaryService(pi, configService.config);

  pi.on("session_start", async (event, ctx) => {
    const config = await configService.reload(ctx);
    summaries.updateConfig(config);
    if (!config.enabled) return;
    const message = summaries.firstUserMessage(ctx);
    await summaries.process(ctx, message);
  });

  pi.on("before_agent_start", async (event, ctx) => {
    const config = await configService.reload(ctx);
    summaries.updateConfig(config);

    if (!config.enabled) return;

    await summaries.process(ctx, {
      text: event.prompt,
      id: 'first'
    });
  });
}
