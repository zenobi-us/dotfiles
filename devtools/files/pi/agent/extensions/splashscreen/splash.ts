import { execSync } from "node:child_process";
import { visibleWidth } from "@mariozechner/pi-tui";
import type { Component } from "@mariozechner/pi-tui";

const CMD = "mise x -- pokemon-go-colorscripts --name glalie --no-title";

export class SplashScreen implements Component {
  private readonly lines: string[];

  constructor() {
    this.lines = this.loadPokemonLines();
  }

  private loadPokemonLines(): string[] {
    try {
      const output = execSync(CMD, {
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "pipe"],
      });

      const trimmed = output.replace(/\s+$/g, "");
      if (!trimmed) return ["(pokemon command returned no output)"];
      return trimmed.split("\n");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return [`Failed to run pokemon command: ${message}`];
    }
  }

  invalidate(): void { }

  render(width: number): string[] {
    return this.lines.map((line) => {
      const pad = Math.max(0, Math.floor((width - visibleWidth(line)) / 2));
      return `${" ".repeat(pad)}${line}`;
    });
  }
}
