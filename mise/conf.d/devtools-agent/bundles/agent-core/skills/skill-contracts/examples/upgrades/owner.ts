// Runnable domain owner: shared operations never interpret these note fields.
import Ajv from "ajv@^8.17.1";
const old = "example-note/v1";
const current = "example-note/v2";
const validateObject = new Ajv().compile<Record<string, unknown>>({ type: "object" });
function parse(content: string): Record<string, unknown> {
  const value: unknown = JSON.parse(content, preserveNumber);
  if (!validateObject(value)) throw new Error("Note must be a JSON object.");
  return value;
}

// The source lexeme prevents the same lossy parse from hiding rounding in both snapshots.
function preserveNumber(_key: string, value: unknown, context?: { source?: string }): unknown {
  if (typeof value !== "number") return value;
  if (!context?.source || !Number.isFinite(value) || Object.is(value, -0) || decimalValue(context.source) !== decimalValue(JSON.stringify(value))) {
    throw new Error("Authored numeric value cannot round-trip without loss.");
  }
  return value;
}
function decimalValue(source: string): string {
  const [mantissa, exponent = "0"] = source.toLowerCase().split("e");
  const fractionLength = mantissa.split(".")[1]?.length ?? 0;
  const digits = mantissa.replace(".", "");
  if (/^-?0+$/.test(digits)) return "0";
  const significant = digits.replace(/0+$/, "");
  return `${BigInt(significant)}e${BigInt(exponent) - BigInt(fractionLength) + BigInt(digits.length - significant.length)}`;
}
export default {
  identify(content: string): string | null {
    const value = parse(content);
    if (!Object.hasOwn(value, "schemaVersion")) return null;
    if (typeof value.schemaVersion !== "string") throw new Error("Explicit schemaVersion must be a string.");
    return value.schemaVersion;
  },
  detectLegacy(content: string): string[] {
    const value = parse(content);
    return !Object.hasOwn(value, "schemaVersion") && typeof value.title === "string" && typeof value.body === "string" ? [old] : [];
  },
  validate(contract: string, content: string): boolean {
    const value = parse(content);
    if (contract === old) return (!Object.hasOwn(value, "schemaVersion") || value.schemaVersion === old) && typeof value.title === "string" && typeof value.body === "string" && !Object.hasOwn(value, "document");
    const document = value.document;
    return contract === current && value.schemaVersion === current && document !== null && typeof document === "object" && "heading" in document && typeof document.heading === "string" && "text" in document && typeof document.text === "string" && Object.keys(document).sort().join() === "heading,text" && !Object.hasOwn(value, "title") && !Object.hasOwn(value, "body");
  },
  preservation(contract: string, content: string): unknown {
    const { schemaVersion, title, body, document, ...authored } = parse(content);
    const fields = contract === current ? parse(JSON.stringify(document)) : {};
    return { ...authored, title: contract === old ? title : fields.heading, body: contract === old ? body : fields.text };
  },
  mutable(_path: string, content: string): boolean { return parse(content).immutable !== true; },
  destinations(operation: string): string[] {
    if (!["upgrade", "rename"].includes(operation)) throw new Error("Unsupported note operation.");
    return [current];
  },
  convert(procedure: string, from: string, to: string, content: string) {
    if (procedure !== "file:upgrade.txt" || from !== old || to !== current) throw new Error("Unsupported declared procedure.");
    const { schemaVersion, title, body, ...authored } = parse(content);
    return { content: JSON.stringify({ ...authored, schemaVersion: current, document: { heading: title, text: body } }), lossless: true, requiresDecision: false };
  },
  mutate(operation: string, contract: string, content: string, request: unknown): string {
    if (operation !== "rename" || contract !== current || !request || typeof request !== "object" || !("title" in request) || typeof request.title !== "string") throw new Error("Rename requires a string title.");
    const value = parse(content);
    value.document = { ...parse(JSON.stringify(value.document)), heading: request.title };
    return JSON.stringify(value);
  },
};
