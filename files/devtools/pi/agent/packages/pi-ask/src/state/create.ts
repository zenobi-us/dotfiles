import type { AskParams } from "../types.ts";
import { normalizeQuestions } from "./normalize.ts";
import { createInitialState as createBaseState } from "./transitions.ts";

interface CreateInitialStateOptions {
	allowFreeform?: boolean;
	presentSingleAsMulti?: boolean;
}

export function createInitialState(
	params: AskParams,
	options: CreateInitialStateOptions = {}
) {
	return createBaseState({
		title: params.title,
		questions: normalizeQuestions(params, options),
	});
}
