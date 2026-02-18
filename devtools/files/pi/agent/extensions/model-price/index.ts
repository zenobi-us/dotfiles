/**
 * Model Price Extension
 *
 * Displays model pricing information in an interactive overlay.
 *
 * Features:
 * - Filter models by typing
 * - Sort by name, provider, input cost, output cost (Ctrl+S)
 * - Group by provider (Ctrl+G)
 * - Detail panel for selected model
 *
 * Commands:
 * - /model-price - Show model price overlay
 *
 * Usage: pi --extension ./model-price.ts
 */

import type {
	ExtensionAPI,
	ExtensionCommandContext,
	ExtensionUIContext,
	Theme,
} from "@mariozechner/pi-coding-agent";
import { matchesKey, visibleWidth, type Component, type TUI } from "@mariozechner/pi-tui";
import type { Api, Model } from "@mariozechner/pi-ai";
import type { ModelRegistry } from "@mariozechner/pi-coding-agent";

// ============================================================================
// Types
// ============================================================================

interface ModelPriceData {
	provider: string;
	id: string;
	name: string;
	reasoning: boolean;
	contextWindow: number;
	maxTokens?: number;
	cost: {
		input: number;
		output: number;
		cacheRead: number;
		cacheWrite: number;
	};
	input: ("text" | "image")[];
}

type SortField = "name" | "provider" | "read" | "write";
type GroupField = "provider" | "none";

interface OverlayState {
	models: ModelPriceData[];
	filtered: ModelPriceData[];
	grouped: Map<string, ModelPriceData[]>;
	cursor: number;
	scrollOffset: number;
	filterQuery: string;
	sortField: SortField;
	sortAscending: boolean;
	groupField: GroupField;
}

// ============================================================================
// Render Helpers
// ============================================================================

function pad(s: string, len: number): string {
	const vis = visibleWidth(s);
	return s + " ".repeat(Math.max(0, len - vis));
}

function padLeft(s: string, len: number): string {
	const vis = visibleWidth(s);
	return " ".repeat(Math.max(0, len - vis)) + s;
}

function row(content: string, width: number, theme: Theme): string {
	const innerW = width - 2;
	return theme.fg("border", "│") + pad(content, innerW) + theme.fg("border", "│");
}

function renderHeader(text: string, width: number, theme: Theme): string {
	const innerW = width - 2;
	const padLen = Math.max(0, innerW - visibleWidth(text));
	const padLeft = Math.floor(padLen / 2);
	const padRight = padLen - padLeft;
	return (
		theme.fg("border", "╭" + "─".repeat(padLeft)) +
		theme.fg("accent", text) +
		theme.fg("border", "─".repeat(padRight) + "╮")
	);
}

function renderFooter(text: string, width: number, theme: Theme): string {
	const innerW = width - 2;
	const padLen = Math.max(0, innerW - visibleWidth(text));
	const padL = Math.floor(padLen / 2);
	const padR = padLen - padL;
	return (
		theme.fg("border", "╰" + "─".repeat(padL)) +
		theme.fg("dim", text) +
		theme.fg("border", "─".repeat(padR) + "╯")
	);
}

function renderDivider(text: string, width: number, theme: Theme): string {
	const innerW = width - 2;
	const padLen = Math.max(0, innerW - visibleWidth(text));
	const padL = Math.floor(padLen / 2);
	const padR = padLen - padL;
	return (
		theme.fg("border", "├" + "─".repeat(padL)) +
		theme.fg("muted", text) +
		theme.fg("border", "─".repeat(padR) + "┤")
	);
}

function formatCost(cost: number): string {
	if (cost === 0) return "FREE";
	if (cost < 0.001) return `$${cost.toFixed(6)}`;
	if (cost < 0.01) return `$${cost.toFixed(5)}`;
	if (cost < 0.1) return `$${cost.toFixed(4)}`;
	return `$${cost.toFixed(3)}`;
}

function formatCostPerToken(cost: number): string {
	if (cost === 0) return "FREE";
	// Per-token costs are very small, use scientific notation or many decimals
	if (cost < 0.0000001) return `$${cost.toExponential(2)}`;
	if (cost < 0.000001) return `$${cost.toFixed(10)}`;
	if (cost < 0.00001) return `$${cost.toFixed(9)}`;
	if (cost < 0.0001) return `$${cost.toFixed(8)}`;
	if (cost < 0.001) return `$${cost.toFixed(7)}`;
	return `$${cost.toFixed(6)}`;
}

