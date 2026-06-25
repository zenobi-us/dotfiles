import { visibleWidth } from "@earendil-works/pi-tui";
import { SUBMIT_CHOICES } from "../../constants/text.ts";
import { UI_DIMENSIONS } from "../../constants/ui.ts";
import { isCustomOnlyAnswer } from "../../state/answers.ts";
import {
	type ReviewAnswer,
	shouldRenderAnswersIndividually,
	toReviewAnswer,
} from "../../state/result.ts";
import type { AskState } from "../../types.ts";

export interface ReviewSelectionModel {
	label: string;
	note?: string;
}

export interface ReviewQuestionModel {
	answerText?: string;
	extraOptionNotes?: Array<{ label: string; note: string }>;
	isCustomOnly?: boolean;
	label: string;
	note?: string;
	selections?: ReviewSelectionModel[];
	unanswered: boolean;
}

export interface ReviewScreenModel {
	actionColumnWidth: number;
	actions: Array<{ label: string; selected: boolean }>;
	layout: "stacked" | "wide";
	questions: ReviewQuestionModel[];
}

export function buildReviewScreenModel(
	state: AskState,
	width: number
): ReviewScreenModel {
	const showAllNotes = state.activeSubmitActionIndex === 1;
	const actionColumnWidth = getSubmitActionColumnWidth();
	return {
		actionColumnWidth,
		actions: SUBMIT_CHOICES.map((label, index) => ({
			label,
			selected: index === state.activeSubmitActionIndex,
		})),
		layout: shouldUseWideSubmitLayout(width, actionColumnWidth)
			? "wide"
			: "stacked",
		questions: state.questions.map((question) =>
			toReviewQuestionModel(
				question.label,
				toReviewAnswer(question, state.answers[question.id], showAllNotes)
			)
		),
	};
}

function toReviewQuestionModel(
	label: string,
	answer: ReviewAnswer | undefined
): ReviewQuestionModel {
	if (!answer) {
		return { label, unanswered: true };
	}

	return {
		answerText: shouldRenderAnswersIndividually(answer)
			? undefined
			: answer.labels.join(", "),
		extraOptionNotes: answer.extraOptionNotes,
		isCustomOnly: isCustomOnlyAnswer(answer),
		label,
		note: answer.note,
		selections: shouldRenderAnswersIndividually(answer)
			? answer.labels.map((selectionLabel, index) => ({
					label: selectionLabel,
					note: answer.optionNotes?.[answer.values[index] ?? selectionLabel],
				}))
			: undefined,
		unanswered: false,
	};
}

function getSubmitActionColumnWidth(): number {
	return Math.max(
		...SUBMIT_CHOICES.map((choice, index) =>
			visibleWidth(`❯ ${index + 1}. ${choice}`)
		)
	);
}

function shouldUseWideSubmitLayout(
	width: number,
	actionColumnWidth: number
): boolean {
	return (
		width >= UI_DIMENSIONS.submitWideMinWidth &&
		width - actionColumnWidth - 2 >= UI_DIMENSIONS.submitMinReviewWidth
	);
}
