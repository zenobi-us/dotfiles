import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { CONFIG_DIR_NAME, type ExtensionAPI, type ExtensionContext } from "@earendil-works/pi-coding-agent";
import { pipeline } from "@huggingface/transformers";
import { type Static, Type } from "typebox";
import { Value } from "typebox/value";

const CONFIG_NAME = "pi-summarised-title";
const CUSTOM_TYPE = "pi-summarised-title:state";

const ConfigSchema = Type.Object(
  {
    enabled: Type.Boolean({
      default: true,
      description: "Whether pi should generate and persist a short session title summary.",
    }),
    model: Type.String({
      default: "Xenova/flan-t5-small",
      description: "Transformers.js model id. Use an ONNX-ready text2text model.",
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
    prompt: Type.String({
      default: [
        "Create a short title for this terminal thread from the first user message.",
        "Return only the title text as one concise sentence fragment.",
        "Follow these rules exactly:",
        "- 3 to 7 words",
        "- Title Case or concise sentence case",
        "- No quotes, emoji, punctuation, prefixes, or explanations",
        "- Prefer the user's actual task over generic words like Help or Chat",
        "",
        "<user_message>",
        "{message}",
        "</user_message>",
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

const SourceMessageSchema = Type.Object({
  id: Type.String(),
  text: Type.String(),
})

type SourceMessage = Static<typeof SourceMessageSchema>;

/**
 *
 */
class ConfigService {
  config: TitleConfig = Value.Parse(ConfigSchema, Value.Default(ConfigSchema, {}));

  async reload(ctx: ExtensionContext): Promise<TitleConfig> {
    const home = await this.readJson(join(homedir(), CONFIG_DIR_NAME, "agent", `${CONFIG_NAME}.json`));
    const project = ctx.isProjectTrusted()
      ? await this.readJson(join(ctx.cwd, CONFIG_DIR_NAME, `${CONFIG_NAME}.json`))
      : {};

    this.config = Value.Parse(ConfigSchema, Value.Default(ConfigSchema, { ...home, ...project }));
    return this.config;
  }

  private async readJson(path: string): Promise<Record<string, unknown>> {
    try {
      const value = JSON.parse(await readFile(path, "utf8"));
      return value && typeof value === "object" && !Array.isArray(value) ? value : {};
    } catch {
      return {};
    }
  }
}

/**
 *
 */
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
      .trim();
  }

  private async summarise(text: string): Promise<string> {
    this.titleer ??= await pipeline("text2text-generation", this.config.model, { dtype: this.config.dtype as any });
    const prompt = this.config.prompt.replace("{message}", text.slice(0, 4_000));
    const out = await this.titleer(prompt, {
      max_new_tokens: this.config.maxNewTokens,
      num_beams: this.config.numBeams,
      do_sample: false,
      early_stopping: true,
    });

    return this.cleanTitle(out[0]?.generated_text ?? "");
  }

  updateConfig(config: TitleConfig): void {
    if (config.model !== this.config.model || config.dtype !== this.config.dtype) {
      this.titleer = undefined;
    }
    this.config = config;
  }

  async process(ctx: ExtensionContext, message?: SourceMessage): Promise<void> {
    const stored = this.read(ctx);

    if (stored) {
      if (this.config.setSessionName) this.pi.setSessionName(stored.state.summary);
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
    const summary = await this.summarise(source.text);
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
    if (this.config.setSessionName) this.pi.setSessionName(summary);
    if (ctx.hasUI) ctx.ui.notify(`Saved title summary: ${summary}`, "info");
  }
}

export default function piSummarisedTitle(pi: ExtensionAPI) {
  const configService = new ConfigService();
  const summaries = new SessionSummaryService(pi, configService.config);

  /**
   * On session start, check if we already have a summary. If not, summarise the first user message and save it.
   */
  pi.on("session_start", async (event, ctx) => {
    const config = await configService.reload(ctx);
    summaries.updateConfig(config);
    if (!config.enabled) return;
    const message = summaries.firstUserMessage(ctx);
    await summaries.process(ctx, message);
  });

  /**
   * On agent start, check if we already have a summary. If not, summarise the first user message and save it.
   */
  pi.on("before_agent_start", async (event, ctx) => {
    const config = await configService.reload(ctx);
    summaries.updateConfig(config);

    // if disabled or already has a summary, skip
    if (!config.enabled || summaries.read(ctx)) return;

    // otherwise, summarise the first user message and save it
    await summaries.process(ctx, {
      text: event.prompt,
      id: 'first'
    });
  });
}
