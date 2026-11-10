// Workflow recommendations are not active phases. Only inspected, source-bound starts can say “current”.
const NEXT_ACTIONS = ["REVIEW", "FIX", "FINISH", "SUBMIT"];
const ACTIVE_PHASES = { start: "implementing", implementation: "implementing", review: "reviewing", fix: "fixing", finish: "finishing", submit: "submitting" };

export function workflowBadge(state, workflow, executable = true) {
  if (!state?.state) return null;
  const status = state.state.toUpperCase();
  if (executable && status === "ACTIVE" && !workflow?.error && workflow?.inspection?.historyValid && workflow.inspection.ownership === "active") {
    // Canonical loadTicketWorkflow returns validated receipts newest first.
    const receipt = workflow.receipts?.[0], source = workflow.inspection.source;
    if (receipt?.status === "started" && receipt.fields?.event === "phase-start" && source?.state === "available" && source.path === receipt.workspacePath && source.branch === receipt.sourceBranch && ACTIVE_PHASES[receipt.phase]) {
      return { label: "current", value: ACTIVE_PHASES[receipt.phase], tone: "current" };
    }
  }
  if (executable && NEXT_ACTIONS.includes(status)) return { label: "next", value: status.toLowerCase(), tone: "next" };
  return { label: "status", value: state.state.toLowerCase(), tone: ["BLOCKED", "ERROR", "UNKNOWN"].includes(status) ? "blocked" : ["READY", "DONE"].includes(status) ? "complete" : "neutral" };
}

// Native colours accept hex only. Keep hue and saturation fixed while changing lightness.
export function badgePalette(color, background, subdued = false) {
  const [red, green, blue] = hexRgb(color), bg = hexRgb(background);
  const dark = Math.max(...bg) + Math.min(...bg) < 1;
  const high = Math.max(red, green, blue), low = Math.min(red, green, blue), delta = high - low, lightness = (high + low) / 2;
  let hue = 0;
  if (delta) hue = (high === red ? (green - blue) / delta + (green < blue ? 6 : 0) : high === green ? (blue - red) / delta + 2 : (red - green) / delta + 4) / 6;
  const saturation = delta ? delta / (1 - Math.abs(2 * lightness - 1)) : 0;
  const sat = subdued ? Math.min(.18, saturation) : saturation;
  return {
    label: hslHex(hue, sat, dark ? .14 : .94),
    value: hslHex(hue, sat, dark ? .24 : .84),
    border: hslHex(hue, sat, dark ? .34 : .62),
    labelText: hslHex(hue, sat, dark ? .82 : .22),
    valueText: hslHex(hue, sat, dark ? .94 : .12),
  };
}

function hslHex(hue, saturation, lightness) {
  const amplitude = saturation * Math.min(lightness, 1 - lightness);
  return `#${hslChannel(hue, amplitude, lightness, 0)}${hslChannel(hue, amplitude, lightness, 8)}${hslChannel(hue, amplitude, lightness, 4)}`;
}

function hslChannel(hue, amplitude, lightness, offset) {
  const position = (offset + hue * 12) % 12;
  return Math.round(255 * (lightness - amplitude * Math.max(-1, Math.min(position - 3, 9 - position, 1)))).toString(16).padStart(2, "0");
}

function hexRgb(color) {
  let hex = color.slice(1);
  if (hex.length === 3) hex = [...hex].map(character => character + character).join("");
  return [0, 2, 4].map(offset => parseInt(hex.slice(offset, offset + 2), 16) / 255);
}
