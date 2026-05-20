import { keyText, Theme } from "@mariozechner/pi-coding-agent";
import { Text } from "@mariozechner/pi-tui";

type ToolResult<D = unknown> = {
  content?: Array<{ type?: string; text?: string }>;
  details?: D;
};

type RenderOptions = {
  expanded?: boolean;
  isPartial?: boolean;
};

type FoldedRenderConfig<T extends ToolResult> = {
  loadingLabel?: string;
  previewLines?: number;
  collapsedPrefix?: (data: {
    result: T;
    expandShortcut: string | undefined;
  }) => string | undefined;
};

function getTextContent<T extends ToolResult>(result: T): string {
  const textPart = result.content?.find((item) => item?.type === "text");
  return typeof textPart?.text === "string" ? textPart.text : "";
}

export function renderFoldedToolText<T extends ToolResult>(
  result: T,
  options: RenderOptions,
  theme: Theme,
  config: FoldedRenderConfig<T>,
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
    
    const summary = config.collapsedPrefix?.({ result, expandShortcut }) ?? `showing ${shown} of ${lines.length} lines. ${expandHint}`;

    output += theme.fg("toolOutput", summary);
  }

  return new Text(output, 0, 0);
}
