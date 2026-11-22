// The shared writer owns persistence. This adapter changes only the root schema token.
import { readRecord, ids } from "./records.mjs";
const old = "twg-benchmark-configuration/v1";
const current = ids.configuration;

function schemaToken(content) {
  JSON.parse(content);
  const tokens = [...content.matchAll(/"(?:[^"\\]|\\.)*"|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null|[{}\[\]:,]/gu)];
  let depth = 0;
  const matches = [];
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index][0];
    if (token === "{" || token === "[") depth++;
    else if (token === "}" || token === "]") depth--;
    else if (depth === 1 && token.startsWith('"') && JSON.parse(token) === "schemaVersion" && tokens[index + 1]?.[0] === ":") matches.push(tokens[index + 2]);
  }
  if (matches.length !== 1) throw new Error("Configuration requires one root schemaVersion field.");
  return matches[0];
}
function replaceSchema(content, replacement) {
  const token = schemaToken(content);
  return content.slice(0, token.index) + replacement + content.slice(token.index + token[0].length);
}
export default {
  identify(content) {
    const value = JSON.parse(content);
    schemaToken(content);
    if (value.schemaVersion === 1) return old;
    if (typeof value.schemaVersion !== "string") throw new Error("Unsupported explicit configuration schemaVersion.");
    return value.schemaVersion;
  },
  detectLegacy() { return []; },
  validate(contract, content) {
    const value = JSON.parse(content);
    if (contract !== (value.schemaVersion === 1 ? old : current)) return false;
    readRecord(value, "configuration");
    return true;
  },
  preservation(_contract, content) { return replaceSchema(content, '"schema-identity"'); },
  mutable(path, content) {
    const value = JSON.parse(content);
    return value.immutable !== true && !/(?:^|[/\\])(?:runs|events|artifacts|evidence)(?:[/\\]|$)/u.test(path) &&
      [1, current].includes(value.schemaVersion) && value.contractName === "twg-bench-lite" && !value.manifest && !value.prompt;
  },
  destinations(operation) {
    if (operation !== "upgrade") throw new Error("Only explicit configuration upgrade is supported.");
    return [current];
  },
  convert(procedure, from, to, content) {
    if (procedure !== "file:references/configuration-upgrade.json" || from !== old || to !== current) throw new Error("Unsupported configuration upgrade procedure.");
    return { content: replaceSchema(content, JSON.stringify(current)), lossless: true, requiresDecision: false };
  },
  mutate() { throw new Error("Configuration mutation is not supported."); }
};