function formatContextWindow(ctx: number): string {
	if (ctx >= 1_000_000) return `${(ctx / 1_000_000).toFixed(1)}M`;
	if (ctx >= 1_000) return `${Math.floor(ctx / 1_000)}K`;
	return `${ctx}`;
}

function fuzzyMatch(query: string, text: string): boolean {
	const lq = query.toLowerCase();
	const lt = text.toLowerCase();
	if (lt.includes(lq)) return true;
	let qi = 0;
	for (let i = 0; i < lt.length && qi < lq.length; i++) {
		if (lt[i] === lq[qi]) qi++;
	}
	return qi === lq.length;
}

// ============================================================================
// ModelPriceHelp Component
// ============================================================================

class ModelPriceHelp {
	render(width: number, theme: Theme): string[] {
		const lines: string[] = [];
		const shortcuts = [
			["Ctrl+S", "Sort"],
			["Ctrl+G", "Group"],
			["↑/↓", "Navigate"],
			["Esc", "Close"],
		];
		const shortcutText = shortcuts
			.map(([key, desc]) => `${theme.fg("accent", key)} ${theme.fg("dim", desc)}`)
			.join("  ");
		lines.push(row(" " + shortcutText, width, theme));
		return lines;
	}
}

function createModelPriceHelp(): ModelPriceHelp {
	return new ModelPriceHelp();
}

// ============================================================================
// ModelPriceListItem Component
// ============================================================================

interface ModelPriceListItemData {
	model: ModelPriceData;
	isSelected: boolean;
	width: number;
}

class ModelPriceListItem {
	private data: ModelPriceListItemData;

	constructor(data: ModelPriceListItemData) {
		this.data = data;
	}

	render(theme: Theme): string {
		const { model, isSelected, width } = this.data;
		const innerW = width - 4; // Account for borders and padding

		const cursor = isSelected ? theme.fg("accent", "▸ ") : "  ";
		const name = isSelected ? theme.fg("accent", model.name || model.id) : (model.name || model.id);
		const costIn = formatCost(model.cost.input);
		const costOut = formatCost(model.cost.output);

		// Layout: cursor + name ... costs
		const costStr = `${theme.fg("dim", "R:")}${padLeft(costIn, 10)} ${theme.fg("dim", "W:")}${padLeft(costOut, 10)}`;
		const costLen = 28; // Approximate visible length
		const nameMaxLen = innerW - costLen - 4;
		const displayName = (model.name || model.id).length > nameMaxLen
			? (model.name || model.id).slice(0, nameMaxLen - 1) + "…"
			: model.name || model.id;

		const nameColored = isSelected ? theme.fg("accent", displayName) : displayName;
		const spacing = " ".repeat(Math.max(1, innerW - visibleWidth(cursor + displayName) - costLen));

		return cursor + nameColored + spacing + costStr;
	}
}

function createModelPriceListItem(data: ModelPriceListItemData): ModelPriceListItem {
	return new ModelPriceListItem(data);
}

// ============================================================================
// ModelPriceList Component
// ============================================================================

const VIEWPORT_HEIGHT = 12;

interface ModelPriceListData {
	models: ModelPriceData[];
	grouped: Map<string, ModelPriceData[]>;
	groupField: GroupField;
	cursor: number;
	scrollOffset: number;
}

class ModelPriceList {
	private data: ModelPriceListData;
	private itemRenderer: (data: ModelPriceListItemData) => ModelPriceListItem;

	constructor(
		data: ModelPriceListData,
		itemRenderer: (data: ModelPriceListItemData) => ModelPriceListItem
	) {
		this.data = data;
		this.itemRenderer = itemRenderer;
	}

