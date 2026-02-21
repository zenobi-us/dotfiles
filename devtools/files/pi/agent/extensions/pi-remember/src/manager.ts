import type { ExtensionCommandContext, Theme } from "@mariozechner/pi-coding-agent";
import type Database from "better-sqlite3";
import { DynamicBorder, getSettingsListTheme } from "@mariozechner/pi-coding-agent";
import {
  Container,
  Key,
  matchesKey,
  SettingsList,
  Spacer,
  Text,
  type SettingItem,
} from "@mariozechner/pi-tui";
import type { MemoryItem, RememberConfig, Source } from "./types.js";
type Action =
  | { type: "cancel" }
  | { type: "delete"; id: number; source: Source }
  | { type: "search" }
  | { type: "add" }
  | { type: "status" }
  | { type: "refresh" };

type Deps = {
  loadConfig: (cwd: string) => RememberConfig;
  listAllMemories: (cwd: string, scope: RememberConfig["scope"]) => MemoryItem[];
  searchMemories: (
    cwd: string,
    query: string,
    scope: RememberConfig["scope"],
  ) => Promise<Array<{ id: number; content: string; score: number; source: string }>>;
  getProjectDbPath: (cwd: string) => string;
  getGlobalDbPath: () => string;
  getModelDir: () => string;
  getDb: (dbPath: string) => Database.Database;
  embedPassage: (text: string) => Promise<number[]>;
  encodeEmbedding: (vec: number[]) => Buffer;
  deleteMemoryInStore: (cwd: string, id: number, source: Source) => boolean;
};

function format(item: MemoryItem, theme: Theme): string {
  const source = theme.fg("dim", `[${item.source}]`);
  const id = theme.fg("accent", `#${String(item.id)}`);
  const content = item.content.length > 90 ? `${item.content.slice(0, 87)}...` : item.content;
  return `${id} ${source} ${content}`;
}

export async function openRememberManager(ctx: ExtensionCommandContext, deps: Deps): Promise<void> {
  while (true) {
    const config = deps.loadConfig(ctx.cwd);
    const all = deps.listAllMemories(ctx.cwd, config.scope);
    const items: SettingItem[] = all.slice(0, 200).map((m) => ({
      id: `${m.source}:${String(m.id)}`,
      label: m.content,
      currentValue: "keep",
      values: ["keep"],
    }));

    const result = await ctx.ui.custom<Action>((tui, theme, _keybindings, done) => {
      const container = new Container();
      container.addChild(new DynamicBorder((s) => theme.fg("accent", s)));
      container.addChild(new Text(theme.bold(theme.fg("accent", "Remember Manager")), 2, 0));
      container.addChild(
        new Text(theme.fg("dim", `${all.length} memorie(s) • d delete • s search • a add • r refresh • i status`), 2, 0),
      );
      container.addChild(new Spacer(1));
      const visible: SettingItem[] = items.map((it, idx) => {
        const raw = all[idx];
        if (!raw) return it;
        return { ...it, label: format(raw, theme) };
      });
      const list = new SettingsList(
        visible.length > 0
          ? visible
          : [{ id: "none", label: theme.fg("dim", "No memories yet."), currentValue: "keep", values: ["keep"] }],
        Math.min(Math.max(visible.length, 1) + 2, 16),
        getSettingsListTheme(),
        () => {},
        () => done({ type: "cancel" }),
        { enableSearch: visible.length > 8 },
      );
      container.addChild(list);
      container.addChild(new Spacer(1));
      container.addChild(
        new Text(theme.fg("dim", "↑↓ Navigate | d Delete | s Search | a Add | r Refresh | i Status | Esc Cancel"), 2, 0),
      );
      container.addChild(new DynamicBorder((s) => theme.fg("accent", s)));
      return {
        render(width) {
          return container.render(width);
        },
        invalidate() {
          container.invalidate();
        },
        handleInput(data) {
          const selectedIndex = (list as unknown as { selectedIndex: number }).selectedIndex ?? 0;
          const selected = all[selectedIndex];
          if (data === "d" || data === "D") {
            if (selected) done({ type: "delete", id: selected.id, source: selected.source as Source });
            return;
          }
          if (data === "s" || data === "S") return done({ type: "search" });
          if (data === "a" || data === "A") return done({ type: "add" });
          if (data === "r" || data === "R") return done({ type: "refresh" });
          if (data === "i" || data === "I") return done({ type: "status" });
          if (matchesKey(data, Key.escape)) return done({ type: "cancel" });
          list.handleInput?.(data);
          tui.requestRender();
        },
      };
    });

    if (result.type === "cancel") return;
    if (result.type === "refresh") continue;
    if (result.type === "status") {
      ctx.ui.notify(
        `enabled=${String(config.enabled)} scope=${config.scope} inject.count=${String(config.inject.count)} lowThreshold=${String(config.inject.lowThreshold)} highThreshold=${String(config.inject.highThreshold)}\nprojectDB=${deps.getProjectDbPath(ctx.cwd)}\nglobalDB=${deps.getGlobalDbPath()}\nmodelDir=${deps.getModelDir()}`,
        "info",
      );
      continue;
    }
    if (result.type === "search") {
      const q = await ctx.ui.input("Search memories", "Natural language query");
      if (!q?.trim()) continue;
      const results = await deps.searchMemories(ctx.cwd, q, config.scope);
      const lines = results.slice(0, 15).map((r) => `id=${r.id} [${r.score.toFixed(3)}] [${r.source}] ${r.content}`);
      ctx.ui.notify(lines.length ? lines.join("\n") : "No matches.", "info");
      continue;
    }
    if (result.type === "add") {
      const text = await ctx.ui.input("Add memory", "One factual sentence");
      if (!text?.trim()) continue;
      const global = config.scope === "both" ? await ctx.ui.confirm("Store", "Store in global scope? (No = project)") : config.scope === "global";
      const store: { source: Source; dbPath: string } = global ? { source: "global", dbPath: deps.getGlobalDbPath() } : { source: "project", dbPath: deps.getProjectDbPath(ctx.cwd) };
      const db = deps.getDb(store.dbPath);
      const emb = await deps.embedPassage(text.trim());
      const inserted = db
        .prepare("INSERT INTO memories (content, timestamp, embedding) VALUES (?, ?, ?)")
        .run(text.trim(), new Date().toISOString(), deps.encodeEmbedding(emb));
      db.close();
      ctx.ui.notify(`Remembered id=${String(inserted.lastInsertRowid)} [${store.source}]`, "info");
      continue;
    }
    if (result.type === "delete") {
      const ok = await ctx.ui.confirm("Forget memory", `Delete id=${String(result.id)} from ${result.source}?`);
      if (!ok) continue;
      const deleted = deps.deleteMemoryInStore(ctx.cwd, result.id, result.source);
      ctx.ui.notify(
        deleted ? `Forgot id=${String(result.id)} from ${result.source}.` : `Memory id=${String(result.id)} not found in ${result.source}.`,
        deleted ? "info" : "warning",
      );
    }
  }
}
