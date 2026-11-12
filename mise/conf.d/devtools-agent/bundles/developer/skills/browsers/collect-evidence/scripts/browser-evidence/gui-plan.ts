// GUI collection is read-only: no focus changes, input injection or application launch.
import type { Plan } from "./plan.ts";
import { CliError } from "./sh.ts";

export function checkGuiPlan(plan: Plan): void {
  const g = plan.gui;
  need(g && typeof g.display === "string" && /^:[0-9]+(?:\.[0-9]+)?$/.test(g.display), "GUI requires an explicit local X11 display");
  need(typeof g.window === "string" && /^(?:root|0x[0-9a-fA-F]+)$/.test(g.window), "GUI requires root or an exact hexadecimal X11 window ID");
  need(typeof g.title === "string" && g.title.trim().length > 0, "GUI requires the exact window title (or display label for root)");
  need(plan.approval?.gui && ["display", "window", "title"].every(key => plan.approval.gui![key as keyof typeof g] === g[key as keyof typeof g]), "Approve the exact GUI display, window and title before capture");
  need(plan.base === "gui://local" && Array.isArray(plan.approval.origins) && plan.approval.origins.length === 0, "GUI uses gui://local and no browser origins");
  need(!plan.preconditions?.length, "GUI uses explicit image expectations, not browser preconditions");
  for (const test of plan.tests) for (const step of test.steps) {
    need(step.do === "expect" || step.do === "human", "SAFETY STOP: GUI input and confirmations are unsupported; use read-only expect or human steps");
    if (step.do === "human") continue;
    need(step.locator === "screen" && step.visible === true && !step.text && !step.url && !!step.shot, "GUI expect requires visible screen and a native image capture");
    const image = step.image;
    need(image && Number.isInteger(image.width) && image.width > 0 && Number.isInteger(image.height) && image.height > 0, "GUI expect requires native dimensions");
    need(Array.isArray(image.pixels) && image.pixels.length > 0 && Array.isArray(image.lines) && image.lines.length === 0, "GUI expect requires RGB pixel probes; OCR line assertions are unsupported");
    for (const p of image.pixels) need(p && Number.isInteger(p.x) && p.x >= 0 && p.x < image.width && Number.isInteger(p.y) && p.y >= 0 && p.y < image.height && Array.isArray(p.rgb) && p.rgb.length === 3 && p.rgb.every(c => Number.isInteger(c) && c >= 0 && c <= 255) && (p.tolerance === undefined || (Number.isFinite(p.tolerance) && p.tolerance >= 0 && p.tolerance <= 255)), "Invalid GUI pixel probe");
  }
}
function need(value: unknown, message: string): asserts value { if (!value) throw new CliError(message, 2); }
