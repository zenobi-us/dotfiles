export type PatchActionKind = "add" | "update" | "delete";

export interface PatchHunk {
	lines: string[];
}

export interface PatchAction {
	kind: PatchActionKind;
	path: string;
	moveTo?: string;
	hunks: PatchHunk[];
}

export interface ParsedPatch {
	actions: PatchAction[];
}

function normalizePatchText(input: string): string[] {
	return input.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
}

function parseHeader(line: string): { kind: PatchActionKind; path: string } | undefined {
	const match = line.match(/^\*\*\* (Add|Update|Delete) File: (.+)$/);
	if (!match) return undefined;
	const kind = match[1]!.toLowerCase() as PatchActionKind;
	const path = match[2]!.trim();
	if (!path) throw new Error("Patch file header is missing a path.");
	return { kind, path };
}

function ensurePatchLine(action: PatchAction, line: string): void {
	if (line === "\\ No newline at end of file") return;
	if (action.kind === "add") {
		if (!line.startsWith("+")) throw new Error(`Add File patch lines must start with '+': ${action.path}`);
		return;
	}
	if (action.kind === "delete") {
		if (!(line.startsWith("-") || line.startsWith(" "))) throw new Error(`Delete File patch lines must start with '-' or space: ${action.path}`);
		return;
	}
	if (!(line.startsWith("+") || line.startsWith("-") || line.startsWith(" "))) {
		throw new Error(`Update File patch lines must start with '+', '-', or space: ${action.path}`);
	}
}

export function parseApplyPatch(input: string): ParsedPatch {
	if (typeof input !== "string" || input.trim().length === 0) throw new Error("apply_patch input must be a non-empty string.");
	const lines = normalizePatchText(input);
	let index = 0;
	while (index < lines.length && lines[index]!.trim() === "") index++;
	if (lines[index] !== "*** Begin Patch") throw new Error("Patch must start with '*** Begin Patch'.");
	index++;

	const actions: PatchAction[] = [];
	let sawEnd = false;
	while (index < lines.length) {
		const line = lines[index]!;
		if (line === "*** End Patch") {
			sawEnd = true;
			break;
		}
		const header = parseHeader(line);
		if (!header) throw new Error(`Expected patch file header at line ${index + 1}.`);
		const action: PatchAction = { kind: header.kind, path: header.path, hunks: [] };
		let current: PatchHunk = { lines: [] };
		index++;
		while (index < lines.length) {
			const bodyLine = lines[index]!;
			if (bodyLine === "*** End Patch" || parseHeader(bodyLine)) break;
			if (bodyLine.startsWith("*** Move to: ")) {
				action.moveTo = bodyLine.slice("*** Move to: ".length).trim();
				if (!action.moveTo) throw new Error(`Move target is empty for ${action.path}.`);
				if (action.kind !== "update") throw new Error("Only Update File patches may include '*** Move to:'.");
				index++;
				continue;
			}
			if (bodyLine.startsWith("@@")) {
				if (current.lines.length > 0) action.hunks.push(current);
				current = { lines: [] };
				index++;
				continue;
			}
			ensurePatchLine(action, bodyLine);
			current.lines.push(bodyLine);
			index++;
		}
		if (current.lines.length > 0) action.hunks.push(current);
		if (action.kind !== "delete" && action.hunks.length === 0 && !action.moveTo) throw new Error(`Patch action has no hunks: ${action.path}`);
		actions.push(action);
	}
	if (!sawEnd) throw new Error("Patch must end with '*** End Patch'.");
	if (actions.length === 0) throw new Error("Patch contains no file actions.");
	return { actions };
}

export function actionSummary(action: PatchAction): string {
	if (action.kind === "add") return `create ${action.path}`;
	if (action.kind === "delete") return `delete ${action.path}`;
	if (action.moveTo) return `update ${action.path} and move to ${action.moveTo}`;
	return `update ${action.path}`;
}
