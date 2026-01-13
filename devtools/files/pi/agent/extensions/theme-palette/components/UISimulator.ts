/**
 * UI Simulator Component
 * 
 * Showcases the theme palette in realistic UI contexts:
 * - Interactive buttons and controls
 * - Message bubbles and chat interfaces
 * - Code blocks with syntax highlighting
 * - Alerts and notifications
 * - Forms and inputs
 * - Cards and panels
 */

import type { Component } from "@mariozechner/pi-tui";
import { Box, Container, Text } from "@mariozechner/pi-tui";
import { Theme } from "@mariozechner/pi-coding-agent";
import { Flex } from "./Flex.js";
import { Grid } from "./Grid.js";
import { sized } from "./Sized.js";

export class UISimulator extends Container implements Component {
	private sections: Container[] = [];

	constructor(private theme: Theme) {
		super();
		this.buildSections();
	}

	private buildSections(): void {
		const th = this.theme;

		// Section 1: Interactive Elements
		this.sections.push(this.createInteractiveSection());
		
		// Section 2: Message Bubbles
		this.sections.push(this.createMessageSection());
		
		// Section 3: Code Blocks
		this.sections.push(this.createCodeSection());
		
		// Section 4: Alerts & Status
		this.sections.push(this.createAlertSection());
		
		// Section 5: Form Elements
		this.sections.push(this.createFormSection());

		// Add all sections to container
		for (const section of this.sections) {
			this.addChild(section);
		}
	}

	private createInteractiveSection(): Container {
		const th = this.theme;
		const container = new Container();

		// Section header
		const header = new Box(1, 1, (s) => th.bg("userMessageBg", s));
		const headerText = new Text(
			th.bold(th.fg("accent", "🎯 Interactive Elements")),
			0, 0
		);
		header.addChild(headerText);
		container.addChild(header);

		// Content box
		const content = new Box(2, 1, (s) => th.bg("customMessageBg", s));
		const grid = new Grid({ spacing: 3, minColumnWidth: 25 });

		// Primary Button
		const btnPrimary = this.createButton("Primary Action", "accent", "userMessageBg");
		grid.addChild(btnPrimary);

		// Secondary Button
		const btnSecondary = this.createButton("Secondary", "text", "toolPendingBg");
		grid.addChild(btnSecondary);

		// Danger Button
		const btnDanger = this.createButton("Delete", "error", "userMessageBg");
		grid.addChild(btnDanger);

		// Success Button
		const btnSuccess = this.createButton("Confirm", "success", "userMessageBg");
		grid.addChild(btnSuccess);

		// Disabled Button
		const btnDisabled = this.createButton("Disabled", "dim", "toolPendingBg");
		grid.addChild(btnDisabled);

		// Link Button
		const linkBtn = new Container();
		linkBtn.addChild(new Text(
			th.fg("accent", "→ ") + th.fg("mdLink", "View Documentation"),
			0, 0
		));
		grid.addChild(linkBtn);

		content.addChild(grid);
		container.addChild(content);

		return container;
	}

	private createButton(label: string, fgColor: any, bgColor: any): Container {
		const th = this.theme;
		const container = new Container();
		
		const box = new Box(1, 0, (s) => th.bg(bgColor, s));
		const text = new Text(
			" " + th.fg(fgColor, th.bold(label)) + " ",
			0, 0
		);
		box.addChild(text);
		container.addChild(box);
		
		return container;
	}

	private createMessageSection(): Container {
		const th = this.theme;
		const container = new Container();

		// Section header
		const header = new Box(1, 1, (s) => th.bg("userMessageBg", s));
		const headerText = new Text(
			th.bold(th.fg("accent", "💬 Message Bubbles")),
			0, 0
		);
		header.addChild(headerText);
		container.addChild(header);

		// Content box
		const content = new Box(2, 1, (s) => th.bg("customMessageBg", s));
		const messageContainer = new Container();

		// User Message
		const userMsg = new Box(2, 1, (s) => th.bg("userMessageBg", s));
		const userLabel = new Text(th.fg("customMessageLabel", th.bold("You")), 0, 0);
		const userText = new Text(
			th.fg("userMessageText", "Can you help me understand the color hierarchy?"),
			0, 0
		);
		userMsg.addChild(userLabel);
		userMsg.addChild(userText);
		messageContainer.addChild(userMsg);

		// AI Thinking
		const thinkingMsg = new Box(2, 1, (s) => th.bg("toolPendingBg", s));
		const thinkingLabel = new Text(th.fg("thinkingText", th.bold("AI")), 0, 0);
		const thinkingText = new Text(
			th.fg("dim", "● Thinking... (analyzing request)"),
			0, 0
		);
		thinkingMsg.addChild(thinkingLabel);
		thinkingMsg.addChild(thinkingText);
		messageContainer.addChild(thinkingMsg);

		// Custom Message (Tool Output)
		const customMsg = new Box(2, 1, (s) => th.bg("customMessageBg", s));
		const customLabel = new Text(th.fg("customMessageLabel", th.bold("System")), 0, 0);
		const customText = new Text(
			th.fg("customMessageText", "The color hierarchy uses four contrast levels..."),
			0, 0
		);
		customMsg.addChild(customLabel);
		customMsg.addChild(customText);
		messageContainer.addChild(customMsg);

		content.addChild(messageContainer);
		container.addChild(content);

		return container;
	}