	render(width: number, theme: Theme): string[] {
		const lines: string[] = [];
		const { models, grouped, groupField, cursor, scrollOffset } = this.data;

		if (models.length === 0) {
			lines.push(row("", width, theme));
			lines.push(row(" " + theme.fg("warning", "No models found"), width, theme));
			lines.push(row("", width, theme));
			return lines;
		}

		if (groupField === "none") {
			// Flat list
			const startIdx = scrollOffset;
			const endIdx = Math.min(models.length, startIdx + VIEWPORT_HEIGHT);
			const visible = models.slice(startIdx, endIdx);

			for (let i = 0; i < visible.length; i++) {
				const model = visible[i];
				const isSelected = startIdx + i === cursor;
				const item = this.itemRenderer({ model, isSelected, width });
				lines.push(row(" " + item.render(theme), width, theme));
			}

			// Pad remaining viewport
			for (let i = visible.length; i < VIEWPORT_HEIGHT; i++) {
				lines.push(row("", width, theme));
			}
		} else {
			// Grouped list
			let lineCount = 0;
			let modelIndex = 0;
			let skipped = 0;
			const maxLines = VIEWPORT_HEIGHT;

			for (const [group, groupModels] of Array.from(grouped)) {
				// Skip if we haven't reached scroll offset yet
				if (skipped < scrollOffset) {
					for (const model of groupModels) {
						if (skipped < scrollOffset) {
							skipped++;
							modelIndex++;
							continue;
						}
						break;
					}
					if (skipped < scrollOffset) continue;
				}

				if (lineCount >= maxLines) break;

				// Group header
				if (lineCount < maxLines) {
					lines.push(renderDivider(` ${group} `, width, theme));
					lineCount++;
				}

				for (const model of groupModels) {
					if (modelIndex < scrollOffset) {
						modelIndex++;
						continue;
					}
					if (lineCount >= maxLines) break;

					const isSelected = modelIndex === cursor;
					const item = this.itemRenderer({ model, isSelected, width });
					lines.push(row(" " + item.render(theme), width, theme));
					lineCount++;
					modelIndex++;
				}
			}

			// Pad remaining viewport
			while (lineCount < maxLines) {
				lines.push(row("", width, theme));
				lineCount++;
			}
		}

		// Scroll indicator
		const totalCount = models.length;
		const above = scrollOffset;
		const below = Math.max(0, totalCount - scrollOffset - VIEWPORT_HEIGHT);
		let scrollInfo = "";
		if (above > 0) scrollInfo += `↑ ${above} more`;
		if (below > 0) scrollInfo += `${scrollInfo ? "  " : ""}↓ ${below} more`;
		if (scrollInfo) {
			lines.push(row(" " + theme.fg("dim", scrollInfo), width, theme));
		} else {
			lines.push(row("", width, theme));
		}

		return lines;
	}
}

function createModelPriceList(
	data: ModelPriceListData,
	itemRenderer: (data: ModelPriceListItemData) => ModelPriceListItem
): ModelPriceList {
	return new ModelPriceList(data, itemRenderer);
}

// ============================================================================
// ModelPriceOverlayDetail Component
// ============================================================================

interface ModelPriceDetailData {
	model: ModelPriceData | null;
}

class ModelPriceOverlayDetail {
	private data: ModelPriceDetailData;

	constructor(data: ModelPriceDetailData) {
		this.data = data;
	}

