import { describe, expect, it } from "vitest";
import {
  createSharedContextAutocompleteProvider,
  type AutocompleteProvider,
  type SharedContextItem,
} from "./index";

function baseProvider(): AutocompleteProvider {
  return {
    async getSuggestions() {
      return {
        prefix: "#",
        items: [{ value: "Copy current line", label: "Copy current line" }],
      };
    },
    applyCompletion(lines, cursorLine, cursorCol) {
      return { lines, cursorLine, cursorCol };
    },
  };
}

describe("shared-context autocomplete", () => {
  it("replaces hash actions with matching context items and inserts an attachment", async () => {
    const items: SharedContextItem[] = [
      {
        absolutePath: "/context/docs/adr/0006-typed-context-store-layout.md",
        relativePath: "docs/adr/0006-typed-context-store-layout.md",
      },
      {
        absolutePath: "/context/docs/plans/migrate skill.md",
        relativePath: "docs/plans/migrate skill.md",
      },
    ];
    const provider = createSharedContextAutocompleteProvider(baseProvider(), async () => items);

    const suggestions = await provider.getSuggestions(["review #typed"], 0, 13);

    expect(suggestions).toEqual({
      prefix: "#typed",
      items: [
        {
          value: "/context/docs/adr/0006-typed-context-store-layout.md",
          label: "docs/adr/0006-typed-context-store-layout.md",
          description: "Shared context",
          sharedContextPath: "/context/docs/adr/0006-typed-context-store-layout.md",
        },
      ],
    });

    const completion = provider.applyCompletion(
      ["review #typed next"],
      0,
      13,
      suggestions!.items[0]!,
      suggestions!.prefix,
    );

    expect(completion).toEqual({
      lines: ["review @/context/docs/adr/0006-typed-context-store-layout.md next"],
      cursorLine: 0,
      cursorCol: 60,
    });
  });

  it("quotes context paths that contain spaces", async () => {
    const item: SharedContextItem = {
      absolutePath: "/context/docs/plans/migrate skill.md",
      relativePath: "docs/plans/migrate skill.md",
    };
    const provider = createSharedContextAutocompleteProvider(baseProvider(), async () => [item]);
    const suggestions = await provider.getSuggestions(["#migrate"], 0, 8);

    const completion = provider.applyCompletion(
      ["#migrate"],
      0,
      8,
      suggestions!.items[0]!,
      suggestions!.prefix,
    );

    expect(completion.lines).toEqual(["@\"/context/docs/plans/migrate skill.md\" "]);
  });
});
