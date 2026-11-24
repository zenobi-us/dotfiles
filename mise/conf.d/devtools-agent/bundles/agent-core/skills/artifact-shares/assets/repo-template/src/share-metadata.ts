// Shared by the CLI producer and cloned repository consumers. Never rewrites historical pages.
export const SHARE_METADATA_VERSION = "artifact-share-metadata/v2";

export function readShareMetadata(page: string): Record<string, unknown> {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(page);
  if (!match) throw new Error("Share page requires YAML frontmatter.");
  const value: unknown = Bun.YAML.parse(match[1]!);
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Share metadata must be a YAML object.");
  return interpretShareMetadata(value as Record<string, unknown>, page);
}

/** Interpret historical hashes, then validate the complete owned metadata at both boundaries. */
export function interpretShareMetadata(data: Record<string, unknown>, page: string): Record<string, unknown> {
  if (Object.hasOwn(data, "schemaVersion") && !["artifact-share-metadata/v1", SHARE_METADATA_VERSION].includes(data.schemaVersion as string)) {
    throw new Error("Unsupported explicit share metadata contract.");
  }
  const legacy = !Object.hasOwn(data, "schemaVersion") || data.schemaVersion === "artifact-share-metadata/v1";
  if (legacy && typeof data.hash === "number") {
    // YAML numbers lose leading zeros and exponent-shaped hexadecimal text.
    // Recover identity only from the original plain 12-character hash scalar.
    const front = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(page)?.[1];
    const hash = front && /^hash:[ \t]+([a-f0-9]{12})[ \t]*(?:#[^\r\n]*)?\r?$/m.exec(front);
    if (hash) data = { ...data, hash: hash[1]! };
  }
  for (const key of ["title", "kind", "hash", "date", "source"]) {
    if (typeof data[key] !== "string") throw new Error(`Share metadata ${key} must be a string.`);
  }
  if (data.description !== undefined && typeof data.description !== "string") throw new Error("Share description must be a string.");
  if (!data.kind || !/^[a-f0-9]{12}$/.test(data.hash as string) || !/^\d{4}-\d{2}-\d{2}$/.test(data.date as string)) {
    throw new Error("Share metadata requires a kind, 12-character hash and YYYY-MM-DD date.");
  }
  return data;
}
