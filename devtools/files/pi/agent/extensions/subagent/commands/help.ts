/**
 * Help command - Display usage information
 */
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

export function handleHelp(args: string, ctx: Parameters<Parameters<ExtensionAPI['registerCommand']>[1]['handler']>[1]) {
	const help = `Subagent management commands:

Commands:
  /subagent list [--verbose]
    Display available agents
    
  /subagent add <name> [--template basic|scout|worker]
    Create a new agent definition
    
  /subagent edit <name>
    Show location of agent file for editing
    
  /subagent paths
    Display directories searched for agents

Examples:
  /subagent list
  /subagent list --verbose
  /subagent add my-agent
  /subagent add scout-v2 --template scout
  /subagent add worker-bot --template worker
  /subagent edit my-agent
  /subagent paths`;

	ctx.ui.notify(help, "info");
}
