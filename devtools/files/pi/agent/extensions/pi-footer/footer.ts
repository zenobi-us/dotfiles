import { truncateToWidth, visibleWidth } from "@mariozechner/pi-tui";
import { Template, TemplateContext } from "./core/template";
import { FooterInstance } from "./types";
import {
  FooterTemplate,
  FooterTemplateObjectItem,
} from "./services/config/defaults";

type RenderedTemplateItem = {
  text: string;
  align: "left" | "right";
  flexGrow: boolean;
};

function renderTemplateItem(
  template: Template,
  context: TemplateContext,
  entry: string | FooterTemplateObjectItem,
  rootSeparator: string,
): RenderedTemplateItem | null {
  if (typeof entry === "string") {
    const text = template.render(entry, context).replace(/\s+/g, " ").trim();

    if (!text) return null;

    return { text, align: "left", flexGrow: false };
  }

  const separator = entry.separator ?? rootSeparator;
  const renderedChildren = entry.items
    .map(
      (child) =>
        renderTemplateItem(template, context, child, rootSeparator)?.text ?? "",
    )
    .filter((value) => value.trim().length > 0);

  const text = renderedChildren.join(separator).replace(/\s+/g, " ").trim();
  if (!text) return null;

  return {
    text,
    align: entry.align === "right" ? "right" : "left",
    flexGrow: entry.flexGrow === true,
  };
}

function renderTemplateLine(
  templateEngine: Template,
  context: TemplateContext,
  line: FooterTemplate[number],
  width: number,
  separator: string,
): string {
  const entries: (string | FooterTemplateObjectItem)[] = Array.isArray(line)
    ? line
    : [line];

  const rendered = entries
    .map((entry) =>
      renderTemplateItem(templateEngine, context, entry, separator),
    )
    .filter((entry): entry is RenderedTemplateItem => entry !== null);

  if (rendered.length === 0) return "";

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

export function createFooterSingleton(): FooterInstance {
  const template = new Template();

  return {
    template,
    registerContextProvider(name, provider) {
      template.registerContextProvider(name, provider);
    },
    registerContextFilter(name, filter) {
      template.registerContextFilter(name, filter);
    },
    render(ctx, theme, width, options) {
      if (!options.template) {
        return [""];
      }

      const context = template.createContext(ctx);
      const separator = theme.fg("dim", " · ");
      const lines: string[] = [];

      for (const line of options.template) {
        lines.push(
          renderTemplateLine(template, context, line, width, separator),
        );
      }

      return lines;
    },
  };
}

export const Footer = createFooterSingleton();
