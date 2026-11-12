import { theme as appTheme } from "herdr";

// GPUI accepts concrete colours, so resolve DESIGN.md's sRGB mixes once.
const background = "#191521", card = "#241d33", foreground = "#e6e1f2", primary = "#c9a6ff";
const muted = mix(card, foreground, .85), border = mix(foreground, background, .22);
const secondaryText = mix(foreground, background, .70);

export function theme() {
  return {
    ...appTheme(), background, chrome: card, raised: muted, popover: card, input: card,
    foreground, muted: secondaryText, dim: secondaryText, border, accent: primary,
    selected: muted, hover: muted, solid: primary, solid_foreground: background,
    ansi2: "#9ccfd8", ansi5: primary, blocked: "#f58b92"
  };
}

function mix(first, second, weight) {
  return "#" + [1, 3, 5].map(offset => Math.round(parseInt(first.slice(offset, offset + 2), 16) * weight + parseInt(second.slice(offset, offset + 2), 16) * (1 - weight)).toString(16).padStart(2, "0")).join("");
}
