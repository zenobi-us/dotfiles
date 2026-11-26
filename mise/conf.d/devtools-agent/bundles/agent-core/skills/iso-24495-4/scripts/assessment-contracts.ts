// The shared writer converts selected mutable assessment JSON. Immutable history
// uses readers; appending state preserves every historical snapshot field.
import { isDeepStrictEqual } from "node:util";
import type { UpgradeOwner } from "../../skill-contracts/scripts/upgrades.ts";
import { CONTRACTS, authored, detectLegacy, identify, parseRecord, readRecord, validRecord, validSnapshot } from "./lib/contracts.ts";

const current = "plain-language-audit-state/v2";

const owner: UpgradeOwner = {
  identify(content) { return identify(parseRecord(content)); },
  detectLegacy(content) { return [detectLegacy(parseRecord(content))]; },
  validate(contract, content) { return validRecord(contract, parseRecord(content)); },
  preservation(_contract, content) { return authored(parseRecord(content)); },
  mutable(path, content) {
    const value = parseRecord(content);
    return value.immutable !== true && !path.split(/[\\/]/).some((part) =>
      ["events", "snapshots", "receipts", "artifacts"].includes(part));
  },
  destinations(operation) {
    if (operation !== "upgrade" && operation !== "append") throw new Error("Unsupported audit-state operation.");
    return operation === "append" ? [current] : Object.values(CONTRACTS).map((family) => `${family}/v2`);
  },
  convert(procedure, from, to, content) {
    if (procedure !== "file:references/assessment-upgrade.md"
      || !Object.values(CONTRACTS).some((family) => from === `${family}/v1` && to === `${family}/v2`)) {
      throw new Error("Unsupported assessment upgrade procedure.");
    }
    const value = parseRecord(content);
    if (!validRecord(from, value)) throw new Error("Invalid historical assessment.");
    return { content: JSON.stringify({ ...value, schemaVersion: to }, null, 2), lossless: true, requiresDecision: false };
  },
  mutate(operation, contract, content, request) {
    if (operation !== "append" || contract !== current || !request || typeof request !== "object"
      || !("snapshot" in request) || !("expected" in request)
      || Object.keys(request).some((key) => key !== "snapshot" && key !== "expected")
      || !validSnapshot(request.snapshot)) throw new Error("Append requires a valid snapshot and expected state.");
    const value = parseRecord(content);
    const state = readRecord("state", value);
    if (!isDeepStrictEqual(authored(value), request.expected)) throw new Error("Audit state changed before append.");
    return JSON.stringify({ ...value, snapshots: [...state.snapshots, request.snapshot] }, null, 2);
  },
};
export default owner;
