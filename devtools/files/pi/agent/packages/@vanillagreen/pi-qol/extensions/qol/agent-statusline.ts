import { truncateToWidth } from "@earendil-works/pi-tui";
import { readPiAgentsStatuslineBridge } from "./bridges.js";

type AgentAsciiColor = "red" | "green" | "yellow" | "blue" | "magenta" | "cyan";

const AGENT_ASCII_COLOR_SEQUENCE: AgentAsciiColor[] = ["magenta", "green", "blue", "cyan", "yellow", "red"];
const AGENT_ASCII_BG: Record<AgentAsciiColor, number> = {
	red: 41,
	green: 42,
	yellow: 43,
	blue: 44,
	magenta: 45,
	cyan: 46,
};

function normalizeAgentAsciiColor(value: string | undefined): AgentAsciiColor | undefined {
	const normalized = value?.trim().toLowerCase().replace(/[^a-z]/g, "");
	switch (normalized) {
		case "red": return "red";
		case "green": return "green";
		case "yellow":
		case "orange": return "yellow";
		case "blue": return "blue";
		case "magenta":
		case "purple":
		case "violet": return "magenta";
		case "cyan":
		case "teal": return "cyan";
		default: return undefined;
	}
}

function fallbackAgentAsciiColor(name: string): AgentAsciiColor {
	let hash = 0;
	for (const char of name) hash = ((hash * 31) + char.charCodeAt(0)) >>> 0;
	return AGENT_ASCII_COLOR_SEQUENCE[hash % AGENT_ASCII_COLOR_SEQUENCE.length] ?? "magenta";
}

function ansiAgentBg(color: AgentAsciiColor, text: string): string {
	return `\x1b[30;${AGENT_ASCII_BG[color]}m${text}\x1b[39;49m`;
}

export function subagentStatuslineMarker(cwd: string, maxInnerWidth = 24): { plain: string; styled: string } | undefined {
	const bridgeInfo = readPiAgentsStatuslineBridge()?.getCurrentSubagent(cwd);
	const envName = process.env.PI_SUBAGENT_CHILD_AGENT?.trim();
	const rawName = bridgeInfo?.name?.trim() || envName;
	if (!rawName) return undefined;
	const color = normalizeAgentAsciiColor(bridgeInfo?.color) ?? normalizeAgentAsciiColor(process.env.PI_SUBAGENT_CHILD_COLOR) ?? fallbackAgentAsciiColor(rawName);
	const inner = truncateToWidth(rawName, Math.max(1, maxInnerWidth), "…");
	const plain = ` ${inner} `;
	return { plain, styled: ansiAgentBg(color, plain) };
}
