import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";
import { UI_DIMENSIONS } from "../constants/ui.ts";
import {
	measurePreviewLeftWidth,
	mergeColumns,
	pushSavedNote,
	pushWrappedText,
	renderEditorBlock,
	renderPreviewPaneContent,
} from "./render-helpers.ts";
import type { QuestionRenderContext, Theme } from "./render-types.ts";
import {
	buildQuestionScreenModel,
	type OptionDetailModel,
	type OptionRowModel,
} from "./view-models/question.ts";

export function renderQuestionScreen(context: QuestionRenderContext) {
	const { lines, question, theme, width } = context;
	const model = buildQuestionScreenModel(context);

	pushWrappedText(lines, question.prompt, width, theme, "text", " ", " ");
	renderQuestionNote(lines, model.questionNote, context);

	if (model.mode === "preview") {
		renderPreviewQuestion(context, model);
		return;
	}

	for (const row of model.rows) {
		renderStandardOption(lines, row, context);
	}
}

function renderQuestionNote(
	lines: string[],
	questionNote: ReturnType<typeof buildQuestionScreenModel>["questionNote"],
	context: QuestionRenderContext
) {
	if (!questionNote) {
		lines.push("");
		return;
	}
	if (questionNote.kind === "editor") {
		renderEditorWithIndent({
			lines,
			editor: context.editor,
			width: context.width,
			theme: context.theme,
			indent: " ",
			padding: UI_DIMENSIONS.editorContentPadding,
			placeholder: questionNote.placeholder,
		});
		lines.push("");
		return;
	}
	pushSavedNote({
		lines,
		note: questionNote.text,
		width: context.width,
		theme: context.theme,
		indent: " ",
	});
	lines.push("");
}

function renderStandardOption(
	lines: string[],
	row: OptionRowModel,
	context: QuestionRenderContext
) {
	if (row.isCustom && row.detail?.kind === "editor") {
		renderInteractiveCustomOption(lines, row, context);
		return;
	}

	pushWrappedText(
		lines,
		formatOptionLabel(row),
		context.width,
		context.theme,
		row.color,
		row.pointer,
		" ".repeat(visibleWidth(row.pointer))
	);
	renderOptionDescription(lines, row.description, context.width, context.theme);
	renderOptionDetail(lines, row.detail, context, {
		suppressLeadingGap: !!row.description,
	});
}

function renderPreviewQuestion(
	context: QuestionRenderContext,
	model: ReturnType<typeof buildQuestionScreenModel>
) {
	if (model.mode !== "preview") {
		return;
	}

	const { lines, width, theme } = context;
	const add = (text = "") => lines.push(truncateToWidth(text, width));

	if (model.previewLayout === "custom") {
		renderPreviewOptionList(model.rows, theme, width).forEach(add);
	} else if (model.previewLayout === "wide") {
		renderWidePreviewLayout(
			add,
			model.rows,
			theme,
			width,
			model.selectedOption
		);
	} else {
		renderStackedPreviewLayout(
			add,
			model.rows,
			theme,
			width,
			model.selectedOption
		);
	}

	renderOptionDetail(lines, model.selectedOptionDetail, context);
}

function renderWidePreviewLayout(
	add: (text?: string) => void,
	rows: OptionRowModel[],
	theme: Theme,
	width: number,
	selectedOption: ReturnType<typeof buildQuestionScreenModel>["selectedOption"]
) {
	const leftWidth = measurePreviewLeftWidth(rows, width);
	const rightWidth = Math.max(
		UI_DIMENSIONS.previewMinRightWidth,
		width - leftWidth - 2
	);
	const leftPane = renderPreviewOptionList(rows, theme, leftWidth);
	const rightPane = renderPreviewPaneContent(selectedOption, theme, rightWidth);
	for (const line of mergeColumns(leftPane, rightPane, leftWidth, width)) {
		add(line);
	}
}

function renderStackedPreviewLayout(
	add: (text?: string) => void,
	rows: OptionRowModel[],
	theme: Theme,
	width: number,
	selectedOption: ReturnType<typeof buildQuestionScreenModel>["selectedOption"]
) {
	renderPreviewOptionList(rows, theme, width).forEach(add);
	add("");
	renderPreviewPaneContent(selectedOption, theme, width).forEach(add);
}

function renderPreviewOptionList(
	rows: OptionRowModel[],
	theme: Theme,
	width: number
): string[] {
	const lines: string[] = [];
	for (const row of rows) {
		pushWrappedText(
			lines,
			`${row.index + 1}. ${row.label}`,
			width,
			theme,
			row.color,
			row.pointer,
			"  "
		);
		renderOptionDescription(lines, row.description, width, theme);
	}
	return lines;
}

function renderOptionDetail(
	lines: string[],
	detail: OptionDetailModel | undefined,
	context: QuestionRenderContext,
	options: { indent?: string; suppressLeadingGap?: boolean } = {}
) {
	if (!detail) {
		return;
	}
	const indent = options.indent ?? "     ";
	const padding =
		indent === " "
			? UI_DIMENSIONS.editorContentPadding
			: UI_DIMENSIONS.editorIndentedPadding;
	if (detail.withGap && !options.suppressLeadingGap) {
		lines.push("");
	}
	if (detail.kind === "editor") {
		renderEditorWithIndent({
			lines,
			editor: context.editor,
			width: context.width,
			theme: context.theme,
			indent,
			padding,
			placeholder: detail.placeholder,
		});
		return;
	}
	if (detail.kind === "saved-note") {
		pushSavedNote({
			lines,
			note: detail.text,
			width: context.width,
			theme: context.theme,
			indent,
		});
		return;
	}
	pushWrappedText(
		lines,
		detail.text,
		context.width,
		context.theme,
		"muted",
		indent,
		indent
	);
}

function renderEditorWithIndent(args: {
	lines: string[];
	editor: QuestionRenderContext["editor"];
	width: number;
	theme: Theme;
	indent: string;
	padding: number;
	placeholder: string;
}) {
	const { lines, editor, width, theme, indent, padding, placeholder } = args;
	renderEditorBlock({
		lines,
		editorLines: editor.render(
			Math.max(UI_DIMENSIONS.editorMinWidth, width - padding)
		),
		width,
		theme,
		indent,
		availableWidth: width - visibleWidth(indent),
		placeholder,
		isEmpty: editor.getText().length === 0,
	});
}

function formatOptionLabel(row: OptionRowModel): string {
	return row.isFreeformOnly
		? row.label
		: `${row.index + 1}. ${row.prefix}${row.label}`;
}

function renderInteractiveCustomOption(
	lines: string[],
	row: OptionRowModel,
	context: QuestionRenderContext
) {
	const indent = row.isFreeformOnly ? " " : row.pointer;
	pushWrappedText(
		lines,
		formatOptionLabel(row),
		context.width,
		context.theme,
		row.color,
		indent,
		" ".repeat(visibleWidth(indent))
	);
	renderOptionDetail(lines, row.detail, context, {
		indent: row.isFreeformOnly ? " " : undefined,
	});
}

function renderOptionDescription(
	lines: string[],
	description: string | undefined,
	width: number,
	theme: Theme
) {
	if (!description) {
		return;
	}
	pushWrappedText(lines, description, width, theme, "muted", "     ", "     ");
}
