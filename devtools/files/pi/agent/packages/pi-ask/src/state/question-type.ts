import type { AskQuestionType, AskState, AskStateAnswer } from "../types.ts";
import { isAnswerEmpty } from "./answers.ts";
import { getAnswer, getCurrentQuestion, isSubmitTab } from "./selectors.ts";

export interface QuestionTypeChangeResult {
	needsConfirmation: boolean;
	notice?: string;
	state: AskState;
}

export function cycleCurrentQuestionType(
	state: AskState,
	options: { confirmed?: boolean } = {}
): QuestionTypeChangeResult {
	if (isSubmitTab(state)) {
		return { needsConfirmation: false, state };
	}

	const question = getCurrentQuestion(state);
	if (!question) {
		return { needsConfirmation: false, state };
	}

	const nextType = getNextQuestionType(question);
	if (nextType === question.type) {
		return { needsConfirmation: false, state };
	}

	const answer = getAnswer(state, question.id);
	const requiresConfirmation =
		nextType === "single" && countCommittedAnswers(answer) > 1;
	if (requiresConfirmation && !options.confirmed) {
		return {
			needsConfirmation: true,
			notice:
				"Switching to single-select will clear selected options for this question. Press the type key again to confirm.",
			state,
		};
	}

	return {
		needsConfirmation: false,
		notice: getQuestionTypeChangeNotice(question.type, nextType),
		state: setQuestionType(state, question.id, nextType, {
			clearSelectedOptions: requiresConfirmation,
		}),
	};
}

function getNextQuestionType(question: {
	requestedType?: AskQuestionType;
	type: AskQuestionType;
}): AskQuestionType {
	const requestedType = question.requestedType ?? question.type;
	if (requestedType === "preview") {
		return question.type === "preview" ? "multi" : "preview";
	}
	switch (question.type) {
		case "single":
			return "multi";
		case "multi":
			return "single";
		case "preview":
			return "multi";
		default:
			return "multi";
	}
}

function countCommittedAnswers(answer: AskStateAnswer | undefined): number {
	if (!answer) {
		return 0;
	}
	return (
		answer.selected.length +
		(answer.customSelected && answer.customText?.trim() ? 1 : 0)
	);
}

function setQuestionType(
	state: AskState,
	questionId: string,
	type: AskQuestionType,
	options: { clearSelectedOptions: boolean }
): AskState {
	const questions = state.questions.map((question) => {
		if (question.id !== questionId) {
			return question;
		}
		const requestedType = question.requestedType ?? question.type;
		return {
			...question,
			type,
			requestedType,
			presentedType: type === requestedType ? undefined : type,
		};
	});

	const currentAnswer = state.answers[questionId];
	if (!(options.clearSelectedOptions && currentAnswer)) {
		return { ...state, questions };
	}

	const nextAnswer = {
		...currentAnswer,
		customSelected: currentAnswer.customText?.trim() ? true : undefined,
		selected: [],
	};
	const answers = { ...state.answers };
	if (isAnswerEmpty(nextAnswer)) {
		delete answers[questionId];
	} else {
		answers[questionId] = nextAnswer;
	}

	return {
		...state,
		questions,
		answers,
	};
}

function getQuestionTypeChangeNotice(
	from: AskQuestionType,
	to: AskQuestionType
): string {
	return `Question type changed from ${from} to ${to}.`;
}
