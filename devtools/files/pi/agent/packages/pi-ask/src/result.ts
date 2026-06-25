import {
	CANCELLED_RESULT_TEXT,
	ELABORATED_RESULT_TEXT,
	SUBMITTED_RESULT_TEXT,
} from "./constants/text.ts";
import { formatElaborationLines, formatResultLines } from "./result-format.ts";
import type { AskResult } from "./types.ts";

export function renderResultText(result: AskResult): string {
	if (result.error) {
		return "Invalid input";
	}
	if (result.cancelled) {
		return CANCELLED_RESULT_TEXT;
	}
	if (result.mode === "elaborate") {
		const lines = formatElaborationLines(result, { mode: "render" });
		return lines.join("\n") || ELABORATED_RESULT_TEXT;
	}

	const lines = formatResultLines(result, { mode: "render" });
	return lines.join("\n") || SUBMITTED_RESULT_TEXT;
}
