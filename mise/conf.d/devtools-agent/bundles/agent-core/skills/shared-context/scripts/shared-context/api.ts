import {
  initializeRepositoryContext,
  initializeSharedContext,
  renderContextReport,
  resolveSharedContext,
  type Exec,
  type Store,
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

export type InitializeContextOptions = {
  store: Store;
  preset?: string;
};

export async function initializeContextForCwd(
  exec: Exec,
  cwd: string,
  options: InitializeContextOptions,
): Promise<{ agents: string; created: boolean; hostedShared: boolean; store: Store }> {
  const context = await resolveSharedContext(exec, cwd);
  if (!context) throw new Error("No git repository with an origin remote found");
  if (context.error) throw new Error(context.error);
  if (options?.store !== "repository" && options?.store !== "shared") {
    throw new Error("Choose a storage store: repository or shared.");
  }
  const { store, preset } = options;
  if (preset && preset !== "hosted-shared") throw new Error(`Unknown setup preset "${preset}"`);
  if (preset && store !== "shared") {
    throw new Error("The hosted-shared preset requires store: shared.");
  }
  if (preset === "hosted-shared" && context.routes.tickets.adapter === "local-markdown") {
    throw new Error("The hosted-shared preset requires an external ticket adapter. Configure the tracker, then retry.");
  }
  const configuredStorage = Boolean(context.routeSource);
  if (configuredStorage && store !== context.storage) {
    throw new Error(`Cannot change configured storage during setup:\n${renderContextReport(context)}\nMigrate each record kind explicitly, then retry.`);
  }
  if (preset === "hosted-shared" && configuredStorage && context.mode !== "shared") {
    throw new Error(`Cannot apply hosted-shared preset over existing routes:\n${renderContextReport(context)}\nMigrate each record kind explicitly, then retry.`);
  }

  const result = store === "repository"
    ? await initializeRepositoryContext(context)
    : await initializeSharedContext(context);
  return { ...result, hostedShared: preset === "hosted-shared", store };
}

