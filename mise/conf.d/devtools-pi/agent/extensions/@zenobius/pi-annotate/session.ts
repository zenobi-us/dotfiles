import type { SessionEntry, SessionMessageEntry } from "@earendil-works/pi-coding-agent";

import type { LastAssistantMessageData, LastAssistantMessageLookupResult } from "./types.js";

function assistantMessageText(
	messageEntry: SessionMessageEntry,
): { kind: "assistant"; text: string } | { kind: "incomplete"; stopReason: string } | null {
	const { message } = messageEntry;
	if (!("role" in message) || message.role !== "assistant") {
		return null;
	}
	if (message.stopReason !== "stop") {
		return { kind: "incomplete", stopReason: String(message.stopReason) };
	}
	if (!Array.isArray(message.content)) {
		return { kind: "assistant", text: "" };
	}
	return {
		kind: "assistant",
		text: message.content
			.filter((part): part is { type: "text"; text: string } => part.type === "text" && typeof part.text === "string")
			.map((part) => part.text)
			.join("\n")
			.replace(/\r\n?/g, "\n"),
	};
}


export function findLastAssistantMessage(branch: SessionEntry[]): LastAssistantMessageLookupResult {
	for (let index = branch.length - 1; index >= 0; index -= 1) {
		const entry = branch[index];
		if (entry.type !== "message") {
			continue;
		}
		const extracted = assistantMessageText(entry);
		if (extracted == null) {
			continue;
		}
		if (extracted.kind === "incomplete") {
			return {
				ok: false,
				code: "incomplete",
				message: `Latest assistant message is incomplete (${extracted.stopReason}). Wait for it to finish, then try again.`,
			};
		}

		const text = extracted.text;
		const trimmed = text.trim();
		if (trimmed.length === 0) {
			return {
				ok: false,
				code: "empty",
				message: "Latest assistant message has no text to annotate.",
			};
		}

		const lines = text.split("\n");
		const data: LastAssistantMessageData = {
			text,
			lines: lines.map((line, lineIndex) => ({ number: lineIndex + 1, text: line })),

		};
		return { ok: true, data };
	}

	return {
		ok: false,
		code: "missing",
		message: "No assistant messages found on the current session branch.",
	};
}
