import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";
import { stripAnsi } from "./ansi.js";
import {
	DEFAULT_PERMISSION_GATE_COMMANDS,
	DEFAULT_PERMISSION_GATE_PREVIEW_CHARS,
	DEFAULT_PERMISSION_GATE_PREVIEW_LINES,
	DEFAULT_PERMISSION_GATE_PREVIEW_LINE_WIDTH,
} from "./constants.js";
import { boundedSettingNumber, settingStringAllowEmpty } from "./settings.js";
import { escapeRegex } from "./util.js";

interface PermissionGateMatcher {
	label: string;
	pattern: RegExp;
}

function splitPermissionGateCommands(raw: string): string[] {
	return raw
		.split(",")
		.map((entry) => entry.trim())
		.filter(Boolean);
}

function regexFromSlashPattern(entry: string): RegExp | undefined {
	if (!entry.startsWith("/")) return undefined;
	const end = entry.lastIndexOf("/");
	if (end <= 0) return undefined;
	const source = entry.slice(1, end);
	const flags = entry.slice(end + 1);
	try {
		return new RegExp(source, flags || "i");
	} catch {
		return undefined;
	}
}

function literalCommandPattern(entry: string): RegExp | undefined {
	const source = entry.split(/\s+/).map(escapeRegex).join("\\s+");
	if (!source) return undefined;
	try {
		return new RegExp(source, "i");
	} catch {
		return undefined;
	}
}

export function permissionGateCommands(cwd?: string): string[] {
	return splitPermissionGateCommands(settingStringAllowEmpty("permissionGate.commands", DEFAULT_PERMISSION_GATE_COMMANDS, cwd));
}

function permissionGateMatchers(cwd?: string): PermissionGateMatcher[] {
	return permissionGateCommands(cwd)
		.map((entry) => ({ label: entry, pattern: regexFromSlashPattern(entry) ?? literalCommandPattern(entry) }))
		.filter((matcher): matcher is PermissionGateMatcher => matcher.pattern instanceof RegExp);
}

export function permissionGateMatch(command: string, cwd?: string): string | undefined {
	for (const matcher of permissionGateMatchers(cwd)) {
		matcher.pattern.lastIndex = 0;
		if (matcher.pattern.test(command)) return matcher.label;
	}
	return undefined;
}

function formatCount(count: number, label: string): string {
	return `${count.toLocaleString()} ${label}${count === 1 ? "" : "s"}`;
}

function sanitizePermissionGatePreview(command: string): string {
	return stripAnsi(command)
		.replace(/\r\n/g, "\n")
		.replace(/\r/g, "\n")
		.replace(/\t/g, "    ")
		.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "\ufffd");
}

function permissionGateCommandPreview(command: string, cwd?: string): { text: string; totalChars: number; totalLines: number; truncated: boolean } {
	const maxLines = boundedSettingNumber("permissionGate.previewLines", DEFAULT_PERMISSION_GATE_PREVIEW_LINES, 4, 40, cwd);
	const maxChars = boundedSettingNumber("permissionGate.previewChars", DEFAULT_PERMISSION_GATE_PREVIEW_CHARS, 200, 5000, cwd);
	const maxLineWidth = boundedSettingNumber("permissionGate.previewLineWidth", DEFAULT_PERMISSION_GATE_PREVIEW_LINE_WIDTH, 40, 240, cwd);
	const safeCommand = sanitizePermissionGatePreview(command);
	const commandLines = safeCommand.split("\n");
	let selectedLines = commandLines;
	let omittedLines = 0;

	if (commandLines.length > maxLines) {
		const headCount = Math.max(1, Math.ceil((maxLines - 1) * 0.65));
		const tailCount = Math.max(1, maxLines - headCount - 1);
		omittedLines = Math.max(0, commandLines.length - headCount - tailCount);
		selectedLines = [
			...commandLines.slice(0, headCount),
			`… ${formatCount(omittedLines, "line")} omitted …`,
			...commandLines.slice(-tailCount),
		];
	}

	let widthTruncated = false;
	const previewLines = selectedLines.map((line) => {
		if (/^… \d[\d,]* lines? omitted …$/.test(line)) return line;
		if (visibleWidth(line) > maxLineWidth) widthTruncated = true;
		return truncateToWidth(line, maxLineWidth, "…");
	});

	let text = previewLines.join("\n").trimEnd();
	let charTruncated = false;
	if (text.length > maxChars) {
		const marker = `\n… preview clipped to ${formatCount(maxChars, "char")} …\n`;
		const budget = Math.max(0, maxChars - marker.length);
		const headChars = Math.ceil(budget * 0.6);
		const tailChars = Math.max(0, budget - headChars);
		const tail = tailChars > 0 ? text.slice(-tailChars).trimStart() : "";
		text = `${text.slice(0, headChars).trimEnd()}${marker}${tail}`;
		charTruncated = true;
	}

	return {
		text: text || "(empty command)",
		totalChars: command.length,
		totalLines: commandLines.length,
		truncated: omittedLines > 0 || widthTruncated || charTruncated,
	};
}

export function permissionGatePrompt(matched: string, command: string, cwd?: string): string {
	const preview = permissionGateCommandPreview(command, cwd);
	const matchedLabel = truncateToWidth(sanitizePermissionGatePreview(matched).replace(/\n+/g, " ").trim() || "configured pattern", DEFAULT_PERMISSION_GATE_PREVIEW_LINE_WIDTH, "…");
	const commandStats = `${formatCount(preview.totalLines, "line")}, ${formatCount(preview.totalChars, "char")}`;
	return [
		`Permission gate matched: ${matchedLabel}`,
		"",
		`Bash command (${commandStats}${preview.truncated ? "; compact preview" : ""}):`,
		"```sh",
		preview.text,
		"```",
		...(preview.truncated ? ["Full command is unchanged; only this approval preview was shortened."] : []),
		"",
		"Allow this bash command?",
	].join("\n");
}