	private createCodeSection(): Container {
		const th = this.theme;
		const container = new Container();

		// Section header
		const header = new Box(1, 1, (s) => th.bg("userMessageBg", s));
		const headerText = new Text(
			th.bold(th.fg("accent", "💻 Code Blocks")),
			0, 0
		);
		header.addChild(headerText);
		container.addChild(header);

		// Content box
		const content = new Box(2, 1, (s) => th.bg("customMessageBg", s));
		const codeContainer = new Container();

		// Code block with syntax highlighting
		const codeBox = new Box(2, 1, (s) => th.bg("toolPendingBg", s));
		
		const line1 = new Text(
			th.fg("syntaxKeyword", "function ") +
			th.fg("syntaxFunction", "greet") +
			th.fg("syntaxPunctuation", "(") +
			th.fg("syntaxVariable", "name") +
			th.fg("syntaxPunctuation", ": ") +
			th.fg("syntaxType", "string") +
			th.fg("syntaxPunctuation", ")") +
			th.fg("syntaxPunctuation", " {"),
			0, 0
		);
		
		const line2 = new Text(
			"  " + th.fg("syntaxKeyword", "return ") +
			th.fg("syntaxString", '"Hello, "') +
			th.fg("syntaxOperator", " + ") +
			th.fg("syntaxVariable", "name") +
			th.fg("syntaxPunctuation", ";"),
			0, 0
		);
		
		const line3 = new Text(
			th.fg("syntaxPunctuation", "}"),
			0, 0
		);
		
		const line4 = new Text("", 0, 0);
		
		const line5 = new Text(
			th.fg("syntaxComment", "// Call the function"),
			0, 0
		);
		
		const line6 = new Text(
			th.fg("syntaxKeyword", "const ") +
			th.fg("syntaxVariable", "message") +
			th.fg("syntaxOperator", " = ") +
			th.fg("syntaxFunction", "greet") +
			th.fg("syntaxPunctuation", "(") +
			th.fg("syntaxString", '"World"') +
			th.fg("syntaxPunctuation", ");"),
			0, 0
		);

		codeBox.addChild(line1);
		codeBox.addChild(line2);
		codeBox.addChild(line3);
		codeBox.addChild(line4);
		codeBox.addChild(line5);
		codeBox.addChild(line6);

		codeContainer.addChild(codeBox);

		// Diff view
		const diffBox = new Box(2, 1, (s) => th.bg("toolPendingBg", s));
		
		const diffHeader = new Text(th.fg("dim", "git diff"), 0, 0);
		const diffRemoved = new Text(th.fg("toolDiffRemoved", "- const x = 1;"), 0, 0);
		const diffAdded = new Text(th.fg("toolDiffAdded", "+ const x = 2;"), 0, 0);
		const diffContext = new Text(th.fg("toolDiffContext", "  console.log(x);"), 0, 0);
		
		diffBox.addChild(diffHeader);
		diffBox.addChild(diffRemoved);
		diffBox.addChild(diffAdded);
		diffBox.addChild(diffContext);
		codeContainer.addChild(diffBox);

		content.addChild(codeContainer);
		container.addChild(content);

		return container;
	}

