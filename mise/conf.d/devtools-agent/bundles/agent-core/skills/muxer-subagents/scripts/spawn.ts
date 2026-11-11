import { mkdirSync, mkdtempSync, realpathSync, rmSync, statSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseDeliveryContext, type DeliveryContext } from "../../result-delivery/scripts/delivery.ts";
import type { Agent, Muxer } from "./types.ts";
import {
  createRun,
  removeRun,
  runPromptPath,
  updateRunTarget,
} from "./signals.ts";
import { sessionMetadata } from "./session-context.ts";
import { agents, muxers } from "./modules/index.ts";
import type { AgentModule, MuxerModule } from "./modules/types.ts";

export type SpawnMuxer = Exclude<Muxer, "unknown-muxer">;
export type SpawnAgent = Exclude<Agent, "unknown-agent">;

export interface SpawnOptions {
  muxer: SpawnMuxer;
  agent: SpawnAgent;
  prompt: string;
  cwd: string;
  depth: number;
  resultSchema: string;
  resultTarget?: string;
  resultRef?: string;
  operationId?: string;
}

export interface SpawnResult {
  runId: string;
  target: string;
  parentRunId?: string;
  operationId: string;
  contextFile: string;
  deliveryContext: DeliveryContext;
  resultTarget: NonNullable<DeliveryContext["target"]>;
}

export async function spawnAgent(options: SpawnOptions): Promise<SpawnResult> {
  if (!options.resultSchema?.trim()) throw new Error("A non-empty result schema is required.");
  if ((options.resultTarget !== undefined) !== (options.resultRef !== undefined)) {
    throw new Error("Provide result target and result reference together.");
  }
  if (options.resultTarget !== undefined) {
    if (!isAbsolute(options.resultTarget) || !statSync(dirname(options.resultTarget)).isDirectory()) {
      throw new Error("Result target must be absolute and its parent directory must exist.");
    }
  }
  const muxer: MuxerModule = muxers[options.muxer];
  const agent: AgentModule = agents[options.agent];
  if (!muxer.supports(agent.id)) {
    throw new Error(`${muxer.id} does not support ${agent.id}.`);
  }
  const parentRunId = sessionMetadata().runId;
  const run = await createRun(options.muxer, options.agent);
  let directory: string | undefined;
  try {
    const stateRoot = process.env.XDG_STATE_HOME || join(homedir(), ".local", "state");
    const allocatedDirectory = resolve(stateRoot, "result-delivery", "runs", run.runId);
    mkdirSync(allocatedDirectory, { recursive: true, mode: 0o700 });
    // Canonicalize our spool before assignment; delivery rejects symlinked parents.
    const deliveryDirectory = realpathSync(allocatedDirectory);
    const operationId = options.operationId ?? run.runId;
    const resultPath = options.resultTarget ?? join(deliveryDirectory, "result.json");
    const deliveryContext = parseDeliveryContext({
      schema: "result-delivery/v1",
      kind: "context",
      audience: "agent",
      mode: "artifact-reference",
      runId: run.runId,
      operationId,
      target: {
        path: resultPath,
        ref: options.resultRef ?? pathToFileURL(resultPath).href,
        schema: options.resultSchema,
      },
    });
    const contextFile = join(deliveryDirectory, "context.json");
    writeFileSync(contextFile, `${JSON.stringify(deliveryContext)}\n`, { mode: 0o600, flag: "wx" });
    const environment: Record<string, string> = {
      RESULT_DELIVERY_CONTEXT: contextFile,
      MUXER_SUBAGENT_RUN_ID: run.runId,
      MUXER_SUBAGENT_ROLE: "child",
      ...(parentRunId ? { MUXER_SUBAGENT_PARENT_RUN_ID: parentRunId } : {}),
    };
    // Native-state muxers retain the prompt until the reported turn ends.
    // Shell-launch muxers remove it when the process exits.
    let handoffFile: string;
    if (muxer.promptLifetime === "turn") {
      handoffFile = runPromptPath(run.runId);
    } else {
      directory = mkdtempSync(join(tmpdir(), "muxer-subagents-"));
      handoffFile = join(directory, "prompt.md");
    }
    const handoff = `${options.prompt}\n\nResult handoff: Read the result-delivery skill. Use the operation CLI or shared delivery library with RESULT_DELIVERY_CONTEXT=${JSON.stringify(contextFile)}. Deliver the required ${JSON.stringify(options.resultSchema)} domain result to ${JSON.stringify(resultPath)}. Do not replace artifact delivery with a chat summary. Completion signals remain separate from domain success.\n`;
    writeFileSync(handoffFile, handoff, { encoding: "utf8", mode: 0o600 });
    const { target, agentName } = await muxer.launch({
      runId: run.runId,
      cwd: options.cwd,
      depth: options.depth,
      promptFile: handoffFile,
      environment,
      agent: {
        id: agent.id,
        argv: agent.command({ muxer: muxer.id, promptFile: handoffFile }),
      },
    });
    await updateRunTarget(run.runId, target, agentName);
    return { runId: run.runId, target, parentRunId, operationId, contextFile, deliveryContext, resultTarget: deliveryContext.target! };
  } catch (error) {
    if (directory) rmSync(directory, { recursive: true, force: true });
    await removeRun(run.runId);
    throw error;
  }
}
