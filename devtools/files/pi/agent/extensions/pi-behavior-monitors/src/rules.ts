import * as fs from "node:fs";
import type { Monitor } from "./types";

export function loadInstructions(monitor) {
  try {
    const raw = fs.readFileSync(monitor.resolvedInstructionsPath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveInstructions(monitor, instructions) {
  const tmpPath = `${monitor.resolvedInstructionsPath}.${process.pid}.tmp`;
  try {
    fs.writeFileSync(tmpPath, JSON.stringify(instructions, null, 2) + "\n");
    fs.renameSync(tmpPath, monitor.resolvedInstructionsPath);
    return null;
  } catch (err) {
    try {
      fs.unlinkSync(tmpPath);
    } catch {
      /* cleanup */
    }
    return err instanceof Error ? err.message : String(err);
  }
}

export function formatInstructionsForPrompt(instructions) {
  if (instructions.length === 0) return "";
  const lines = instructions.map((i) => `- ${i.text}`).join("\n");
  return `\nOperating instructions from the user (follow these strictly):\n${lines}\n`;
}
