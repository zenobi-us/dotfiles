import type { OverlaySize } from "./types.js";

export const PACKAGE_ID = "@vanillagreen/pi-skills-manager";
export const INSTALL_SYMBOL = Symbol.for("vstack.pi-skills-manager.installed");
export const STARTUP_PATCH_SYMBOL = Symbol.for("vstack.pi-skills-manager.startup-patch");
export const STARTUP_HIDE_ENABLED_SYMBOL = Symbol.for("vstack.pi-skills-manager.hide-startup-skills");
export const VSTACK_MODAL_LOCK_SYMBOL = Symbol.for("vstack.pi.modal-lock");

export const DEFAULT_POPUP_WIDTH: OverlaySize = "82%";
export const DEFAULT_POPUP_MAX_HEIGHT: OverlaySize = "86%";
export const DEFAULT_LIST_ROWS = 14;

const ANSI_GREEN_FG = "\x1b[32m";
const ANSI_YELLOW_FG = "\x1b[33m";
const ANSI_FG_RESET = "\x1b[39m";

export function ansiGreen(text: string): string { return `${ANSI_GREEN_FG}${text}${ANSI_FG_RESET}`; }
export function ansiYellow(text: string): string { return `${ANSI_YELLOW_FG}${text}${ANSI_FG_RESET}`; }

export const GENERATE_SKILL_SYSTEM_PROMPT = `You create production-ready Pi Agent skills.

Return only a complete SKILL.md file. Do not wrap it in fences. Do not add commentary.

Rules:
- Start with YAML frontmatter containing name and description.
- The frontmatter name must exactly match the provided skill_slug.
- The description is the trigger surface: state what the skill does and when Pi should use it.
- Include allowed-tools only if provided, as one space-delimited string.
- Keep the body concise, operational, and reusable.
- Prefer workflows, decision rules, output expectations, constraints, edge cases, and final checks.
- Do not add placeholders, TODOs, fake files, or ungrounded scripts/references.
- Use relative paths only if the user explicitly grounded extra files.
- Do not mention skill-authoring infrastructure, package managers, or this generation process.`;
