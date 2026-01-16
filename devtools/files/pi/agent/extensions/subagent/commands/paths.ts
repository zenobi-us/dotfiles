/**
 * Paths command - Display directories searched for agents
 */
import * as os from "node:os";
import dedent from "dedent";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { getAgentSearchPaths } from "../agents.js";

/**
 * User-facing messages for the paths command
 */
const Messages = {
	NoPaths: () => dedent`
		No agent directories found.

		Create one with:
		  mkdir -p ~/.pi/agent/agents
	`,
	PathsList: (count: number, pathsList: string) => dedent`
		Agent search paths (${count}):

		${pathsList}

		Agents are loaded in priority order (first match wins).

		To create a new directory:
		  mkdir -p .pi/agents  # project-local
		  mkdir -p ~/.pi/agent/agents  # global
	`,
};

export function handlePaths(_args: string, ctx: Parameters<Parameters<ExtensionAPI['registerCommand']>[1]['handler']>[1]) {
	// Display agent search paths
	const searchPaths = getAgentSearchPaths(ctx.cwd);

	if (searchPaths.length === 0) {
		ctx.ui.notify(Messages.NoPaths(), "info");
		return;
	}

	const pathsList = searchPaths
		.map((searchPath) => {
			const relativePath = searchPath.replace(os.homedir(), "~");
			return `  • ${relativePath}`;
		})
		.join("\n");

	ctx.ui.notify(Messages.PathsList(searchPaths.length, pathsList), "info");
}
