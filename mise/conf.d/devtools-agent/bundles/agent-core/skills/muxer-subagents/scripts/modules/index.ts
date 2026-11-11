// Explicit order preserves detection precedence without filesystem discovery.
import { muxer as herdr } from "./muxer-herdr.ts";
import { muxer as zellij } from "./muxer-zellij.ts";
import { muxer as tmux } from "./muxer-tmux.ts";
import { muxer as hrdx } from "./muxer-hrdx.ts";
import { muxer as herdrApp } from "./muxer-herdr-app.ts";
import { agent as omp } from "./agent-omp.ts";
import { agent as pi } from "./agent-pi.ts";
import { agent as zot } from "./agent-zot.ts";
import { agent as codex } from "./agent-codex.ts";
import { agent as claude } from "./agent-claude.ts";
import type { AgentId, AgentModule, MuxerId, MuxerModule } from "./types.ts";

export const muxers = { herdr, zellij, tmux, hrdx, "herdr-app": herdrApp } satisfies Record<MuxerId, MuxerModule>;
export const agents = { omp, pi, zot, codex, claude } satisfies Record<AgentId, AgentModule>;
export const muxerDetectionOrder: readonly MuxerModule[] = [herdr, zellij, tmux, hrdx, herdrApp];
export const agentDetectionOrder: readonly AgentModule[] = [omp, pi, zot, codex, claude];
