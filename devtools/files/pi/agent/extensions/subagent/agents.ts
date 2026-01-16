/**
 * Agent discovery and configuration
 */
import fg from "fast-glob";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import dedent from "dedent";

export type AgentScope = "user" | "project" | "both";

export interface AgentConfig {
  name: string;
  description: string;
  tools?: string[];
  model?: string;
  systemPrompt: string;
  filePath: string;
}

export interface AgentDiscoveryResult {
  agents: AgentConfig[];
}

function parseFrontmatter(content: string): {
  frontmatter: Record<string, string>;
  body: string;
} {
  const frontmatter: Record<string, string> = {};
  const normalized = content.replace(/\r\n/g, "\n");

  if (!normalized.startsWith("---")) {
    return { frontmatter, body: normalized };
  }

  const endIndex = normalized.indexOf("\n---", 3);
  if (endIndex === -1) {
    return { frontmatter, body: normalized };
  }

  const frontmatterBlock = normalized.slice(4, endIndex);
  const body = normalized.slice(endIndex + 4).trim();

  for (const line of frontmatterBlock.split("\n")) {
    const match = line.match(/^([\w-]+):\s*(.*)$/);
    if (match) {
      let value = match[2].trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      frontmatter[match[1]] = value;
    }
  }

  return { frontmatter, body };
}

/**
 * Summarise the content of an agent file to a brief description.
 *
 * This simply returns the first X lines for now.
 */
function summariseAgentContent(content: string, lines: number = 1): string {
  return content.trim().split("\n").slice(0, lines).join(" ").trim();
}

function loadAgent(filePath: string): AgentConfig | null {
  if (!filePath.endsWith(".md")) return null

  let content: string;
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }

  const parsed = parseFrontmatter(content);

  const tools = parsed.frontmatter.tools
    ?.split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const name = parsed.frontmatter.name || path.basename(filePath, ".md");
  const description = parsed.frontmatter.description || summariseAgentContent(parsed.body) || "No description";

  return {
    name,
    description,
    tools: tools && tools.length > 0 ? tools : undefined,
    model: parsed.frontmatter.model,
    systemPrompt: parsed.body,
    filePath,
  }
}


function isDirectory(p: string): boolean {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

const NON_GLOBAL_AGENTS_PATTERN = ".pi/agents/**/*.md";
const GLOBAL_AGENTS_PATTERN = "**/*.md";


/**
 * Find a path by searching upwards from a starting directory.
 */
function findFirstUp(startDir: string, targetPath: string): string | undefined {
  let currentDir = path.resolve(startDir);

  while (true) {
    const potentialPath = path.join(currentDir, targetPath);
    if (fs.existsSync(potentialPath)) {
      return potentialPath;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      break;
    }
    currentDir = parentDir;
  }
}

/**
 * Start at a dir and traverse upwards to find occurances of a path
  * and collect them.
  * Finish at a boundary path
  */
function findAllUp(
  startDir: string,
  targetPattern: string,
  boundaryPaths: string[],
): string[] {
  const foundPaths: string[][] = [];
  let currentDir = path.resolve(startDir);
  const isBoundary = (p: string) => boundaryPaths.some((bp) => p === bp);

  while (true) {
    const matches = fg.sync(targetPattern, {
      cwd: currentDir,
      absolute: true,
      followSymbolicLinks: true
    });
    foundPaths.push(matches);

    // Stop if current dir is a boundary 
    if (isBoundary(currentDir)) {
      break;
    }

    const parentDir = path.dirname(currentDir);
    // Stop if next dir is same as current or is a boundary
    if (parentDir === currentDir || isBoundary(parentDir)) {
      break;
    }
    currentDir = parentDir;
  }

  return foundPaths.flat();
}

function getGitRootDir(startDir: string): string | undefined {
  const gitPath = findFirstUp(startDir, ".git");
  return gitPath ? path.dirname(gitPath) : undefined;
}


export function discoverAgents(cwd: string): AgentDiscoveryResult {

  const agentMap = new Map<string, AgentConfig>();
  const globalAgentsDir = path.join(os.homedir(), ".pi", "agent", "agents");

  const paths = [
    ...fg.sync(GLOBAL_AGENTS_PATTERN, {
      cwd: globalAgentsDir,
      absolute: true,
      followSymbolicLinks: true
    }),
    ...findAllUp(
      cwd,
      NON_GLOBAL_AGENTS_PATTERN,
      [
        os.homedir(),
        getGitRootDir(cwd)
      ].filter(Boolean) as string[]),
  ]

  for (const agentFile of paths) {
    const file = path.resolve(agentFile);
    const agent = loadAgent(file);
    if (!agent) continue;
    agentMap.set(agent.name, agent);
  }


  return { agents: Array.from(agentMap.values()) };
}

export function renderAgentList(
  agents: AgentConfig[],
  options: { verbose?: boolean } = {},
): string {
  if (agents.length === 0) return "(No agents found)";

  return agents
    .map((a) => renderAgentListItem(a, options))
    .join("\n");

}

export function renderAgentListItem(agent: AgentConfig, options: { verbose?: boolean } = {}): string {

  if (!options.verbose) {
    return `  • ${agent.name} - ${agent.description}`;
  }

  return dedent`
  • ${agent.name}
    Description: ${agent.description}
    Model: ${agent.model || "(default)"}
    Tools: ${agent.tools && agent.tools.length > 0 ? agent.tools.join(", ") : "(none)"}
    File: ${agent.filePath}
  `;
}