	render(width: number, theme: Theme): string[] {
		const { model } = this.data;
		if (!model) return [];

		const lines: string[] = [];
		const innerW = width - 4;

		lines.push(renderDivider(" Detail ", width, theme));
		lines.push(row("", width, theme));

		// Model name as title
		const title = `  ${theme.fg("accent", model.name || model.id)}`;
		lines.push(row(title, width, theme));

		// Provider
		const providerLine = `  ${theme.fg("dim", "Provider:")} ${model.provider}`;
		lines.push(row(providerLine, width, theme));

		lines.push(row("", width, theme));

		// Capabilities
		const caps: string[] = [];
		if (model.reasoning) caps.push("reasoning");
		if (model.input.includes("image")) caps.push("vision");
		if (model.input.includes("text")) caps.push("text");
		const capsStr = caps.length > 0 ? caps.join(", ") : "text";
		lines.push(row(`  ${theme.fg("dim", "Capabilities:")} ${capsStr}`, width, theme));

		// Context window
		lines.push(row(`  ${theme.fg("dim", "Context:")} ${formatContextWindow(model.contextWindow)} tokens`, width, theme));

		lines.push(row("", width, theme));

		// Cost breakdown - show both per 1M tokens and per token
		lines.push(row(`  ${theme.fg("dim", "Pricing:")}`, width, theme));
		lines.push(row("", width, theme));

		// Per 1M tokens
		lines.push(row(`  ${theme.fg("muted", "Per 1M tokens:")}`, width, theme));
		const inputCost = `    Input:       ${formatCost(model.cost.input)}`;
		const outputCost = `    Output:      ${formatCost(model.cost.output)}`;
		lines.push(row(inputCost, width, theme));
		lines.push(row(outputCost, width, theme));

		if (model.cost.cacheRead > 0 || model.cost.cacheWrite > 0) {
			const cacheRead = `    Cache Read:  ${formatCost(model.cost.cacheRead)}`;
			const cacheWrite = `    Cache Write: ${formatCost(model.cost.cacheWrite)}`;
			lines.push(row(cacheRead, width, theme));
			lines.push(row(cacheWrite, width, theme));
		}

		lines.push(row("", width, theme));

		// Per token (divide by 1M)
		lines.push(row(`  ${theme.fg("muted", "Per token:")}`, width, theme));
		const inputPerToken = `    Input:       ${formatCostPerToken(model.cost.input / 1_000_000)}`;
		const outputPerToken = `    Output:      ${formatCostPerToken(model.cost.output / 1_000_000)}`;
		lines.push(row(inputPerToken, width, theme));
		lines.push(row(outputPerToken, width, theme));

		if (model.cost.cacheRead > 0 || model.cost.cacheWrite > 0) {
			const cacheReadPerToken = `    Cache Read:  ${formatCostPerToken(model.cost.cacheRead / 1_000_000)}`;
			const cacheWritePerToken = `    Cache Write: ${formatCostPerToken(model.cost.cacheWrite / 1_000_000)}`;
			lines.push(row(cacheReadPerToken, width, theme));
			lines.push(row(cacheWritePerToken, width, theme));
		}

		lines.push(row("", width, theme));

		return lines;
	}
}

function createModelPriceOverlayDetail(data: ModelPriceDetailData): ModelPriceOverlayDetail {
	return new ModelPriceOverlayDetail(data);
}

// ============================================================================
// ModelPriceOverlay Component
// ============================================================================

interface OverlaySlots {
	header: () => string[];
	detail: () => string[];
	inputFilter: () => string[];
	list: () => string[];
	footer: () => string[];
}

class ModelPriceOverlay implements Component {
	private state: OverlayState;
	private theme: Theme;
	private done: (result: null) => void;
	private width = 90;

	// Sub-components
	private help: ModelPriceHelp;
	private detail: ModelPriceOverlayDetail;
	private list: ModelPriceList;

	constructor(
		models: ModelPriceData[],
		theme: Theme,
		done: (result: null) => void
	) {
		this.theme = theme;
		this.done = done;

		// Sort by provider then name by default
		const sorted = [...models].sort((a, b) => {
			const provComp = a.provider.localeCompare(b.provider);
			if (provComp !== 0) return provComp;
			return (a.name || a.id).localeCompare(b.name || b.id);
		});

		this.state = {
			models: sorted,
			filtered: sorted,
			grouped: this.groupModels(sorted, "provider"),
			cursor: 0,
			scrollOffset: 0,
			filterQuery: "",
			sortField: "provider",
			sortAscending: true,
			groupField: "provider",
		};

		this.help = createModelPriceHelp();
		this.detail = createModelPriceOverlayDetail({ model: sorted[0] || null });
		this.list = createModelPriceList(
			{
				models: this.state.filtered,
				grouped: this.state.grouped,
				groupField: this.state.groupField,
				cursor: this.state.cursor,
				scrollOffset: this.state.scrollOffset,
			},
			createModelPriceListItem
		);
	}

	private groupModels(models: ModelPriceData[], field: GroupField): Map<string, ModelPriceData[]> {
		const groups = new Map<string, ModelPriceData[]>();
		if (field === "none") {
			groups.set("All Models", models);
			return groups;
		}

		for (const model of models) {
			const key = model[field] || "Unknown";
			const group = groups.get(key) || [];
			group.push(model);
			groups.set(key, group);
		}
		return groups;
	}

