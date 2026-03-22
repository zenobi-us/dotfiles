import type { AgentSpec } from "./types.js";
/**
 * Thrown when an agent spec file is not found in any search path.
 */
export declare class AgentNotFoundError extends Error {
    readonly agentName: string;
    readonly searchPaths: string[];
    constructor(agentName: string, searchPaths: string[]);
}
/**
 * Thrown when an agent spec file exists but cannot be read or parsed.
 */
export declare class AgentParseError extends Error {
    readonly agentName: string;
    readonly filePath: string;
    readonly cause: Error;
    constructor(agentName: string, filePath: string, cause: Error);
}
/**
 * Parse a YAML agent spec file into an AgentSpec.
 */
export declare function parseAgentYaml(filePath: string): AgentSpec;
/**
 * Create an agent loader that finds .agent.yaml specs.
 */
export declare function createAgentLoader(cwd: string, builtinDir?: string): (name: string) => AgentSpec;
//# sourceMappingURL=agent-spec.d.ts.map