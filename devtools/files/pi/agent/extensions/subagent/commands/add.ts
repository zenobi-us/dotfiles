/**
 * Add command - Create a new agent definition
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import dedent from "dedent";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { PredicatableAgentPaths } from "../agents.js";

/**
 * Parse command arguments for /subagent add
 * 
 * Extracts agent name and optional --template flag.
 * 
 * @param argsStr - Raw argument string from command
 * @returns Parsed name and template (basic/scout/worker)
 * @example
 * parseAddArgs("my-agent --template scout")
 * // => { name: "my-agent", template: "scout" }
 */
function parseAddArgs(argsStr: string): {
	name: string;
	template: "basic" | "scout" | "worker";
} {
	const tokens = argsStr.trim().split(/\s+/);
	let name = "";
	let template: "basic" | "scout" | "worker" = "basic";

	for (let i = 0; i < tokens.length; i++) {
		const tok = tokens[i];
		if (tok === "--template" && tokens[i + 1]) {
			const val = tokens[i + 1];
			if (val === "basic" || val === "scout" || val === "worker") {
				template = val;
			}
			i++;
		} else if (!tok.startsWith("--") && !name) {
			name = tok;
		}
	}

	return { name, template };
}

/**
 * Validate agent name format
 * 
 * Agent names must:
 * - Contain only lowercase letters, numbers, hyphens, and underscores
 * - Start with a letter
 * - End with a letter or number
 * 
 * @param name - Agent name to validate
 * @returns Validation result with error message if invalid
 * @example
 * validateAgentName("my-agent")
 * // => { valid: true }
 * 
 * validateAgentName("123invalid")
 * // => { valid: false, error: "Agent name must start with a letter" }
 */
function validateAgentName(name: string): { valid: boolean; error?: string } {
	if (!name) {
		return { valid: false, error: "Agent name is required" };
	}
	if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
		return {
			valid: false,
			error: "Agent name must contain only letters, numbers, hyphens, and underscores",
		};
	}
	return { valid: true };
}


/**
 * Agent templates for different use cases
 * 
 * Each template is a function that takes a context object with the agent name
 * and returns the complete markdown content for the agent file.
 */
const AGENT_TEMPLATES: Record<"basic" | "scout" | "worker", (ctx: { name: string }) => string> = {
	/**
	 * Basic template with minimal configuration
	 * - Suitable for specialized, single-purpose agents
	 * - Limited tool access for focused tasks
	 */
	basic: (ctx) => dedent`
		---
		name: ${ctx.name}
		description: Brief description of what this agent does
		model: claude-sonnet-4-5
		tools: read, grep, find, ls
		---

		You are a specialized AI agent for [purpose].

		Your responsibilities:
		- [Task 1]
		- [Task 2]

		Guidelines:
		- [Guideline 1]
		- [Guideline 2]
	`,

	/**
	 * Scout template for fast reconnaissance
	 * - Uses faster Haiku model for quick operations
	 * - Focused on information gathering and summarization
	 */
	scout: (ctx) => dedent`
		---
		name: ${ctx.name}
		description: Fast reconnaissance for [domain]
		model: claude-haiku-4-5
		tools: read, grep, find, ls, bash
		---

		You are a fast reconnaissance agent specializing in [domain].

		Your goal is to quickly gather relevant context and return compressed findings.

		Focus on:
		- Finding key files and patterns
		- Extracting important information
		- Providing concise summaries

		Keep responses brief and actionable.
	`,

	/**
	 * Worker template with full tool access
	 * - General-purpose agent with all default tools
	 * - Suitable for complex, multi-step tasks
	 */
	worker: (ctx) => dedent`
		---
		name: ${ctx.name}
		description: General-purpose agent for [domain]
		model: claude-sonnet-4-5
		---

		You are a capable AI agent with full tool access for [domain].

		Your responsibilities:
		- [Task 1]
		- [Task 2]
		- [Task 3]

		You have access to all default tools for reading, writing, executing commands, and more.
	`,
};

const Messages = {
	ValidationError: (error: string) => `Error: ${error}`,
	AgentExists: (name: string, path: string) =>
		`Error: Agent '${name}' already exists at ${path}\n\nUse /subagent edit ${name} to modify it.`,
	UnableToCreateDir: (dir: string, err: unknown) =>
		`Error: Cannot create directory ${dir}\n${err}`,
	UnableToWriteFile: (err: unknown) => `Error: Cannot write agent file\n${err}`,
	AgentCreated: (name: string, template: string, path: string) => dedent`
		Creating agent: ${name}
		Template: ${template}
		Location: ${path}

		✓ Agent created successfully!

		Next steps:
		  1. Edit ${path} to customize the system prompt
		  2. Test with the subagent tool
		  3. Use in conversations with: "Use ${name} to [task description]"
	`,
};


/**
 * Generate template content for a new agent
 * 
 * Creates agent markdown file with YAML frontmatter and system prompt.
 * 
 * @param name - Agent name for the template
 * @param template - Template type to generate
 *   - "basic": Minimal template with core fields only
 *   - "scout": Fast reconnaissance with read/grep/find/bash tools
 *   - "worker": Full-capability template with all default tools
 * @returns Complete markdown content for the agent file
 */
function generateTemplate(name: string, template: "basic" | "scout" | "worker"): string {
	return AGENT_TEMPLATES[template]({ name });
}

export function handleAdd(args: string, ctx: Parameters<Parameters<ExtensionAPI['registerCommand']>[1]['handler']>[1]) {
	const { name, template } = parseAddArgs(args);

	// Validate name
	const validation = validateAgentName(name);
	if (!validation.valid) {
		ctx.ui.notify(Messages.ValidationError(validation.error!), "error");
		return;
	}

	// Get target path (always user-level)
	const agentPath = path.join(PredicatableAgentPaths.User, `${name}.md`);
	const agentDir = path.dirname(agentPath);

	// Check if agent already exists
	if (fs.existsSync(agentPath)) {
		const relativePath = agentPath.replace(os.homedir(), "~");
		ctx.ui.notify(Messages.AgentExists(name, relativePath), "error");
		return;
	}

	// Create directory if needed
	try {
		fs.mkdirSync(agentDir, { recursive: true });
	} catch (err) {
		ctx.ui.notify(Messages.UnableToCreateDir(agentDir, err), "error");
		return;
	}

	// Generate and write template
	const content = generateTemplate(name, template);
	try {
		fs.writeFileSync(agentPath, content, "utf-8");
	} catch (err) {
		ctx.ui.notify(Messages.UnableToWriteFile(err), "error");
		return;
	}

	// Success message
	const relativePath = agentPath.replace(os.homedir(), "~");
	ctx.ui.notify(Messages.AgentCreated(name, template, relativePath), "info");
}
