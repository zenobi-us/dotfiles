import type { AnnotateLastMessageInlineComment, AnnotateLastMessageSubmitPayload } from "./types.js";

const EXCERPT_LIMIT = 120;

function truncateExcerpt(value: string, limit = EXCERPT_LIMIT): string {
	const normalized = value.replace(/\s+/g, " ").trim();
	if (normalized.length === 0) return "(blank line)";
	if (normalized.length <= limit) return normalized;
	return `${normalized.slice(0, Math.max(0, limit - 1)).trimEnd()}…`;
}

function formatInlineComment(comment: AnnotateLastMessageInlineComment): string {
	const lineRange = comment.startLine === comment.endLine
		? `line ${comment.startLine}`
		: `lines ${comment.startLine}-${comment.endLine}`;
	return `${lineRange} — “${truncateExcerpt(comment.selectedText)}”`;
}


export function hasAnnotateLastMessageFeedback(payload: AnnotateLastMessageSubmitPayload): boolean {
	if (payload.overallComment.trim().length > 0) {
		return true;
	}
	if (payload.inlineComments.some((comment) => comment.body.trim().length > 0)) {
		return true;
	}
	return false;
}

export function composeAnnotateLastMessagePrompt(
	payload: AnnotateLastMessageSubmitPayload,
): string {
	const inlineComments = payload.inlineComments
		.filter((comment) => comment.body.trim().length > 0)
		.sort((left, right) => left.startLine - right.startLine || left.endLine - right.endLine);

	const lines: string[] = [];

	lines.push("Please revisit your last assistant message using the annotation feedback below.");
	lines.push("");
	lines.push("Treat this as planning-oriented feedback:");
	lines.push("- update your explanation, plan, or proposed approach in chat;");
	lines.push("- do not assume any code or file changes have already been applied;");
	lines.push("- do not auto-apply anything outside the normal response flow.");
	lines.push("");

	const overallComment = payload.overallComment.trim();
	if (overallComment.length > 0) {
		lines.push("## Overall guidance");
		lines.push(overallComment);
		lines.push("");
	}


	if (inlineComments.length > 0) {
		lines.push("## Inline comments");
		inlineComments.forEach((comment, index) => {
			lines.push(`${index + 1}. ${formatInlineComment(comment)}`);
			lines.push(`   ${comment.body.trim()}`);
			lines.push("");
		});
	}

	lines.push("Please respond by revising your last message or its plan in chat, incorporating the feedback above.");
	return lines.join("\n").trim();
}
