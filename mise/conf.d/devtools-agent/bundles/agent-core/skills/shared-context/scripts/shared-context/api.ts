import { promises as fs } from "node:fs";
import path from "node:path";
import {
  initializeSharedContext,
  renderContextReport,
  resolveSharedContext,
  type Exec,
} from "./lib";

export async function buildSharedContextReport(exec: Exec, cwd: string): Promise<string | undefined> {
  const context = await resolveSharedContext(exec, cwd);
  if (!context) return;

  const report = [
    `mode: ${context.mode}`,
    `root: ${context.alignmentRoot}`,
    `shared root: ${context.sharedRoot}`,
    ...(context.candidateSharedRoot && context.candidateSharedRoot !== context.sharedRoot
      ? [`shared candidate: ${context.candidateSharedRoot}`]
      : []),
    `origin: ${context.origin}`,
    `slug: ${context.slug}`,
    "",
    renderContextReport(context).split("\n").slice(3).join("\n"),
  ].join("\n");

  return context.error ? `${report}\n\n${context.error}` : report;
}

export async function initializeContextForCwd(
  exec: Exec,
  cwd: string,
  preset?: string,
): Promise<{ agents: string; created: boolean; hostedShared: boolean }> {
  const context = await resolveSharedContext(exec, cwd);
  if (!context) throw new Error("No git repository with an origin remote found");
  if (preset && preset !== "hosted-shared") throw new Error(`Unknown setup preset "${preset}"`);
  if (preset === "hosted-shared" && context.routes.tickets.adapter === "local-markdown") {
    throw new Error("The hosted-shared preset requires an external ticket adapter. Configure the tracker, then retry.");
  }
  if (preset === "hosted-shared"
    && context.mode !== "shared"
    && context.candidateSharedRoot
    && await exists(path.join(context.candidateSharedRoot, ".context-routes.toml"))) {
    throw new Error(`Cannot apply hosted-shared preset over existing routes:\n${renderContextReport(context)}\nMigrate each record kind explicitly, then retry.`);
  }

  const result = await initializeSharedContext(context);
  return { ...result, hostedShared: preset === "hosted-shared" };
}

async function exists(target: string): Promise<boolean> {
  try {
    await fs.access(target);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
}
