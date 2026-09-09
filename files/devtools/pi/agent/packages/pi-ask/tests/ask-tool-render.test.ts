import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { stripVTControlCharacters } from "node:util";
import { initTheme } from "@earendil-works/pi-coding-agent";
import {
	renderAskToolCall,
	renderAskToolResult,
} from "../src/ask-tool-helpers.ts";
import type { AskResult } from "../src/types.ts";

const theme = {
	bold: (text: string) => text,
	fg: (_color: string, text: string) => text,
} as unknown as Parameters<typeof renderAskToolCall>[1];

initTheme(undefined, false);

function render(component: { render(width: number): string[] }): string {
	return stripVTControlCharacters(component.render(160).join("\n"));
}

function submittedResult(): AskResult {
	return {
		title: "Project setup",
		cancelled: false,
		mode: "submit",
		questions: [
			{
				id: "scope",
				label: "Scope",
				prompt: "Which scope?",
				type: "single",
			},
			{
				id: "format",
				label: "Format",
				prompt: "Which format?",
				type: "multi",
			},
		],
		answers: {
			scope: {
				indices: [0],
				labels: ["Backend only"],
				values: ["backend"],
				note: "Keep the API stable",
				optionNotes: { backend: "No UI changes" },
			},
			format: {
				indices: [0, 1],
				labels: ["JSON", "Markdown"],
				values: ["json", "markdown"],
			},
		},
	};
}

describe("ask_user transcript renderer", () => {
	it("renders a compact waiting status while the tool is active", () => {
		const component = renderAskToolCall(
			{
				title: "Project setup",
				questions: [{ label: "Scope" }, { label: "Format" }],
			},
			theme,
			{ isPartial: true },
		);

		assert.equal(
			render(component).trimEnd(),
			"• Ask User `Project setup` · Waiting · 2 questions",
		);
	});

	it("hides answer details until the result is expanded", () => {
		const result = {
			content: [
				{ type: "text", text: "Scope: Backend only\nFormat: JSON, Markdown" },
			],
			details: submittedResult(),
		};
		const collapsed = renderAskToolResult(result, { expanded: false }, theme);
		const expanded = renderAskToolResult(result, { expanded: true }, theme);

		assert.match(render(collapsed), /Submitted · 2\/2 answered · .*expand/);
		assert.doesNotMatch(render(collapsed), /Backend only/);
		assert.match(render(expanded), /Scope:\s+Backend only/);
		assert.match(render(expanded), /note:\s+Keep the API stable/);
		assert.match(render(expanded), /Backend only note:\s+No UI changes/);
	});

	it("renders invalid and non-TUI results as expandable status rows", () => {
		const invalid = renderAskToolResult(
			{
				content: [
					{
						type: "text",
						text: "Invalid ask_user payload:\n- questions: at least one question is required",
					},
				],
				details: {
					answers: {},
					cancelled: true,
					mode: "submit",
					questions: [],
					error: {
						kind: "invalid_input",
						issues: [
							{
								path: "questions",
								message: "at least one question is required",
							},
						],
					},
				},
			},
			{ expanded: false },
			theme,
		);
		const nonTui = renderAskToolResult(
			{
				content: [
					{
						type: "text",
						text: "Needs user input: ask_user requires interactive TUI mode.",
					},
				],
				details: {
					...submittedResult(),
					answers: {},
					cancelled: true,
				},
			},
			{ expanded: false },
			theme,
		);

		assert.match(render(invalid), /Invalid Input · 1 issue · .*expand/);
		assert.match(render(nonTui), /Needs TUI · 0\/2 answered · .*expand/);
	});

	it("shows partial answers for cancelled results when expanded", () => {
		const details = submittedResult();
		details.cancelled = true;
		delete details.answers.format;
		const component = renderAskToolResult(
			{
				content: [{ type: "text", text: "User cancelled the ask flow" }],
				details,
			},
			{ expanded: true },
			theme,
		);
		const output = render(component);

		assert.match(output, /Cancelled · 1\/2 answered/);
		assert.match(output, /Backend only/);
	});

	it("ignores sanitized detail sentinels instead of falling back to raw output", () => {
		const details = submittedResult() as unknown as Record<string, unknown>;
		details.questions = [
			...(details.questions as unknown[]),
			"[output-policy: array truncated, dropped 2 item(s)]",
		];
		const component = renderAskToolResult(
			{
				content: [{ type: "text", text: "Scope: Backend only" }],
				details: details as unknown as AskResult,
			},
			{ expanded: true },
			theme,
		);
		const output = render(component);

		assert.match(output, /Submitted/);
		assert.match(output, /Backend only/);
		assert.doesNotMatch(output, /"answers"/);
	});
});
