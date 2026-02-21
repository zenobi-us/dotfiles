import fs from "node:fs";

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";

import { buildMemoryBlock } from "./inject.js";
import { openRememberManager } from "./manager.js";
import {
  deleteMemoryInStore,
  embedPassage,
  encodeEmbedding,
  getDb,
  getGlobalDbPath,
  getModelDir,
  getProjectDbPath,
  listAllMemories,
  loadConfig,
  searchMemories,
} from "./memory.js";

export default function piRememberExtension(pi: ExtensionAPI): void {
  pi.registerCommand("remember", {
    description: "Open memory manager UI. Subcommands: list, search <query>, forget <id>",
    handler: async (args, ctx) => {
      const trimmed = args.trim();
      if (!trimmed) {
        if (!ctx.hasUI) {
          ctx.ui.notify("Use /remember list | /remember search <query> | /remember forget <id>", "info");
          return;
        }
        await openRememberManager(ctx, {
          loadConfig,
          listAllMemories,
          searchMemories,
          getProjectDbPath,
          getGlobalDbPath,
          getModelDir,
          getDb,
          embedPassage,
          encodeEmbedding,
          deleteMemoryInStore,
        });
        return;
      }
      const [cmd, ...rest] = trimmed.split(/\s+/);
      const sub = (cmd ?? "").toLowerCase();
      const config = loadConfig(ctx.cwd);
      if (sub === "list") {
        const all = listAllMemories(ctx.cwd, config.scope);
        const lines = all.slice(0, 50).map((m) => `id=${m.id} [${m.source}] ${m.content}`);
        ctx.ui.notify(lines.length ? lines.join("\n") : "No memories stored.", "info");
        return;
      }
      if (sub === "search") {
        const q = rest.join(" ").trim();
        if (!q) {
          ctx.ui.notify("Usage: /remember search <query>", "warning");
          return;
        }
        const results = await searchMemories(ctx.cwd, q, config.scope);
        const lines = results.slice(0, 10).map((r) => `id=${r.id} [${r.score.toFixed(3)}] [${r.source}] ${r.content}`);
        ctx.ui.notify(lines.length ? lines.join("\n") : "No matches.", "info");
        return;
      }
      if (sub === "forget") {
        const id = Number(rest[0]);
        if (!Number.isFinite(id)) {
          ctx.ui.notify("Usage: /remember forget <id> [--global]", "warning");
          return;
        }
        const config = loadConfig(ctx.cwd);
        const source = config.scope === "global" ? "global" : "project";
        const deleted = deleteMemoryInStore(ctx.cwd, id, source);
        ctx.ui.notify(deleted ? `Forgot id=${id} from ${source} store.` : `Memory id=${id} not found in ${source} store.`, deleted ? "info" : "warning");
        return;
      }
      ctx.ui.notify("Unknown subcommand. Use: list | search | forget", "warning");
    },
  });

  pi.registerTool({
    name: "remember",
    label: "Remember",
    description: "Store one factual memory sentence for future semantic recall.",
    parameters: Type.Object({
      memory: Type.String({ description: "A short factual sentence to remember" }),
      global: Type.Optional(Type.Boolean({ description: "If true, force global store" })),
    }),
    async execute(_id, params, _signal, _onUpdate, ctx) {
      const config = loadConfig(ctx.cwd);
      if (!config.enabled) return { content: [{ type: "text", text: "Remember plugin is disabled." }], details: {} };
      const text = params.memory.trim();
      if (!text) throw new Error("Memory cannot be empty");
      const store = params.global
        ? { source: "global" as const, dbPath: getGlobalDbPath() }
        : config.scope === "global"
          ? { source: "global" as const, dbPath: getGlobalDbPath() }
          : { source: "project" as const, dbPath: getProjectDbPath(ctx.cwd) };
      const emb = await embedPassage(text);
      const db = getDb(store.dbPath);
      const result = db
        .prepare("INSERT INTO memories (content, timestamp, embedding) VALUES (?, ?, ?)")
        .run(text, new Date().toISOString(), encodeEmbedding(emb));
      db.close();
      return {
        content: [{ type: "text", text: `Remembered id=${String(result.lastInsertRowid)} [${store.source}] ${text}` }],
        details: { id: result.lastInsertRowid, source: store.source },
      };
    },
  });

  pi.registerTool({
    name: "recall",
    label: "Recall",
    description: "Search semantic long-term memories by natural language query.",
    parameters: Type.Object({
      query: Type.String({ description: "Natural language query" }),
      limit: Type.Optional(Type.Number({ description: "Max results (default 5, max 20)" })),
    }),
    async execute(_id, params, _signal, _onUpdate, ctx) {
      const config = loadConfig(ctx.cwd);
      if (!config.enabled) return { content: [{ type: "text", text: "Remember plugin is disabled." }], details: {} };
      const results = await searchMemories(ctx.cwd, params.query, config.scope);
      if (!results.length) return { content: [{ type: "text", text: "No memories found." }], details: {} };
      const limit = Math.max(1, Math.min(params.limit ?? 5, 20));
      const lines = results.slice(0, limit).map((r, i) => `${i + 1}. id=${r.id} [${r.score.toFixed(3)}] [${r.source}] ${r.content}`);
      return { content: [{ type: "text", text: lines.join("\n") }], details: { count: lines.length } };
    },
  });

  pi.registerTool({
    name: "forget",
    label: "Forget",
    description: "Delete a memory by ID from project or global store.",
    parameters: Type.Object({
      id: Type.Number({ description: "Memory ID" }),
      global: Type.Optional(Type.Boolean({ description: "Delete from global store" })),
    }),
    async execute(_id, params, _signal, _onUpdate, ctx) {
      const config = loadConfig(ctx.cwd);
      const source = params.global ? "global" : (config.scope === "global" ? "global" : "project");
      const deleted = deleteMemoryInStore(ctx.cwd, params.id, source);
      if (!deleted) return { content: [{ type: "text", text: `Memory id=${params.id} not found in ${source}.` }], details: {} };
      return { content: [{ type: "text", text: `Forgot id=${params.id} from ${source}.` }], details: {} };
    },
  });

  pi.on("input", async (event) => {
    const text = event.text.replace(/\n?<user_memories>[\s\S]*?<\/user_memories>\n?/g, "\n").trimEnd();
    if (text === event.text) return { action: "continue" };
    return { action: "transform", text, images: event.images };
  });
  pi.on("before_agent_start", async (event, ctx) => {
    const config = loadConfig(ctx.cwd);
    if (!config.enabled) return undefined;
    const block = await buildMemoryBlock(event.prompt, config, ctx.cwd, searchMemories);
    if (!block) return undefined;
    return { message: { customType: "user-memories", content: block, display: false } };
  });
}
