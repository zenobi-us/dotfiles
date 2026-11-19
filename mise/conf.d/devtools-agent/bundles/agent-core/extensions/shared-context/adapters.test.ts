import { describe, expect, it } from "vitest";
import type { AutocompleteProvider as PiAutocompleteProvider } from "@earendil-works/pi-tui";
import type { AutocompleteProvider, GetItems, SharedContextItem } from "./autocomplete";
import { createOmpAutocompleteProvider } from "./omp";
import { createPiAutocompleteProvider } from "./pi";

const current = {
  async getSuggestions() { return null; },
  applyCompletion(lines: string[], cursorLine: number, cursorCol: number) {
    return { lines, cursorLine, cursorCol };
  },
};

const adapters = [
  {
    name: "OMP",
    create(getItems: GetItems) {
      const provider: AutocompleteProvider = createOmpAutocompleteProvider(current, getItems);
      return (signal: AbortSignal) => provider.getSuggestions(["shared://"], 0, 9, signal);
    },
  },
  {
    name: "Pi",
    create(getItems: GetItems) {
      const provider: PiAutocompleteProvider = createPiAutocompleteProvider(current, getItems);
      return (signal: AbortSignal) => provider.getSuggestions(["shared://"], 0, 9, { signal });
    },
  },
];

describe.each(adapters)("$name autocomplete cancellation", ({ create }) => {
  it("does not load files for an already cancelled query", async () => {
    const query = create(async () => { throw new Error("Cancelled query loaded files"); });
    expect(await query(AbortSignal.abort())).toBeNull();
  });

  it("discards suggestions when cancellation occurs during loading", async () => {
    const { promise: pending, resolve: resolveItems } = Promise.withResolvers<SharedContextItem[]>();
    const query = create(() => pending);
    const controller = new AbortController();
    const suggestions = query(controller.signal);
    controller.abort();
    resolveItems([{ absolutePath: "/context/CONTEXT.md", relativePath: "CONTEXT.md" }]);
    expect(await suggestions).toBeNull();
  });
});
