import { truncateToWidth, visibleWidth } from "@mariozechner/pi-tui";
import { normalize } from "./core/formattings";
import { applyFilter, parseFilter } from "./core/filters";
import {
  FooterInstance,
  FooterContextProvider,
  FooterSegment,
  FooterTheme,
} from "./types";
import {
  FooterTemplate,
  FooterTemplateObjectItem,
} from "./services/config/defaults";

function stringifyProviderValue(
  value: ReturnType<FooterContextProvider>,
): string {
  if (value == null) return "";
  if (typeof value === "string") return value;

  const segments = Array.isArray(value)
    ? value
    : [value as string | FooterSegment];

  return segments
    .map((entry) => (typeof entry === "string" ? entry : entry.text))
    .filter((entry) => entry.trim().length > 0)
    .join(" ");
}

function interpolateTemplate(
  template: string,
  data: Record<string, string>,
  rawData: Record<string, unknown>,
): string {
  return template.replace(/\{\s*([\w-]+)(?:\s*\|\s*([\w()\d,\s]+))?\s*\}/g, (
    _match,
    key: string,
    filterExpr?: string,
  ) => {
    const value = data[key] ?? "";
    
    // If no filter, return stringified value
    if (!filterExpr) return value;
    
    // Parse and apply filter to raw value
    const filter = parseFilter(filterExpr.trim());
    if (!filter) return value;
    
    const rawValue = rawData[key];
    return applyFilter(rawValue, filter.name, filter.args);
  });
}

function applyStyles(
  theme: FooterTheme,
  text: string,
  styles: { fg?: string; bg?: string },
): string {
  let styled = text;

  if (styles.fg) {
    styled = theme.fg(styles.fg, styled);
  }

  if (styles.bg && typeof theme.bg === "function") {
    styled = theme.bg(styles.bg, styled);
  }

  return styled;
}

type RenderedTemplateItem = {
  text: string;
  align: "left" | "right";
  flexGrow: boolean;
};

function renderTemplateItem(
  entry: string | FooterTemplateObjectItem,
  data: Record<string, string>,
  rawData: Record<string, unknown>,
  theme: FooterTheme,
): RenderedTemplateItem | null {
  if (typeof entry === "string") {
    const text = interpolateTemplate(entry, data, rawData).replace(/\s+/g, " ").trim();
    if (!text) return null;
    return { text, align: "left", flexGrow: false };
  }

  const separator = entry.separator ?? " ";
  const renderedChildren = entry.items
    .map((child) => renderTemplateItem(child, data, rawData, theme)?.text ?? "")
    .filter((value) => value.trim().length > 0);

  const text = applyStyles(theme, renderedChildren.join(separator), {
    fg: entry.fg,
    bg: entry.bg,
  })
    .replace(/\s+/g, " ")
    .trim();

  if (!text) return null;

  return {
    text,
    align: entry.align === "right" ? "right" : "left",
    flexGrow: entry.flexGrow === true,
  };
}

function renderTemplateLine(
  line: FooterTemplate[number],
  data: Record<string, string>,
  rawData: Record<string, unknown>,
  width: number,
  theme: FooterTheme,
): string {
  const entries: (string | FooterTemplateObjectItem)[] = Array.isArray(line)
    ? line
    : [line];
  const rendered = entries
    .map((entry) => renderTemplateItem(entry, data, rawData, theme))
    .filter((entry): entry is RenderedTemplateItem => entry !== null);

  if (rendered.length === 0) return "";

  const separator = theme.fg("dim", " · ");

  const left = rendered
    .filter((item) => item.align === "left" && !item.flexGrow)
    .map((item) => item.text)
    .join(separator);

  const trailing = rendered
    .filter((item) => item.align === "right" || item.flexGrow)
    .map((item) => item.text)
    .join(separator);

  if (!trailing) {
    return truncateToWidth(left || "", width);
  }

  const pad = " ".repeat(
    Math.max(1, width - visibleWidth(left) - visibleWidth(trailing)),
  );

  return truncateToWidth(`${left}${pad}${trailing}`, width);
}

function renderFromTemplate(
  template: FooterTemplate,
  data: Record<string, string>,
  rawData: Record<string, unknown>,
  width: number,
  theme: FooterTheme,
): string[] {
  return template.map((line) => renderTemplateLine(line, data, rawData, width, theme));
}

export function createFooterSingleton(): FooterInstance {
  const providers = new Map<string, FooterContextProvider>();

  return {
    registerContextProvider(name, provider) {
      providers.set(name, provider);
    },
    unregisterContextProvider(name) {
      providers.delete(name);
    },
    listContextProviders() {
      return Array.from(providers.keys()).sort((a, b) => a.localeCompare(b));
    },
    render(ctx, theme, width, options) {
      const providerData: Record<string, string> = {};
      const rawProviderData: Record<string, unknown> = {};

      const segments = Array.from(providers.entries()).reduce<FooterSegment[]>(
        (acc, [name, provider]) => {
          try {
            const value = provider(ctx);
            rawProviderData[name] = value;
            providerData[name] = stringifyProviderValue(value);
            return acc.concat(normalize(name, value));
          } catch (error) {
            const message =
              error instanceof Error ? error.message : String(error);
            providerData[name] = `${name}: ${message}`;
            rawProviderData[name] = undefined;
            return acc.concat({
              text: theme.fg("error", `${name}: ${message}`),
              align: "left",
              order: 999,
            });
          }
        },
        [],
      );

      if (options.template) {
        return renderFromTemplate(
          options.template,
          providerData,
          rawProviderData,
          width,
          theme as unknown as FooterTheme,
        );
      }

      const left = segments
        .filter((segment) => segment.align !== "right")
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((segment) => segment.text)
        .join(theme.fg("dim", " · "));

      const right = segments
        .filter((segment) => segment.align === "right")
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((segment) => segment.text)
        .join(theme.fg("dim", " · "));

      if (!right) {
        return [truncateToWidth(left || "", width)];
      }

      const pad = " ".repeat(
        Math.max(1, width - visibleWidth(left) - visibleWidth(right)),
      );
      return [truncateToWidth(`${left}${pad}${right}`, width)];
    },
  };
}