	private sortModels(models: ModelPriceData[]): ModelPriceData[] {
		const { sortField, sortAscending } = this.state;
		const sorted = [...models].sort((a, b) => {
			let cmp = 0;
			switch (sortField) {
				case "name":
					cmp = (a.name || a.id).localeCompare(b.name || b.id);
					break;
				case "provider":
					cmp = a.provider.localeCompare(b.provider);
					if (cmp === 0) cmp = (a.name || a.id).localeCompare(b.name || b.id);
					break;
				case "read":
					cmp = a.cost.input - b.cost.input;
					break;
				case "write":
					cmp = a.cost.output - b.cost.output;
					break;
			}
			return sortAscending ? cmp : -cmp;
		});
		return sorted;
	}

	private filterModels(models: ModelPriceData[], query: string): ModelPriceData[] {
		if (!query.trim()) return models;
		return models.filter(
			(m) =>
				fuzzyMatch(query, m.name || "") ||
				fuzzyMatch(query, m.id) ||
				fuzzyMatch(query, m.provider)
		);
	}

	private updateFiltered(): void {
		let filtered = this.filterModels(this.state.models, this.state.filterQuery);
		filtered = this.sortModels(filtered);
		this.state.filtered = filtered;
		this.state.grouped = this.groupModels(filtered, this.state.groupField);
		this.clampCursor();
	}

	private clampCursor(): void {
		const { filtered } = this.state;
		if (filtered.length === 0) {
			this.state.cursor = 0;
			this.state.scrollOffset = 0;
			return;
		}

		this.state.cursor = Math.max(0, Math.min(this.state.cursor, filtered.length - 1));
		const maxOffset = Math.max(0, filtered.length - VIEWPORT_HEIGHT);
		this.state.scrollOffset = Math.max(0, Math.min(this.state.scrollOffset, maxOffset));

		if (this.state.cursor < this.state.scrollOffset) {
			this.state.scrollOffset = this.state.cursor;
		} else if (this.state.cursor >= this.state.scrollOffset + VIEWPORT_HEIGHT) {
			this.state.scrollOffset = this.state.cursor - VIEWPORT_HEIGHT + 1;
		}
	}

	private rotateSort(): void {
		const fields: SortField[] = ["name", "provider", "read", "write"];
		const currentIdx = fields.indexOf(this.state.sortField);
		const nextIdx = (currentIdx + 1) % fields.length;
		this.state.sortField = fields[nextIdx];
		this.updateFiltered();
	}

	private rotateGroup(): void {
		const fields: GroupField[] = ["provider", "none"];
		const currentIdx = fields.indexOf(this.state.groupField);
		const nextIdx = (currentIdx + 1) % fields.length;
		this.state.groupField = fields[nextIdx];
		this.updateFiltered();
	}

	handleInput(data: string): void {
		// Close handlers
		if (matchesKey(data, "escape") || matchesKey(data, "ctrl+c")) {
			if (this.state.filterQuery.length > 0) {
				// Clear filter first
				this.state.filterQuery = "";
				this.updateFiltered();
				return;
			}
			this.done(null);
			return;
		}

		// Sort: Ctrl+S
		if (matchesKey(data, "ctrl+s")) {
			this.rotateSort();
			return;
		}

		// Group: Ctrl+G
		if (matchesKey(data, "ctrl+g")) {
			this.rotateGroup();
			return;
		}

		// Navigation
		if (matchesKey(data, "up")) {
			this.state.cursor--;
			this.clampCursor();
			return;
		}

		if (matchesKey(data, "down")) {
			this.state.cursor++;
			this.clampCursor();
			return;
		}

		if (matchesKey(data, "pageUp")) {
			this.state.cursor -= VIEWPORT_HEIGHT;
			this.clampCursor();
			return;
		}

		if (matchesKey(data, "pageDown")) {
			this.state.cursor += VIEWPORT_HEIGHT;
			this.clampCursor();
			return;
		}

		// Backspace for filter
		if (matchesKey(data, "backspace")) {
			if (this.state.filterQuery.length > 0) {
				this.state.filterQuery = this.state.filterQuery.slice(0, -1);
				this.updateFiltered();
			}
			return;
		}

		// Character input for filter
		if (data.length === 1 && data.charCodeAt(0) >= 32) {
			this.state.filterQuery += data;
			this.updateFiltered();
			return;
		}
	}

