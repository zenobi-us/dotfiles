
/**
 * Slugify text: convert to lowercase, remove special chars, replace spaces with hyphens
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\n/g, " ")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Remove leading whitespace from multiline strings
 */
export function dedent(text: string): string {
  const lines = text.split("\n");
  const indent = lines
    .find((line) => line.trim())
    ?.match(/^\s*/)?.[0]?.length ?? 0;
  return lines.map((line) => line.slice(indent)).join("\n");
}
