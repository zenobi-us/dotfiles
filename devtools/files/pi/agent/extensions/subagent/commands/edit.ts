/**
 * Edit command - Show location of agent file for editing
 */
import * as path from "node:path";
import dedent from "dedent";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { discoverAgents, renderAgentList } from "../agents.js";

/**
 * Parse command arguments for /subagent edit
 * 
 * Extracts agent name from argument string.
 * 
 * @param argsStr - Raw argument string from command
 * @returns Parsed name
 * @example
 * parseEditArgs("my-agent")
 * // => { name: "my-agent" }
 */
function parseEditArgs(argsStr: string): { name: string } {
	const tokens = argsStr.trim().split(/\s+/);
	let name = "";

	for (const tok of tokens) {
		if (!tok.startsWith("--") && !name) {
			name = tok;
		}
	}

	return { name };
}

/**
 * User-facing messages for the edit command
 */
const Messages = {
	NameRequired: () => dedent`
		Error: Agent name is required

		Usage: /subagent edit <name>
	`,
	AgentNotFound: (name: string, availableAgents: string) => dedent`
		Agent '${name}' not found

		${availableAgents ? `Available agents:\n${availableAgents}\n` : "No agents found.\n"}
		Use /subagent list for more details.
	`,
	EditInfo: (agentName: string, relativePath: string) => dedent`
		Opening agent: ${agentName}
		Location: ${relativePath}

		Edit this file with your preferred editor, then save.

		Changes will take effect on the next subagent invocation.
	`,
};

export function handleEdit(args: string, ctx: Parameters<Parameters<ExtensionAPI['registerCommand']>[1]['handler']>[1]) {
	const { name } = parseEditArgs(args);

	// Validate name
	if (!name) {
		ctx.ui.notify(Messages.NameRequired(), "error");
		return;
	}

	// Discover agents
	const discovery = discoverAgents(ctx.cwd);
	const agent = discovery.agents.get(name);

	if (!agent) {
		// Show error with available agents
		const available = renderAgentList(discovery.agents);
		ctx.ui.notify(Messages.AgentNotFound(name, available), "error");
		return;
	}

	// Show file path for editing
	const relativePath = path.relative(ctx.cwd, agent.filePath);
	ctx.ui.notify(Messages.EditInfo(agent.name, relativePath), "info");
}
