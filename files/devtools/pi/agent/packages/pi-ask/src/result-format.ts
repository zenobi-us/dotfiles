import { ELABORATED_SUMMARY } from "./constants/text.ts";
import { isCustomOnlyAnswer } from "./state/answers.ts";
import type { AskResult } from "./types.ts";

export function formatResultLines(
	result: AskResult,
	options: { mode: "summary" | "render" }
): string[] {
	const lines: string[] = [];

	let hasPresentationOverride = false;

	for (const question of result.questions) {
		const answer = result.answers[question.id];
		if (!answer) {
			continue;
		}

		const answerLine = formatAnswerLine(question.label, answer, options.mode);
		if (answerLine) {
			lines.push(answerLine);
		}

		if (hasPresentedTypeOverride(question.type, question.presentedType)) {
			hasPresentationOverride = true;
		}

		const questionNoteLine = formatQuestionNoteLine(
			question.label,
			answer.note,
			options.mode
		);
		if (questionNoteLine) {
			lines.push(questionNoteLine);
		}

		lines.push(...formatOptionNoteLines(question.label, answer, options.mode));
	}

	if (hasPresentationOverride) {
		lines.push(formatPresentationNoteLine(options.mode));
	}

	return lines;
}

function formatAnswerLine(
	questionLabel: string,
	answer: AskResult["answers"][string],
	mode: "summary" | "render"
): string | undefined {
	const answerText = answer.labels.join(", ");
	if (!answerText) {
		return;
	}
	if (mode === "summary") {
		return `${questionLabel}: ${answerText}`;
	}
	if (isCustomOnlyAnswer(answer)) {
		return `✓ ${questionLabel}: (wrote) ${answerText}`;
	}
	return `✓ ${questionLabel}: ${answerText}`;
}

function hasPresentedTypeOverride(
	type: string,
	presentedType: string | undefined
): boolean {
	return !!presentedType && presentedType !== type;
}

function formatPresentationNoteLine(mode: "summary" | "render"): string {
	const text =
		"Note: Some questions were presented as multi-select by user preference.";
	return mode === "summary" ? text : `  ${text}`;
}

function formatQuestionNoteLine(
	questionLabel: string,
	note: string | undefined,
	mode: "summary" | "render"
): string | undefined {
	if (!note) {
		return;
	}
	return mode === "summary"
		? `${questionLabel} note: ${note}`
		: `  note: ${note}`;
}

export function formatElaborationLines(
	result: AskResult,
	_options: { mode: "summary" | "render" }
): string[] {
	const items = result.elaboration?.items ?? [];
	const lines = items.map((item) => {
		const answerContext = formatElaborationAnswerContext(item.answer);
		if (item.target.kind === "question") {
			return `User asked to elaborate on question ${quote(item.question.prompt)}${answerContext} with note ${quote(item.note)}`;
		}
		if (!("option" in item)) {
			return `User asked to elaborate on question ${quote(item.question.prompt)}${answerContext} with note ${quote(item.note)}`;
		}
		return `User asked to elaborate on question ${quote(item.question.prompt)} option ${quote(item.option.label)}${answerContext} with note ${quote(item.note)}`;
	});

	if (lines.length > 0) {
		return lines;
	}

	const answerLines = result.questions
		.map((question) => {
			const answer = result.answers[question.id];
			return answer?.labels.length
				? `User asked to elaborate on question ${quote(question.prompt)} after current answer ${quote(answer.labels.join(", "))}`
				: undefined;
		})
		.filter((line): line is string => Boolean(line));

	return answerLines.length > 0 ? answerLines : [ELABORATED_SUMMARY];
}

function formatElaborationAnswerContext(
	answer: AskResult["answers"][string] | undefined
): string {
	const labels = answer?.labels ?? [];
	if (labels.length === 0) {
		return "";
	}
	return ` after current answer ${quote(labels.join(", "))}`;
}

function quote(value: string): string {
	return JSON.stringify(value);
}

function formatOptionNoteLines(
	questionLabel: string,
	answer: AskResult["answers"][string],
	mode: "summary" | "render"
): string[] {
	const lines: string[] = [];
	for (let index = 0; index < answer.values.length; index++) {
		const value = answer.values[index];
		const label = answer.labels[index] ?? value;
		const note = answer.optionNotes?.[value];
		if (!note) {
			continue;
		}
		lines.push(
			mode === "summary"
				? `${questionLabel} / ${label} note: ${note}`
				: `  ${label} note: ${note}`
		);
	}
	return lines;
}
