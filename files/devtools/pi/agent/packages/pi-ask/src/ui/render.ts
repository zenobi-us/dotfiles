import type { AskConfig } from "../config/schema.ts";
import {
	getCurrentQuestion,
	getRenderableOptions,
	isSubmitTab,
} from "../state/selectors.ts";
import type { AskState } from "../types.ts";
import { renderFrameFooter, renderFrameHeader } from "./render-frame.ts";
import { renderQuestionScreen } from "./render-question.ts";
import { renderSubmitScreen } from "./render-submit.ts";
import type { QuestionRenderContext, Theme } from "./render-types.ts";

export function renderAskScreen(args: {
	config: AskConfig;
	footerNotice?: string;
	reviewShortcutHint?: string;
	state: AskState;
	theme: Theme;
	width: number;
	editor: QuestionRenderContext["editor"];
}): string[] {
	const {
		config,
		footerNotice,
		reviewShortcutHint,
		state,
		theme,
		width,
		editor,
	} = args;
	const lines: string[] = [];
	const question = getCurrentQuestion(state);
	const options = getRenderableOptions(question);

	renderFrameHeader({ lines, state, theme, width });

	if (isSubmitTab(state)) {
		renderSubmitScreen(lines, state, theme, width, reviewShortcutHint);
	} else if (question) {
		renderQuestionScreen({
			lines,
			state,
			question,
			options,
			theme,
			width,
			editor,
		});
	}

	renderFrameFooter({ config, footerNotice, lines, state, theme, width });
	return lines;
}
