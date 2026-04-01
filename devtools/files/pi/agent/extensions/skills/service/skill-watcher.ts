import { join } from "node:path";
import chokidar, { FSWatcher } from "chokidar";

type SkillWatchEventType = "add" | "change" | "unlink";
export type SkillWatchChange = {
  type: SkillWatchEventType;
  path: string;
};

export interface StartSkillWatcherOptions {
  debounceMs?: number;
  onBatch: (changes: SkillWatchChange[]) => void;
  onError?: (error: Error) => void;
}

export function createSkillWatcher(options: StartSkillWatcherOptions) {
  let instance: FSWatcher | null = null;

  const pending = new Map<string, SkillWatchEventType>();
  let timer: ReturnType<typeof setTimeout> | null = null;

  const reset = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    pending.clear();
  };

  const flush = () => {
    if (pending.size === 0) return;
    const changes = Array.from(pending.entries()).map(([path, type]) => ({
      path,
      type,
    }));
    pending.clear();
    options.onBatch(changes);
  };

  const scheduleFlush = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(flush, options.debounceMs ?? 100);
  };

  const onEvent = (type: SkillWatchEventType, path: string) => {
    pending.set(path, type);
    scheduleFlush();
  };
  const start = (paths: string[]) => {
    reset();

    const globs = paths.flatMap((root) => [
      join(root, "*.md"),
      join(root, "**/SKILL.md"),
    ]);

    instance = chokidar.watch(globs, {
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 150,
        pollInterval: 25,
      },
      followSymlinks: true,
    });

    instance
      .on("add", (path) => onEvent("add", path))
      .on("change", (path) => onEvent("change", path))
      .on("unlink", (path) => onEvent("unlink", path))
      .on("error", (error) => {
        if (options.onError && error instanceof Error) {
          options.onError(error);
        } else if (options.onError && !(error instanceof Error)) {
          options.onError(new Error(String(error)));
        } else {
          console.error("Skill watcher error:", error);
        }
      });

    return instance;
  };

  return {
    start,
    async dispose() {
      if (!instance) return;

      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      pending.clear();
      await instance.close();
    },
  };
}
