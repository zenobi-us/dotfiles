import type { ExtensionContext } from "@earendil-works/pi-coding-agent";
import { appendFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";

export const LOG_DIR = `${tmpdir()}/pi-zellij-agent`;

export class LogService {
  private sessionId = `${process.getuid?.() ?? "user"}`;

  constructor(private readonly logDir = LOG_DIR) {}

  updateSession(ctx: ExtensionContext): void {
    this.sessionId = logIdForContext(ctx);
  }

  get file(): string {
    return join(this.logDir, `${this.sessionId}.log`);
  }

  trace(message: string): Promise<void> {
    return this.write("trace", message);
  }

  debug(message: string): Promise<void> {
    return this.write("debug", message);
  }

  log(message: string): Promise<void> {
    return this.write("log", message);
  }

  private async write(level: "trace" | "debug" | "log", message: string): Promise<void> {
    try {
      await mkdir(this.logDir, { recursive: true });
      await appendFile(this.file, `${new Date().toISOString()} ${level} ${message}\n`);
    } catch {
      // ponytail: logging must never break Pi startup or Zellij publishing.
    }
}
}

export function logIdForContext(ctx: ExtensionContext): string {
  const sessionFile = ctx.sessionManager.getSessionFile();
  const fallback = process.env.ZELLIJ_PANE_ID
    ? `${process.env.ZELLIJ_SESSION_NAME ?? "zellij"}-${process.env.ZELLIJ_PANE_ID}`
    : `${ctx.cwd}-${process.pid}`;
  return safeLogId(sessionFile ? basename(sessionFile) : fallback);
}

export function safeLogId(value: string): string {
  return value.replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^_+|_+$/g, "") || "session";
}
