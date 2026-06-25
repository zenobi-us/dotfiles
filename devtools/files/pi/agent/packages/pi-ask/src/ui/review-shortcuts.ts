import { SUBMIT_CHOICES } from "../constants/text.ts";

const REVIEW_SHORTCUT_DIGIT_MIN = 1;
const REVIEW_SHORTCUT_DIGIT_MAX = 3;

export interface ReviewShortcutResolution {
	actionIndex?: number;
	confirmed: boolean;
	pendingActionIndex?: number;
}

export function resolveReviewShortcutDoublePress(
	digit: number,
	pendingActionIndex?: number
): ReviewShortcutResolution {
	if (digit < REVIEW_SHORTCUT_DIGIT_MIN || digit > REVIEW_SHORTCUT_DIGIT_MAX) {
		return { confirmed: false };
	}

	const actionIndex = digit - 1;
	if (pendingActionIndex === actionIndex) {
		return { actionIndex, confirmed: true };
	}

	return {
		actionIndex,
		confirmed: false,
		pendingActionIndex: actionIndex,
	};
}

export function getReviewShortcutHint(pendingActionIndex?: number): string {
	if (pendingActionIndex === undefined) {
		return "Press 1, 2, or 3 twice to confirm a review action.";
	}

	const actionLabel = SUBMIT_CHOICES[pendingActionIndex];
	if (!actionLabel) {
		return "Press 1, 2, or 3 twice to confirm a review action.";
	}

	return `Press ${pendingActionIndex + 1} again to ${actionLabel}.`;
}
