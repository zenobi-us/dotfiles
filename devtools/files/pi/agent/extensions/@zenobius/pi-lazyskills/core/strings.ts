export function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function pathToKebabName(relativePath: string): string {
  return relativePath.split(/[/\\]/).filter(Boolean).join("-");
}