	private createAlertSection(): Container {
		const th = this.theme;
		const container = new Container();

		// Section header
		const header = new Box(1, 1, (s) => th.bg("userMessageBg", s));
		const headerText = new Text(
			th.bold(th.fg("accent", "⚡ Alerts & Status")),
			0, 0
		);
		header.addChild(headerText);
		container.addChild(header);

		// Content box
		const content = new Box(2, 1, (s) => th.bg("customMessageBg", s));
		
		// Use Grid for horizontal arrangement
		const grid = new Grid({ spacing: 2, minColumnWidth: 30 });

		// Success Alert
		const successBox = new Box(2, 1, (s) => th.bg("userMessageBg", s));
		const successIcon = new Text(th.fg("success", "✓"), 0, 0);
		const successText = new Text(
			th.fg("text", "Operation completed"),
			0, 0
		);
		successBox.addChild(successIcon);
		successBox.addChild(successText);
		grid.addChild(successBox);

		// Warning Alert
		const warningBox = new Box(2, 1, (s) => th.bg("userMessageBg", s));
		const warningIcon = new Text(th.fg("warning", "⚠"), 0, 0);
		const warningText = new Text(
			th.fg("text", "Cannot be undone"),
			0, 0
		);
		warningBox.addChild(warningIcon);
		warningBox.addChild(warningText);
		grid.addChild(warningBox);

		// Error Alert
		const errorBox = new Box(2, 1, (s) => th.bg("userMessageBg", s));
		const errorIcon = new Text(th.fg("error", "✗"), 0, 0);
		const errorText = new Text(
			th.fg("text", "Connection failed"),
			0, 0
		);
		errorBox.addChild(errorIcon);
		errorBox.addChild(errorText);
		grid.addChild(errorBox);

		content.addChild(grid);

		// Thinking levels (separate row)
		const thinkingBox = new Box(2, 1, (s) => th.bg("toolPendingBg", s));
		const thinkingTitle = new Text(th.fg("text", "Thinking Intensity:"), 0, 0);
		const thinkingLevels = new Text(
			th.fg("thinkingOff", "● off ") +
			th.fg("thinkingMinimal", "● min ") +
			th.fg("thinkingLow", "● low ") +
			th.fg("thinkingMedium", "● med ") +
			th.fg("thinkingHigh", "● high ") +
			th.fg("thinkingXhigh", "● max"),
			0, 0
		);
		thinkingBox.addChild(thinkingTitle);
		thinkingBox.addChild(thinkingLevels);
		content.addChild(thinkingBox);

		container.addChild(content);

		return container;
	}

	private createFormSection(): Container {
		const th = this.theme;
		const container = new Container();

		// Section header
		const header = new Box(1, 1, (s) => th.bg("userMessageBg", s));
		const headerText = new Text(
			th.bold(th.fg("accent", "📝 Form Elements")),
			0, 0
		);
		header.addChild(headerText);
		container.addChild(header);

		// Content box
		const content = new Box(2, 1, (s) => th.bg("customMessageBg", s));
		const formContainer = new Container();

		// Text Input
		const inputBox = new Box(2, 1, (s) => th.bg("userMessageBg", s));
		const inputLabel = new Text(th.fg("text", "Username"), 0, 0);
		const inputField = new Box(1, 0, (s) => th.bg("toolPendingBg", s));
		const inputText = new Text(
			" " + th.fg("text", "john_doe") + th.fg("dim", "_") + " ",
			0, 0
		);
		inputField.addChild(inputText);
		inputBox.addChild(inputLabel);
		inputBox.addChild(inputField);
		formContainer.addChild(inputBox);

		// Disabled Input
		const disabledBox = new Box(2, 1, (s) => th.bg("userMessageBg", s));
		const disabledLabel = new Text(th.fg("dim", "Email (disabled)"), 0, 0);
		const disabledField = new Box(1, 0, (s) => th.bg("toolPendingBg", s));
		const disabledText = new Text(
			" " + th.fg("dim", "john@example.com") + " ",
			0, 0
		);
		disabledField.addChild(disabledText);
		disabledBox.addChild(disabledLabel);
		disabledBox.addChild(disabledField);
		formContainer.addChild(disabledBox);

		// Checkbox
		const checkboxContainer = new Container();
		const checkbox1 = new Text(
			th.fg("accent", "☑") + " " + th.fg("text", "Remember me"),
			0, 0
		);
		const checkbox2 = new Text(
			th.fg("border", "☐") + " " + th.fg("text", "Subscribe to newsletter"),
			0, 0
		);
		checkboxContainer.addChild(checkbox1);
		checkboxContainer.addChild(checkbox2);
		formContainer.addChild(checkboxContainer);

		// Validation
		const validationBox = new Box(2, 1, (s) => th.bg("userMessageBg", s));
		const validLabel = new Text(th.fg("text", "Password"), 0, 0);
		const validField = new Box(1, 0, (s) => th.bg("toolPendingBg", s));
		const validText = new Text(
			" " + th.fg("text", "••••••••") + " ",
			0, 0
		);
		validField.addChild(validText);
		const validHint = new Text(
			th.fg("success", "✓ ") + th.fg("dim", "Strong password"),
			0, 0
		);
		validationBox.addChild(validLabel);
		validationBox.addChild(validField);
		validationBox.addChild(validHint);
		formContainer.addChild(validationBox);

		content.addChild(formContainer);
		container.addChild(content);

		return container;
	}

	override invalidate(): void {
		super.invalidate();
		for (const section of this.sections) {
			section.invalidate();
		}
	}

	/**
	 * Rebuild all sections with current theme
	 */
	refresh(): void {
		// Clear existing sections
		for (const section of this.sections) {
			this.removeChild(section);
		}
		this.sections = [];

		// Rebuild
		this.buildSections();
		this.invalidate();
	}
}
