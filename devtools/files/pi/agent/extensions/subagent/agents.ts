/**
 * Agent discovery and configuration
 */
import fg from "fast-glob";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import dedent from "dedent";

const AGENTS_PATTERN = ["**", "agents", "**", "*.md"].join(path.sep);

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
function getGitRootDir(startDir: string): string | undefined {
  const gitPath = findFirstUp(startDir, ".git");
  return gitPath ? path.dirname(gitPath) : undefined;
}


/**
 * Get all directories where agents are searched for.
 * 
 * Returns paths in search order (higher priority first):
 * 1. ~/.pi/agent/agents (global agents)
 * 2. Project-specific .pi/agents directories (from cwd up to git root or home)
 */
export function getAgentSearchPaths(cwd: string): string[] {
  const searchPaths: string[] = [];
  const globalAgentsDir = path.join(os.homedir(), ".pi",);

  // Global agents directory (always first)
  if (isDirectory(globalAgentsDir)) {
    searchPaths.push(globalAgentsDir);
  }

  // Find all .pi/agents directories from cwd up to boundaries
  const boundaries = [
    os.homedir(),
    getGitRootDir(cwd)
  ].filter(Boolean) as string[];

  let currentDir = path.resolve(cwd);
  const isBoundary = (p: string) => boundaries.some((bp) => p === bp);

  while (true) {
    const projectAgentsDir = path.join(currentDir, ".pi");
    if (isDirectory(projectAgentsDir) && !searchPaths.includes(projectAgentsDir)) {
      searchPaths.push(projectAgentsDir);
    }

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

  return searchPaths;
}

export function discoverAgents(cwd: string): AgentDiscoveryResult {

  const agentMap = new Map<string, AgentConfig>();
  const paths = getAgentSearchPaths(cwd)

  const agentFiles = fg.sync(
    getAgentSearchPaths(cwd).map((p) => path.join(p, AGENTS_PATTERN)),
    {
      dot: true,
      absolute: true,
      followSymbolicLinks: true,
    }
  );


  for (const agentFile of agentFiles) {
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

