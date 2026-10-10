export interface LastAssistantMessageLine {
	number: number;
	text: string;
}

export interface LastAssistantMessageData {
	text: string;
	lines: LastAssistantMessageLine[];
}

export type LastAssistantMessageLookupResult =
	| { ok: true; data: LastAssistantMessageData }
	| { ok: false; code: "missing" | "incomplete" | "empty"; message: string };

export interface AnnotateLastMessageInlineComment {
	selectedText: string;
	startLine: number;
	endLine: number;
	body: string;
}

export interface AnnotateLastMessageSubmitPayload {
	type: "submit";
	overallComment: string;
	inlineComments: AnnotateLastMessageInlineComment[];
}

export interface AnnotateLastMessageCancelPayload {
	type: "cancel";
}

export type AnnotateLastMessageWindowMessage = AnnotateLastMessageSubmitPayload | AnnotateLastMessageCancelPayload;
