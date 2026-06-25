import type {
	ExtensionAPI,
	ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import { validateParams } from "./ask-tool-helpers.ts";
import type { AskParams } from "./types.ts";

export const ASK_PAYLOAD_ENTRY_TYPE = "ask:payload";
export const ASK_PAYLOAD_ENTRY_VERSION = 1;

export type AskPayloadSource = "answer-extraction" | "tool";

export interface AskPayloadEntryData {
	params: AskParams;
	source: AskPayloadSource;
	sourceEntryId?: string;
	timestamp: number;
	version: typeof ASK_PAYLOAD_ENTRY_VERSION;
}

export function appendAskPayload(
	pi: Pick<ExtensionAPI, "appendEntry">,
	data: Omit<AskPayloadEntryData, "timestamp" | "version">
): void {
	pi.appendEntry(ASK_PAYLOAD_ENTRY_TYPE, {
		version: ASK_PAYLOAD_ENTRY_VERSION,
		timestamp: Date.now(),
		...data,
	});
}

export function findLatestPayloadInCurrentBranch(
	ctx: Pick<ExtensionContext, "sessionManager">,
	source: AskPayloadSource
): { data?: AskPayloadEntryData; invalidMatchFound: boolean } {
	let invalidMatchFound = false;
	for (const entry of [...ctx.sessionManager.getBranch()].reverse()) {
		if (!isAskPayloadEntry(entry)) {
			continue;
		}
		const data = entry.data;
		if (data?.source !== source) {
			continue;
		}
		if (isValidAskPayloadData(data)) {
			return { data, invalidMatchFound };
		}
		invalidMatchFound = true;
	}
	return { invalidMatchFound };
}

function isAskPayloadEntry(entry: unknown): entry is {
	customType: string;
	data?: Partial<AskPayloadEntryData>;
	type: "custom";
} {
	return (
		!!entry &&
		typeof entry === "object" &&
		(entry as { type?: unknown }).type === "custom" &&
		(entry as { customType?: unknown }).customType === ASK_PAYLOAD_ENTRY_TYPE
	);
}

function isValidAskPayloadData(data: unknown): data is AskPayloadEntryData {
	if (!(data && typeof data === "object")) {
		return false;
	}
	const payload = data as Partial<AskPayloadEntryData>;
	if (payload.version !== ASK_PAYLOAD_ENTRY_VERSION) {
		return false;
	}
	if (payload.source !== "tool" && payload.source !== "answer-extraction") {
		return false;
	}
	if (
		!payload.params ||
		validateParams(payload.params, {
			allowFreeform: payload.source === "answer-extraction",
		}).ok === false
	) {
		return false;
	}
	return true;
}
