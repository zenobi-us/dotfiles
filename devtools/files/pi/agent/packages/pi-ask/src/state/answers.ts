import type {
	AskDisplayOption,
	AskResultAnswer,
	AskSelectedOption,
	AskStateAnswer,
} from "../types.ts";

export interface ExtraOptionNote {
	label: string;
	note: string;
}

export function emptyAnswer(): AskStateAnswer {
	return { selected: [] };
}

export function cloneAnswer(answer: AskStateAnswer): AskStateAnswer {
	return {
		selected: answer.selected.map(cloneSelection),
		customSelected: answer.customSelected,
		customText: answer.customText,
		note: answer.note,
		optionNotes: answer.optionNotes ? { ...answer.optionNotes } : undefined,
	};
}

export function cloneResultAnswer(answer: AskResultAnswer): AskResultAnswer {
	return {
		values: [...answer.values],
		labels: [...answer.labels],
		indices: [...answer.indices],
		customText: answer.customText,
		note: answer.note,
		optionNotes: answer.optionNotes ? { ...answer.optionNotes } : undefined,
	};
}

export function toggleSelection(
	answer: AskStateAnswer,
	option: AskDisplayOption,
	index: number
): AskStateAnswer {
	const next = cloneAnswer(answer);
	const selectedIndex = next.selected.findIndex(
		(selection) => selection.value === option.value
	);

	if (selectedIndex >= 0) {
		next.selected.splice(selectedIndex, 1);
		return next;
	}

	next.selected.push({
		value: option.value,
		label: option.label,
		index: index + 1,
	});
	return next;
}

export function setSingleSelection(
	answer: AskStateAnswer,
	option: AskDisplayOption,
	index: number
): AskStateAnswer {
	return {
		...emptyAnswer(),
		note: answer.note,
		optionNotes: answer.optionNotes ? { ...answer.optionNotes } : undefined,
		selected: [
			{
				value: option.value,
				label: option.label,
				index: index + 1,
			},
		],
	};
}

export function saveCustomText(
	answer: AskStateAnswer,
	rawValue: string,
	mode: "single" | "multi"
): AskStateAnswer {
	const trimmed = rawValue.trim();
	const next = cloneAnswer(answer);
	if (mode === "single") {
		next.selected = [];
	}
	if (!trimmed) {
		next.customSelected = undefined;
		next.customText = undefined;
		return next;
	}
	next.customSelected = true;
	next.customText = rawValue;
	return next;
}

export function setCustomSelected(
	answer: AskStateAnswer,
	selected: boolean
): AskStateAnswer {
	const next = cloneAnswer(answer);
	next.customSelected = selected || undefined;
	return next;
}

export function saveQuestionNote(
	answer: AskStateAnswer,
	rawValue: string
): AskStateAnswer {
	const next = cloneAnswer(answer);
	if (rawValue.trim()) {
		next.note = rawValue;
		return next;
	}
	next.note = undefined;
	return next;
}

export function saveOptionNote(
	answer: AskStateAnswer,
	optionValue: string,
	rawValue: string
): AskStateAnswer {
	const next = cloneAnswer(answer);
	const optionNotes = { ...(next.optionNotes ?? {}) };
	if (rawValue.trim()) {
		optionNotes[optionValue] = rawValue;
	} else {
		delete optionNotes[optionValue];
	}
	next.optionNotes =
		Object.keys(optionNotes).length > 0 ? optionNotes : undefined;
	return next;
}

export function isAnswerEmpty(answer: AskStateAnswer): boolean {
	return (
		answer.selected.length === 0 &&
		!answer.customText &&
		!answer.note &&
		(!answer.optionNotes || Object.keys(answer.optionNotes).length === 0)
	);
}

export function isAnswerAnswered(answer?: AskStateAnswer): boolean {
	if (!answer) {
		return false;
	}
	return (
		answer.selected.length > 0 ||
		!!(answer.customSelected && answer.customText?.trim())
	);
}

export function hasAnswerNotes(answer?: AskStateAnswer): boolean {
	return !!(answer?.note || answer?.optionNotes);
}

export function isResultAnswerEmpty(answer: AskResultAnswer): boolean {
	return (
		answer.values.length === 0 &&
		answer.labels.length === 0 &&
		answer.indices.length === 0 &&
		!answer.customText &&
		!answer.note &&
		(!answer.optionNotes || Object.keys(answer.optionNotes).length === 0)
	);
}

export function isResultAnswerCommitted(answer: AskResultAnswer): boolean {
	return (
		answer.values.length > 0 ||
		answer.labels.length > 0 ||
		answer.indices.length > 0 ||
		!!answer.customText
	);
}

export function isCustomOnlyAnswer(answer: AskResultAnswer): boolean {
	return answer.indices.length === 0 && !!answer.customText;
}

export function isOptionSelected(
	answer: AskStateAnswer | undefined,
	optionValue: string
): boolean {
	return !!answer?.selected.some(
		(selection) => selection.value === optionValue
	);
}

export function serializeAnswer(answer: AskStateAnswer): AskResultAnswer {
	const selectedCustomText = answer.customSelected
		? answer.customText
		: undefined;
	const values = [
		...answer.selected.map((selection) => selection.value),
		...(selectedCustomText ? [selectedCustomText] : []),
	];
	const labels = [
		...answer.selected.map((selection) => selection.label),
		...(selectedCustomText ? [selectedCustomText] : []),
	];
	const indices = answer.selected.map((selection) => selection.index);
	const selectedNotes = answer.optionNotes
		? Object.fromEntries(
				answer.selected
					.map((selection) => [
						selection.value,
						answer.optionNotes?.[selection.value],
					])
					.filter((entry): entry is [string, string] => !!entry[1])
			)
		: undefined;

	return {
		values,
		labels,
		indices,
		customText: selectedCustomText,
		note: answer.note,
		optionNotes:
			selectedNotes && Object.keys(selectedNotes).length > 0
				? selectedNotes
				: undefined,
	};
}

export function getExtraOptionNotes(args: {
	answer: AskStateAnswer;
	questionOptions: Array<{ value: string; label: string }>;
	selectedValues?: Iterable<string>;
}): ExtraOptionNote[] {
	const selectedValues = new Set(args.selectedValues ?? []);
	return Object.entries(args.answer.optionNotes ?? {})
		.filter(([value, note]) => !selectedValues.has(value) && Boolean(note))
		.map(([value, note]) => {
			const option = args.questionOptions.find(
				(candidate) => candidate.value === value
			);
			return option ? { label: option.label, note } : undefined;
		})
		.filter((entry): entry is ExtraOptionNote => Boolean(entry));
}

function cloneSelection(selection: AskSelectedOption): AskSelectedOption {
	return { ...selection };
}