	render(width: number): string[] {
		this.width = Math.min(width - 4, 90);
		const th = this.theme;
		const lines: string[] = [];

		// Header
		const countInfo = `${this.state.filtered.length}/${this.state.models.length}`;
		lines.push(renderHeader(` 💰 Model Prices [${countInfo}] `, this.width, th));
		lines.push(row("", this.width, th));

		// Filter input
		const filterLabel = th.fg("dim", "Filter: ");
		const cursor = th.fg("accent", "│");
		const queryDisplay = this.state.filterQuery
			? `${this.state.filterQuery}${cursor}`
			: th.fg("dim", "Type to filter...") + cursor;
		lines.push(row(" " + filterLabel + queryDisplay, this.width, th));

		// Sort/Group status
		const sortLabel = th.fg("dim", `Sort: ${this.state.sortField}`);
		const groupLabel = th.fg("dim", `Group: ${this.state.groupField}`);
		lines.push(row(` ${sortLabel}  ${groupLabel}`, this.width, th));
		lines.push(row("", this.width, th));

		// List
		this.list = createModelPriceList(
			{
				models: this.state.filtered,
				grouped: this.state.grouped,
				groupField: this.state.groupField,
				cursor: this.state.cursor,
				scrollOffset: this.state.scrollOffset,
			},
			createModelPriceListItem
		);
		lines.push(...this.list.render(this.width, th));

		// Detail panel (if model selected)
		const selectedModel = this.state.filtered[this.state.cursor] || null;
		if (selectedModel) {
			this.detail = createModelPriceOverlayDetail({ model: selectedModel });
			lines.push(...this.detail.render(this.width, th));
		}

		// Help shortcuts
		lines.push(...this.help.render(this.width, th));

		// Footer
		lines.push(renderFooter(" [Esc] close ", this.width, th));

		return lines;
	}

	invalidate(): void {}
	dispose(): void {}
}

function createModelPriceOverlay(
	models: ModelPriceData[],
	theme: Theme,
	done: (result: null) => void
): ModelPriceOverlay {
	return new ModelPriceOverlay(models, theme, done);
}

// ============================================================================
// Data Extraction
// ============================================================================

function extractModelData(modelRegistry: ModelRegistry): ModelPriceData[] {
	const models = modelRegistry.getAll();
	return models.map((m: Model<Api>) => ({
		provider: m.provider,
		id: m.id,
		name: m.name || m.id,
		reasoning: m.reasoning ?? false,
		contextWindow: m.contextWindow ?? 0,
		maxTokens: m.maxTokens,
		cost: {
			input: m.cost?.input ?? 0,
			output: m.cost?.output ?? 0,
			cacheRead: m.cost?.cacheRead ?? 0,
			cacheWrite: m.cost?.cacheWrite ?? 0,
		},
		input: m.input ?? ["text"],
	}));
}

// ============================================================================
// Extension Export
// ============================================================================

export default function modelPriceExtension(pi: ExtensionAPI) {
	pi.registerCommand("model-price", {
		description: "Show model pricing information",
		handler: async (args, ctx) => {
			const models = extractModelData(ctx.modelRegistry);

			if (models.length === 0) {
				ctx.ui.notify("No models available", "warning");
				return;
			}

			await ctx.ui.custom<null>(
				(tui, theme, _kb, done) => {
					const component = createModelPriceOverlay(models, theme, done);
					return {
						render: (w: number) => component.render(w),
						handleInput: (data: string) => {
							component.handleInput(data);
							tui.requestRender();
						},
						invalidate: () => component.invalidate(),
						dispose: () => component.dispose(),
					};
				},
				{
					overlay: true,
					overlayOptions: {
						anchor: "center",
						width: 90,
						maxHeight: "90%",
					},
				}
			);
		},
	});

	// Register keyboard shortcut for quick access
	pi.registerShortcut("ctrl+shift+p", {
		description: "Open model price viewer",
		handler: async (ctx) => {
			const models = extractModelData(ctx.modelRegistry);

			if (models.length === 0) {
				ctx.ui.notify("No models available", "warning");
				return;
			}

			await ctx.ui.custom<null>(
				(tui, theme, _kb, done) => {
					const component = createModelPriceOverlay(models, theme, done);
					return {
						render: (w: number) => component.render(w),
						handleInput: (data: string) => {
							component.handleInput(data);
							tui.requestRender();
						},
						invalidate: () => component.invalidate(),
						dispose: () => component.dispose(),
					};
				},
				{
					overlay: true,
					overlayOptions: {
						anchor: "center",
						width: 90,
						maxHeight: "90%",
					},
				}
			);
		},
	});
}
