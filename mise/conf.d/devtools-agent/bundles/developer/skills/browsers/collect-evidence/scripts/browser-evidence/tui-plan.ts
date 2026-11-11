import { isAbsolute } from "node:path";
import type { Plan } from "./plan.ts";
import { CliError } from "./sh.ts";

export function checkTuiPlan(plan: Plan): void {
  const t = plan.terminal;
  const approved = plan.approval?.terminal;
  need(plan.approval && (plan.approval.confirmations === undefined || (Array.isArray(plan.approval.confirmations) && plan.approval.confirmations.every(id => typeof id === "string"))), "TUI confirmations must be stable step IDs");
  need(t && Array.isArray(t.command) && t.command.length > 0 && t.command.every(s => typeof s === "string" && !s.includes("\0")) && isAbsolute(t.command[0]!), "TUI requires an absolute executable and argument array");
  need(typeof t.cwd === "string" && isAbsolute(t.cwd), "TUI requires an absolute working directory");
  need(approved && JSON.stringify(approved.command) === JSON.stringify(t.command) && approved.cwd === t.cwd, "Approve the exact terminal command and working directory before collection");
  need(plan.base === "terminal://private" && Array.isArray(plan.approval.origins) && plan.approval.origins.length === 0, "TUI uses terminal://private and no browser origins");
  need(Number.isInteger(t.columns) && t.columns >= 20 && t.columns <= 240 && Number.isInteger(t.rows) && t.rows >= 5 && t.rows <= 100, "Terminal size must be 20–240 columns and 5–100 rows");
  need(t.font === "monospace:size=12" && t.lineHeight === 20, "This CPU playbook requires font monospace:size=12 and lineHeight 20");
  need(!plan.preconditions?.some(p => p.check.goto || p.check.locator !== "screen" || !p.check.text), "TUI preconditions require screen text; navigation is unavailable");
  for (const test of plan.tests) for (const step of test.steps) {
    need(["wait", "expect", "press", "fill", "human"].includes(step.do), "TUI supports wait, expect, press, fill and human steps only");
    if (step.do === "human") continue;
    if (step.do !== "expect" && step.do !== "wait") need(!step.shot, "Capture TUI images only after an explicit visible-screen wait or expect");
    if (step.do === "press" || step.do === "fill") {
      need(typeof step.screen === "string" && step.screen.trim().length > 0, "Every TUI input requires the expected current screen");
      if (step.do === "fill") need(step.locator === "screen" && !/[\r\n\x00-\x1f\x7f]/.test(step.text), "TUI fill requires screen and literal text without control characters");
      else need(/^(RET|TAB|ESC|SPC|DEL|<up>|<down>|<left>|<right>|<home>|<end>|<prior>|<next>|<delete>|<f(?:[1-9]|1[0-2])>|[A-Za-z0-9]|C-[a-z])$/.test(step.key), "Use one supported termscope key, not a key sequence");
    } else {
      need(step.locator === "screen", "TUI locator must be screen");
      if (step.do === "wait") need(!step.gone && typeof step.text === "string" && step.text.trim().length > 0, "TUI waits require expected visible text");
      if (step.do === "expect") {
        need(typeof step.text === "string" && step.text.trim().length > 0 && !step.url && step.visible !== false && !!step.shot, "TUI expect requires visible text and a native capture");
        const image = step.image;
        need(image && Number.isInteger(image.width) && image.width > 0 && Number.isInteger(image.height) && image.height > 0, "TUI expect requires native image dimensions");
        need(Array.isArray(image.pixels) && image.pixels.length > 0 && Array.isArray(image.lines) && image.lines.length >= 2, "TUI expect requires colour probes and at least two text line positions for spacing");
        for (const p of image.pixels) need(p && Number.isInteger(p.x) && p.x >= 0 && p.x < image.width && Number.isInteger(p.y) && p.y >= 0 && p.y < image.height && Array.isArray(p.rgb) && p.rgb.length === 3 && p.rgb.every(c => Number.isInteger(c) && c >= 0 && c <= 255) && tolerance(p.tolerance), "Invalid TUI pixel probe");
        for (const line of image.lines) need(line && typeof line.text === "string" && line.text.trim() && Number.isInteger(line.top) && line.top >= 0 && line.top < image.height && tolerance(line.tolerance), "Invalid TUI line position");
        need(new Set(image.lines.map(line => line.top)).size >= 2, "TUI spacing checks require different line positions");
      }
    }
  }
}

function tolerance(value: unknown): boolean { return value === undefined || (typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 255); }
function need(value: unknown, message: string): asserts value { if (!value) throw new CliError(message, 2); }
