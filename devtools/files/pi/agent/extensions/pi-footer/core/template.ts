import type { ExtensionContext } from "@mariozechner/pi-coding-agent";
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

function parseFilter(
  filterExpr: string,
): { name: string; args: unknown[] } | null {
  const match = filterExpr.match(/^(\w+)(?:\(([^)]*)\))?$/);
  if (!match) return null;

  const name = match[1];
  const argsStr = match[2];

  const args: unknown[] = [];
  if (argsStr) {
    const parts = argsStr.split(",").map((s) => s.trim());
    for (const part of parts) {
      const num = Number(part);
      args.push(Number.isNaN(num) ? part : num);
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

  createContext(ctx: ExtensionContext): TemplateContext {
    const data: Record<string, string> = {};
    const rawData: Record<string, unknown> = {};

    for (const [name, provider] of this.providers.entries()) {
      try {
        const value = provider(ctx);
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
      /\{\s*([\w-]+)(?:\s*\|\s*([\w()\d,\s]+))?\s*\}/g,
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
