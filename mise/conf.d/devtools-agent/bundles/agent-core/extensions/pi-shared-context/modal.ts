import path from "node:path";
import type { Theme } from "@earendil-works/pi-coding-agent";
import { matchesKey, stripTerminalSequences, truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";
import type { SharedAgentContext } from "./model";
import { safeTerminalText } from "./terminal-text";

type Tab = "tracker" | "files";
interface TabContent {
  render(width: number): string[];
  handleInput(data: string): void | Promise<void>;
}

export class SharedContextModal {
  private active: Tab;
  private highlighted?: Tab;

  constructor(
    private context: SharedAgentContext,
    private theme: Theme,
    private tracker: TabContent,
    private files: TabContent,
    private requestRender: () => void,
    initialTab: Tab = "tracker",
  ) {
    this.active = initialTab;
  }

  showFiles(): void {
    this.active = "files";
    this.highlighted = undefined;
    this.requestRender();
  }

  async handleInput(data: string): Promise<void> {
    if (matchesKey(data, "1") || matchesKey(data, "2")) {
      this.active = matchesKey(data, "1") ? "tracker" : "files";
      this.highlighted = undefined;
    } else if (matchesKey(data, "tab")) {
      this.highlighted = this.highlighted === undefined ? "tracker" : this.highlighted === "tracker" ? "files" : undefined;
    } else if (this.highlighted !== undefined && (matchesKey(data, "enter") || data === " ")) {
      this.active = this.highlighted;
      this.highlighted = undefined;
    } else if (this.highlighted !== undefined && matchesKey(data, "escape")) {
      this.highlighted = undefined;
    } else if (this.highlighted === undefined || matchesKey(data, "ctrl+c")) {
      await (this.active === "tracker" ? this.tracker : this.files).handleInput(matchesKey(data, "shift+tab") ? "\t" : data);
    }
    this.requestRender();
  }

  render(width: number): string[] {
    const inner = Math.max(1, width - 2);
    const row = (value: string) => {
      const clipped = truncateToWidth(value, inner, "…");
      return this.theme.fg("border", "│") + clipped + " ".repeat(Math.max(0, inner - visibleWidth(clipped))) + this.theme.fg("border", "│");
    };
    const title = safeTerminalText(`${path.basename(this.context.repositoryRoot)} · Shared mode: ${this.context.mode}`);
    const tabs = (["tracker", "files"] as const).map((tab, index) => {
      const label = `${index + 1} ${tab === "tracker" ? "Tracker" : "Files"}`;
      const labelWithState = tab === this.active ? `[${label}]` : ` ${label} `;
      return this.theme.fg(tab === this.active || tab === this.highlighted ? "accent" : "muted", this.highlighted === tab ? `>${labelWithState}<` : ` ${labelWithState} `);
    }).join("  ");
    const content = (this.active === "tracker" ? this.tracker : this.files).render(width);
    if (content[0] && stripTerminalSequences(content[0]).startsWith("╭")) {
      content[0] = this.theme.fg("border", `├${"─".repeat(inner)}┤`);
    }
    return [
      this.theme.fg("border", `╭${"─".repeat(inner)}╮`),
      row(this.theme.fg("accent", ` ${title}`)),
      row(` ${tabs}  ${this.theme.fg("muted", "Tab focus · Space/Enter activate")}`),
      ...content,
    ].map(line => truncateToWidth(line, width));
  }
}
