import { describe, expect, it } from "vitest";
import {
  type AutocompleteProvider,
  type SharedContextItem,
} from "./autocomplete";
import { createOmpAutocompleteProvider as createSharedContextAutocompleteProvider } from "./omp";

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
  it("matches shared URI queries and inserts an attachment", async () => {
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

    const suggestions = await provider.getSuggestions(["review shared://typed"], 0, 21);

    expect(suggestions).toEqual({
      prefix: "shared://typed",
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
      ["review shared://typed next"],
      0,
      21,
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
    const suggestions = await provider.getSuggestions(["shared://migrate"], 0, 16);

    const completion = provider.applyCompletion(
      ["shared://migrate"],
      0,
      16,
      suggestions!.items[0]!,
      suggestions!.prefix,
    );

    expect(completion.lines).toEqual(["@\"/context/docs/plans/migrate skill.md\" "]);
  });

  it("lists files for an empty query and matches non-contiguous letters case-insensitively", async () => {
    const items: SharedContextItem[] = [
      { absolutePath: "/context/docs/migration.md", relativePath: "docs/migration.md" },
      { absolutePath: "/context/tracker/ticket.md", relativePath: "tracker/ticket.md" },
    ];
    const provider = createSharedContextAutocompleteProvider(baseProvider(), async () => items);
    expect((await provider.getSuggestions(["shared://"], 0, 9))?.items).toHaveLength(2);
    const text = "review shared://MGRTN";
    expect((await provider.getSuggestions([text], 0, text.length))?.items.map((item) => item.label))
      .toEqual(["docs/migration.md"]);
  });

  it("keeps unmatched shared queries separate from ordinary file suggestions", async () => {
    const provider = createSharedContextAutocompleteProvider(baseProvider(), async () => []);
    expect(await provider.getSuggestions(["shared://missing"], 0, 16)).toBeNull();
  });

});
