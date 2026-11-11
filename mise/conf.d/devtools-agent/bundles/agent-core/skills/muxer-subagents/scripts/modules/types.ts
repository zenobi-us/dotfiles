// Shared contracts keep agent commands separate from terminal lifecycle.
import type { Agent, Muxer } from "../types.ts";
import type { RunManifest, RunSignal } from "../signals.ts";

export type Environment = Readonly<Record<string, string | undefined>>;
export type MuxerId = Exclude<Muxer, "unknown-muxer">;
export type AgentId = Exclude<Agent, "unknown-agent">;

export interface ModuleIdentity<Id extends string> {
  readonly id: Id;
  readonly contract: string;
  detect(environment: Environment): boolean;
}

export interface AgentModule extends ModuleIdentity<AgentId> {
  command(request: { muxer: MuxerId; promptFile: string }): readonly string[];
}

export interface AgentInvocation {
  readonly id: AgentId;
  readonly argv: readonly string[];
}

export interface LaunchRequest {
  readonly runId: string;
  readonly cwd: string;
  readonly depth: number;
  readonly promptFile: string;
  readonly environment: Readonly<Record<string, string>>;
  readonly agent: AgentInvocation;
}

export interface LaunchResult {
  readonly target: string;
  readonly agentName?: string;
}

export interface WaitRequest {
  readonly manifest: RunManifest;
  readonly current: RunSignal;
  readonly afterSequence: number;
  readonly timeoutMs?: number;
}

export interface MuxerModule extends ModuleIdentity<MuxerId> {
  readonly promptLifetime: "process" | "turn";
  supports(agent: AgentId): boolean;
  launch(request: LaunchRequest): Promise<LaunchResult>;
  wait(request: WaitRequest): Promise<RunSignal | null>;
}
