// Reads exact wire identities without normalizing immutable historical records.
type Fields = Record<string, unknown>;

/** Reject mixed, absent, and unknown identifiers; no implicit legacy detection. */
export function contractIdentity(fields: Fields, family: string, current: number, historical: number[] = []): string {
  const modern = Object.hasOwn(fields, "schemaVersion");
  const retained = Object.hasOwn(fields, "schema");
  if (modern === retained) throw new Error(`Expected exactly one ${family} contract identifier.`);
  const identifier = modern ? fields.schemaVersion : fields.schema;
  const allowed = modern ? [`${family}/v${current}`] : historical.map(version => `${family}/v${version}`);
  if (typeof identifier !== "string" || !allowed.includes(identifier)) throw new Error(`Unsupported ${family} contract identifier.`);
  return identifier;
}

export function receiptIdentity(fields: Fields): string {
  if (fields.schemaVersion === "worktree-receipt/v3" && !Object.hasOwn(fields, "schema")) return "worktree-receipt/v3";
  return contractIdentity(fields, "worktree-receipt", 4, [1, 2]);
}

/** V2–v4 share source/integration semantics, but never share wire identities. */
export function strictReceipt(fields: Fields): boolean {
  return receiptIdentity(fields) !== "worktree-receipt/v1";
}
