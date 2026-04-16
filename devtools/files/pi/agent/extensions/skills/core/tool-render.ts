import { keyText } from "@mariozechner/pi-coding-agent";
import { Text } from "@mariozechner/pi-tui";

type ToolResult = {
  content?: Array<{ type?: string; text?: string }>;
  details?: unknown;
};

type RenderOptions = {
  expanded?: boolean;
  isPartial?: boolean;
};

type RenderTheme = {
  fg: (color: string, text: string) => string;
};

type FoldedRenderConfig = {
  loadingLabel?: string;
  previewLines?: number;
  collapsedPrefix?: (result: ToolResult) => string | undefined;
};

function getTextContent(result: ToolResult): string {
  const textPart = result.content?.find((item) => item?.type === "text");
  return typeof textPart?.text === "string" ? textPart.text : "";
}

export function renderFoldedToolText(
  result: ToolResult,
  options: RenderOptions,
  theme: RenderTheme,
  config: FoldedRenderConfig,
): Text {
  const loadingLabel = config.loadingLabel ?? "Loading...";
  const previewLines = Math.max(1, config.previewLines ?? 12);

  if (options.isPartial) {
    return new Text(theme.fg("warning", loadingLabel), 0, 0);
  }

  const fullText = getTextContent(result);
  if (!fullText) {
    return new Text(theme.fg("muted", "no text output"), 0, 0);
  }

  const lines = fullText.split("\n");
  const hidden = Math.max(0, lines.length - previewLines);

  let output = "";

  const visible = options.expanded ? lines : lines.slice(0, previewLines);
  output += visible.map((line) => theme.fg("toolOutput", line)).join("\n");

  if (!options.expanded && hidden > 0) {
    const shown = Math.min(previewLines, lines.length);
    const expandShortcut = keyText("app.tools.expand").trim();
    const expandHint = expandShortcut
      ? `${expandShortcut} to view full output`
      : "expand to view full output";
    const prefix = config.collapsedPrefix?.(result);
    const summary = prefix
      ? `${prefix}. showing ${shown} of ${lines.length} lines`
      : `showing ${shown} of ${lines.length} lines`;
    output +=
      "\n" +
      theme.fg("warning", `... ${summary} (${expandHint})`);
  }

  return new Text(output, 0, 0);
}
