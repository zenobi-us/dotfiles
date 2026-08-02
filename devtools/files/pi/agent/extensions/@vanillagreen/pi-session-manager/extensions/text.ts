import { homedir } from "node:os";
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";

const ANSI_PATTERN = /\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~]|\][^\x07]*(?:\x07|\x1B\\))/g;
const ANSI_GREEN_FG = "\x1b[32m";
const ANSI_RED_FG = "\x1b[31m";
const ANSI_YELLOW_FG = "\x1b[33m";
const ANSI_FG_RESET = "\x1b[39m";

export function ansiGreen(text: string): string { return `${ANSI_GREEN_FG}${text}${ANSI_FG_RESET}`; }
export function ansiRed(text: string): string { return `${ANSI_RED_FG}${text}${ANSI_FG_RESET}`; }
export function ansiYellow(text: string): string { return `${ANSI_YELLOW_FG}${text}${ANSI_FG_RESET}`; }

export function padAnsi(text: string, width: number): string {
	const safeWidth = Math.max(0, width);
	const clipped = truncateToWidth(text, safeWidth, "");
	return `${clipped}${" ".repeat(Math.max(0, safeWidth - visibleWidth(clipped)))}`;
}

export function centerAnsi(text: string, width: number): string {
	const safeWidth = Math.max(0, width);
	const clipped = truncateToWidth(text, safeWidth, "");
	const left = Math.max(0, Math.floor((safeWidth - visibleWidth(clipped)) / 2));
	return `${" ".repeat(left)}${clipped}`;
}

export function stripAnsi(text: string): string {
	return text.replace(ANSI_PATTERN, "");
}

export function oneLine(value: unknown, fallback = ""): string {
	const text = typeof value === "string" ? value : fallback;
	return stripAnsi(text)
		.replace(/[\r\n\t]+/g, " ")
		.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

export function shortenPath(path: string): string {
	const cleaned = oneLine(path);
	const home = homedir();
	if (!cleaned) return "";
	if (cleaned === home) return "~";
	if (cleaned.startsWith(`${home}/`)) return `~${cleaned.slice(home.length)}`;
	const parts = cleaned.split(/[\\/]+/).filter(Boolean);
	return parts.length <= 4 ? cleaned : `…/${parts.slice(-4).join("/")}`;
}

export function formatAge(date: Date): string {
	const diffMs = Math.max(0, Date.now() - date.getTime());
	const mins = Math.floor(diffMs / 60_000);
	const hours = Math.floor(diffMs / 3_600_000);
	const days = Math.floor(diffMs / 86_400_000);
	if (mins < 1) return "now";
	if (mins < 60) return `${mins}m`;
	if (hours < 24) return `${hours}h`;
	if (days < 7) return `${days}d`;
	if (days < 30) return `${Math.floor(days / 7)}w`;
	if (days < 365) return `${Math.floor(days / 30)}mo`;
	return `${Math.floor(days / 365)}y`;
}
