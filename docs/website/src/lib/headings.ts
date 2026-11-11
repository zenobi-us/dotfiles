// React headings and compiled Markdown share the same permalink markup and slug rules.
export const headingLinkIcon = {
  viewBox: "0 0 24 24",
  path: "M10 13l4-4m-6 7-1 1a4 4 0 01-6-6l4-4a4 4 0 016 0m2 1 1-1a4 4 0 016 6l-4 4a4 4 0 01-6 0",
};

export function headingSlug(text: string): string {
  return (
    text
      .normalize("NFKC")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}_-]+/gu, "-")
      .replace(/^-+|-+$/g, "") || "section"
  );
}
