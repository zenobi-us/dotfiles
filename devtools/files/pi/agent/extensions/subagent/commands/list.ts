/**
 * List command - Display available agents
 */
import dedent from "dedent";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { discoverAgents, renderAgentList } from "../agents.js";

/**
 * User-facing messages for the list command
 */
const Messages = {
	AgentList: (agentList: string) => agentList,
	NoAgents: () => dedent`
		No agents found.

		Create a new agent with: /subagent add <name>
	`,
};

export function handleList(args: string, ctx: Parameters<Parameters<ExtensionAPI['registerCommand']>[1]['handler']>[1]) {
	const discovery = discoverAgents(ctx.cwd);
	const agents = discovery.agents;

	if (agents.size === 0) {
		ctx.ui.notify(Messages.NoAgents(), "info");
		return;
	}

	const agentList = renderAgentList(agents, { verbosity: 'dense', style: 'list' });
	ctx.ui.notify(Messages.AgentList(agentList), "info");
}
