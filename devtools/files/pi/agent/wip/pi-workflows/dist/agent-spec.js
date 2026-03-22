/**
 * Agent spec loading — YAML specs are the source of truth.
 *
 * Agent specs are declarative YAML files that define typed functions:
 * InputSchema → OutputSchema, with template references for prompt
 * composition. The .md that pi consumes is compiled at dispatch time
 * from spec + templates + typed input. It exists in memory only.
 *
 * Search order (first match wins):
 *   1. .pi/agents/<name>.agent.yaml     (project)
 *   2. ~/.pi/agent/agents/<name>.agent.yaml  (user)
 *   3. <package>/agents/<name>.agent.yaml (builtin)
 */
import fs from "node:fs";
import path from "node:path";
/** Check if a prompt.system value looks like a template file path vs inline text. */
function isTemplatePath(value) {
    if (!value)
        return false;
    return value.endsWith(".md") || value.endsWith(".txt") || (value.includes("/") && !value.includes("\n"));
}
import os from "node:os";
import { parse as parseYaml } from "yaml";
/**
 * Thrown when an agent spec file is not found in any search path.
 */
export class AgentNotFoundError extends Error {
    agentName;
    searchPaths;
    constructor(agentName, searchPaths) {
        const pathList = searchPaths.map((p) => `  - ${p}`).join("\n");
        super(`Agent '${agentName}' not found. Searched:\n${pathList}`);
        this.name = "AgentNotFoundError";
        this.agentName = agentName;
        this.searchPaths = searchPaths;
    }
}
/**
 * Thrown when an agent spec file exists but cannot be read or parsed.
 */
export class AgentParseError extends Error {
    agentName;
    filePath;
    cause;
    constructor(agentName, filePath, cause) {
        super(`Agent '${agentName}' at ${filePath}: ${cause.message}`);
        this.name = "AgentParseError";
        this.agentName = agentName;
        this.filePath = filePath;
        this.cause = cause;
    }
}
/**
 * Parse a YAML agent spec file into an AgentSpec.
 */
export function parseAgentYaml(filePath) {
    const name = path.basename(filePath, ".agent.yaml");
    let content;
    try {
        content = fs.readFileSync(filePath, "utf-8");
    }
    catch (err) {
        throw new AgentParseError(name, filePath, err instanceof Error ? err : new Error(String(err)));
    }
    let spec;
    try {
        spec = parseYaml(content);
    }
    catch (err) {
        throw new AgentParseError(name, filePath, err instanceof Error ? err : new Error(String(err)));
    }
    // Handle null/undefined from parsing empty file or non-mapping YAML
    if (!spec || typeof spec !== "object") {
        throw new AgentParseError(name, filePath, new Error("File is empty or does not contain a YAML mapping"));
    }
    return {
        name: spec.name || name,
        description: spec.description,
        role: spec.role,
        model: spec.model,
        thinking: spec.thinking,
        tools: spec.tools,
        extensions: spec.extensions,
        skills: spec.skills,
        output: spec.output?.file,
        promptTemplate: isTemplatePath(spec.prompt?.system) ? spec.prompt?.system : undefined,
        systemPrompt: isTemplatePath(spec.prompt?.system) ? undefined : spec.prompt?.system,
        taskTemplate: spec.prompt?.task,
        inputSchema: spec.input,
        outputFormat: spec.output?.format,
        outputSchema: spec.output?.schema,
    };
}
/**
 * Create an agent loader that finds .agent.yaml specs.
 */
export function createAgentLoader(cwd, builtinDir) {
    const defaultBuiltinDir = builtinDir ?? path.resolve(import.meta.dirname, "..", "agents");
    return (name) => {
        const searchPaths = [
            path.join(cwd, ".pi", "agents", `${name}.agent.yaml`),
            path.join(os.homedir(), ".pi", "agent", "agents", `${name}.agent.yaml`),
            path.join(defaultBuiltinDir, `${name}.agent.yaml`),
        ];
        for (const p of searchPaths) {
            if (fs.existsSync(p))
                return parseAgentYaml(p);
        }
        throw new AgentNotFoundError(name, searchPaths);
    };
}
//# sourceMappingURL=agent-spec.js.map