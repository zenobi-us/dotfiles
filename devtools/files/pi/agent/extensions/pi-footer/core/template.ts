import type {
  ExtensionAPI,
  ExtensionContext,
} from "@mariozechner/pi-coding-agent";
import { FooterContextProvider, FilterFunction } from "../types";

export type TemplateContext = {
  data: Record<string, string>;
  rawData: Record<string, unknown>;
};

export function stringifyProviderValue(
  value: ReturnType<FooterContextProvider>,
): string {
  if (value == null) return "";

  const entries = Array.isArray(value) ? value : [value];

  return entries
    .map((entry) => {
      if (entry == null) return "";
      if (typeof entry === "object") return "";
      return String(entry).trim();
    })
    .filter((entry) => entry.length > 0)
    .join(" ");
}

function parseArg(part: string): unknown {
  const trimmed = part.trim();
  if (trimmed.length === 0) return "";

  const quoted = trimmed.match(/^(["'])(.*)\1$/);
  if (quoted) return quoted[2];

  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed === "null") return null;

  const num = Number(trimmed);
  if (!Number.isNaN(num) && Number.isFinite(num)) return num;

  return trimmed;
}

function splitArgs(argsStr: string): string[] {
  const parts: string[] = [];
  let current = "";
  let quote: "'" | '"' | null = null;

  for (let i = 0; i < argsStr.length; i++) {
    const ch = argsStr[i];

    if ((ch === "'" || ch === '"') && (i === 0 || argsStr[i - 1] !== "\\")) {
      if (quote === ch) {
        quote = null;
      } else if (quote === null) {
        quote = ch;
      }
      current += ch;
      continue;
    }

    if (ch === "," && quote === null) {
      parts.push(current.trim());
      current = "";
      continue;
    }

    current += ch;
  }

  if (current.trim().length > 0) parts.push(current.trim());
  return parts;
}

function parseFilter(
  filterExpr: string,
): { name: string; args: unknown[] } | null {
  const match = filterExpr.match(/^([A-Za-z_][\w-]*)(?:\((.*)\))?$/);
  if (!match) return null;

  const name = match[1];
  const argsStr = match[2];

  const args: unknown[] = [];
  if (argsStr && argsStr.trim().length > 0) {
    for (const part of splitArgs(argsStr)) {
      args.push(parseArg(part));
    }
  }

  return { name, args };
}

export class Template {
  providers = new Map<string, FooterContextProvider>();
  filters = new Map<string, FilterFunction>();

  registerContextProvider(name: string, provider: FooterContextProvider): void {
    this.providers.set(name, provider);
  }

  unregisterContextProvider(name: string): void {
    this.providers.delete(name);
  }

  registerContextFilter(name: string, filter: FilterFunction): void {
    this.filters.set(name, filter);
  }

  unregisterContextFilter(name: string): void {
    this.filters.delete(name);
  }

  createContext(props: {
    pi: ExtensionAPI;
    ctx: ExtensionContext;
  }): TemplateContext {
    const data: Record<string, string> = {};
    const rawData: Record<string, unknown> = {};

    for (const [name, provider] of this.providers.entries()) {
      try {
        const value = provider(props);
        rawData[name] = value;
        data[name] = stringifyProviderValue(value);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        data[name] = `${name}: ${message}`;
        rawData[name] = undefined;
      }
    }

    return { data, rawData };
  }

  render(template: string, context: TemplateContext): string {
    const filterMemo = new Map<string, string>();

    return template.replace(
      /\{\s*([\w-]+)(?:\s*\|\s*([^}]+))?\s*\}/g,
      (_match, key: string, filterExpr?: string) => {
        const value = context.data[key] ?? "";

        if (!filterExpr) return value;

        const parsed = parseFilter(filterExpr.trim());
        if (!parsed) return value;

        const rawValue = context.rawData[key];
        const cacheKey = `${key}|${parsed.name}|${JSON.stringify(parsed.args)}|${JSON.stringify(rawValue)}`;

        const cached = filterMemo.get(cacheKey);
        if (cached != null) return cached;

        const filter = this.filters.get(parsed.name);
        if (!filter) {
          console.warn(`Unknown filter: ${parsed.name}`);
          const fallback = String(value ?? "--");
          filterMemo.set(cacheKey, fallback);
          return fallback;
        }

        try {
          const result = filter.apply(null, [rawValue, ...parsed.args]);
          filterMemo.set(cacheKey, result);
          return result;
        } catch (error) {
          console.error(`Filter ${parsed.name} failed:`, error);
          const fallback = String(value ?? "--");
          filterMemo.set(cacheKey, fallback);
          return fallback;
        }
      },
    );
  }
}
