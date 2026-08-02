/* global window, document, Node */

const messageData = JSON.parse(document.getElementById("annotate-last-message-data").textContent || "{}");
const runtimeConfig = JSON.parse(document.getElementById("annotate-last-message-config").textContent || "{}");

if (!Array.isArray(messageData.lines)) messageData.lines = [];


const state = {
	overallComment: "",
	inlineComments: [],

	selection: null,
};

const elements = {
	messageLines: document.getElementById("message-lines"),
	overallComment: document.getElementById("overall-comment"),
	inlineComments: document.getElementById("inline-comments"),

	selectionNoteButton: document.getElementById("selection-note-button"),
	status: document.getElementById("status"),
	submitButton: document.getElementById("submit-button"),
	cancelButton: document.getElementById("cancel-button"),
};

function feedbackCount() {
	let count = state.overallComment.trim().length > 0 ? 1 : 0;
	for (const comment of state.inlineComments) {
		if (comment.body.trim().length > 0) count += 1;
	}

	return count;
}

function setStatus(message, status = "idle") {
	elements.status.textContent = message;
	elements.status.dataset.state = status;
}

function updateSubmitState() {
	const count = feedbackCount();
	elements.submitButton.disabled = count === 0;
	if (count === 0) {
		setStatus("Add feedback to send into the conversation.");
		return;
	}
	const noun = count === 1 ? "item" : "items";
	setStatus(`Ready to submit ${count} feedback ${noun}.`, "ready");
}


function createLineRow(line) {
	const wrapper = document.createElement("div");
	wrapper.className = "message-line";
	wrapper.dataset.lineNumber = String(line.number);

	const row = document.createElement("div");
	row.className = "message-line-row";

	const lineNumber = document.createElement("div");
	lineNumber.className = "line-number";
	lineNumber.dataset.number = String(line.number);
	row.append(lineNumber);

	const lineText = document.createElement("pre");
	lineText.className = "line-text";
	lineText.textContent = line.text.length > 0 ? line.text : " ";
	row.append(lineText);

	wrapper.append(row);
	return wrapper;
}

function renderInlineComments() {
	elements.inlineComments.replaceChildren();
	if (state.inlineComments.length === 0) {
		const empty = document.createElement("p");
		empty.className = "empty-hint";
		empty.textContent = "No selected-text notes yet.";
		elements.inlineComments.append(empty);
		return;
	}

	state.inlineComments.forEach((comment, index) => {
		const card = document.createElement("div");
		card.className = "inline-comment-card";

		const quote = document.createElement("blockquote");
		quote.textContent = comment.selectedText;
		card.append(quote);

		const textarea = document.createElement("textarea");
		textarea.placeholder = "Explain what should change in this selected text.";
		textarea.value = comment.body;
		textarea.addEventListener("input", () => {
			state.inlineComments[index].body = textarea.value;
			updateSubmitState();
		});
		card.append(textarea);
		elements.inlineComments.append(card);
	});
}


function renderMessageLines() {
	elements.messageLines.replaceChildren();
	for (const line of messageData.lines) elements.messageLines.append(createLineRow(line));
}


function lineNumberForNode(node) {
	const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
	const row = element?.closest?.("[data-line-number]");
	return row ? Number(row.dataset.lineNumber) : null;
}

function offsetWithinLine(lineNumber, node, offset) {
	const line = elements.messageLines.querySelector(`[data-line-number="${lineNumber}"] .line-text`);
	if (!line) return 0;
	const range = document.createRange();
	range.selectNodeContents(line);
	range.setEnd(node, offset);
	return range.toString().length;
}

function selectedMessageText(range, startLine, endLine) {
	const startOffset = offsetWithinLine(startLine, range.startContainer, range.startOffset);
	const endOffset = offsetWithinLine(endLine, range.endContainer, range.endOffset);
	if (startLine === endLine) return messageData.lines[startLine - 1].text.slice(startOffset, endOffset);
	const selectedLines = messageData.lines.slice(startLine - 1, endLine).map((line) => line.text);
	selectedLines[0] = selectedLines[0].slice(startOffset);
	selectedLines[selectedLines.length - 1] = selectedLines[selectedLines.length - 1].slice(0, endOffset);
	return selectedLines.join("\n");
}

function updateTextSelection() {
	const selection = window.getSelection();
	if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
		state.selection = null;
		elements.selectionNoteButton.hidden = true;
		return;
	}
	const range = selection.getRangeAt(0);
	if (!elements.messageLines.contains(range.commonAncestorContainer)) {
		state.selection = null;
		elements.selectionNoteButton.hidden = true;
		return;
	}
	const startLine = lineNumberForNode(range.startContainer);
	const endLine = lineNumberForNode(range.endContainer);
	if (startLine == null || endLine == null) {
		state.selection = null;
		elements.selectionNoteButton.hidden = true;
		return;
	}
	const selectedText = selectedMessageText(range, startLine, endLine);
	if (selectedText.trim().length === 0) {
		state.selection = null;
		elements.selectionNoteButton.hidden = true;
		return;
	}

	state.selection = { selectedText, startLine, endLine };
	const rect = range.getBoundingClientRect();
	elements.selectionNoteButton.style.left = `${Math.max(8, Math.min(rect.right + 8, window.innerWidth - 150))}px`;
	elements.selectionNoteButton.style.top = `${Math.max(8, Math.min(rect.bottom + 8, window.innerHeight - 50))}px`;
	elements.selectionNoteButton.hidden = false;
}

function addSelectedTextNote() {
	if (state.selection == null) return;
	state.inlineComments.push({ ...state.selection, body: "" });
	state.selection = null;
	elements.selectionNoteButton.hidden = true;
	window.getSelection()?.removeAllRanges();
	renderInlineComments();
	const textareas = elements.inlineComments.querySelectorAll("textarea");
	textareas[textareas.length - 1]?.focus();
}

function collectPayload() {
	return {
		type: "submit",
		overallComment: state.overallComment,
		inlineComments: state.inlineComments,

	};
}

async function sendPayload(payload) {
	const response = await fetch(runtimeConfig.submitUrl, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(payload),
	});
	if (!response.ok) throw new Error(`Submission failed (${response.status})`);
	document.body.innerHTML = '<main style="padding:2rem;font:16px system-ui;color:#f0f6fc;background:#0d1117">Feedback sent. You may close this tab.</main>';
	window.close();
}

async function submit() {
	if (feedbackCount() === 0) {
		setStatus("Add at least one comment before submitting.", "error");
		return;
	}
	try {
		await sendPayload(collectPayload());
	} catch (error) {
		setStatus(error instanceof Error ? error.message : String(error), "error");
	}
}

async function cancel() {
	try {
		await sendPayload({ type: "cancel" });
	} catch (error) {
		setStatus(error instanceof Error ? error.message : String(error), "error");
	}
}

elements.overallComment.addEventListener("input", () => {
	state.overallComment = elements.overallComment.value;
	updateSubmitState();
});
elements.submitButton.addEventListener("click", submit);
elements.cancelButton.addEventListener("click", cancel);
elements.selectionNoteButton.addEventListener("mousedown", (event) => event.preventDefault());
elements.selectionNoteButton.addEventListener("click", addSelectedTextNote);
elements.messageLines.addEventListener("mouseup", updateTextSelection);
elements.messageLines.addEventListener("keyup", updateTextSelection);

document.addEventListener("keydown", (event) => {
	if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
		event.preventDefault();
		submit();
		return;
	}
	if (event.key === "Escape") {
		event.preventDefault();
		cancel();
	}
});

renderMessageLines();
renderInlineComments();

updateSubmitState();
