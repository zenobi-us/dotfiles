import * as fs from "node:fs/promises";
import assert from "node:assert/strict";
import ts from "/tmp/ux02-deps/node_modules/typescript";

const [candidate, output] = Bun.argv.slice(2);
const source = await fs.readFile(candidate, "utf8");
const syntax = ts.createSourceFile(candidate, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const names = ["workTokens", "inputContextTokens", "snapshotRequest", "boundInput"];
const declarations = names.map(name => {
  const node = syntax.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === name);
  if (!node) throw new Error("Missing actual candidate function: " + name);
  return node.getText(syntax);
}).join("\n");
// Compile the candidate's actual private pure functions, not a second algorithm.
// The native probe separately exercises their real transport/factory integration.
const compiled = new Bun.Transpiler({ loader: "ts" }).transformSync(declarations);
const { workTokens, inputContextTokens, snapshotRequest, boundInput } = new Function(compiled + "\nreturn {" + names.join(",") + "};")();
const cases = [];
const run = (name, check) => { check(); cases.push({ name, result: "passed" }); };
const old = snapshotRequest({ model: "gpt-6.1-sol", instructions: "original", input: [{ role: "user", content: "retained" }] });
const previous = { request: old, inputTokens: 100, outputTokens: 17 };
const current = snapshotRequest({ model: "gpt-6.1-sol", instructions: "original", input: [{ role: "user", content: "retained" }, { role: "assistant", content: "new" }] });
run("first request uses the full-wire bound", () => assert.deepEqual(boundInput(undefined, current, 5000), { tokens: 5000, mode: "wire" }));
run("exact retained prefix reuses measured input and reserves prior output", () => {
  const actual = boundInput(previous, current, 5000);
  assert.equal(actual.mode, "observed-prefix");
  assert.equal(actual.tokens, 117 + 2 + Buffer.byteLength(current.input[1], "utf8") + 1);
  assert.equal(actual.changedControlBytes, 0);
});
run("replacement controls add their complete serialized byte bound", () => {
  const changed = snapshotRequest({ model: "gpt-6.1-sol", instructions: "replacement 東京", input: [{ role: "user", content: "retained" }] });
  const actual = boundInput(previous, changed, 5000);
  const replacement = Buffer.byteLength(JSON.stringify("instructions"), "utf8") + Buffer.byteLength(JSON.stringify("replacement 東京"), "utf8") + 2;
  assert.equal(actual.changedControlBytes, replacement);
  assert.equal(actual.tokens, 117 + 2 + replacement);
});
run("removed controls never subtract previously observed input", () => {
  const removed = snapshotRequest({ model: "gpt-6.1-sol", input: [{ role: "user", content: "retained" }] });
  assert.equal(boundInput(previous, removed, 5000).tokens, 119);
});
run("changed or removed retained inputs fall back instead of reusing a stale anchor", () => {
  for (const input of [[], [{ role: "user", content: "different" }], [{ role: "assistant", content: "new" }, { role: "user", content: "retained" }]]) {
    assert.deepEqual(boundInput(previous, snapshotRequest({ model: "gpt-6.1-sol", instructions: "original", input }), 5000), { tokens: 5000, mode: "wire" });
  }
});
run("another model cannot inherit measured context", () => assert.equal(boundInput(previous, snapshotRequest({ model: "different", instructions: "original", input: [{ role: "user", content: "retained" }] }), 5000).mode, "wire"));
run("UTF-8 suffixes use bytes rather than character counts", () => {
  const unicode = snapshotRequest({ model: "gpt-6.1-sol", instructions: "original", input: [{ role: "user", content: "retained" }, { role: "user", content: "東京 é 🙂" }] });
  const actual = boundInput(previous, unicode, 5000);
  assert.equal(actual.tailBytes, 2 + Buffer.byteLength(unicode.input[1], "utf8") + 1);
  assert.ok(actual.tailBytes > unicode.input[1].length + 3);
});
run("the independent wire bound wins when it is smaller", () => assert.deepEqual(boundInput(previous, current, 20), { tokens: 20, mode: "wire" }));
run("cached input is excluded from work but retained in uncached-context reservations", () => {
  const usage = { input: 10, output: 3, cacheWrite: 2, cacheRead: 10000 };
  assert.equal(workTokens(usage), 15);
  assert.equal(inputContextTokens(usage), 10012);
  for (const cacheRead of [undefined, NaN, -1]) assert.throws(() => inputContextTokens({ ...usage, cacheRead }));
});
run("a changed runtime reminder charges the complete replacement tail without subtracting the old one", () => {
  const priorRequest = snapshotRequest({ model: "gpt-6.1-sol", instructions: "original", input: [{ role: "user", content: "retained" }, { role: "user", content: "old reminder" }] });
  const replacement = snapshotRequest({ model: "gpt-6.1-sol", instructions: "original", input: [{ role: "user", content: "retained" }, { role: "user", content: "new reminder" }, { role: "tool", content: "observation" }] });
  const actual = boundInput({ ...previous, request: priorRequest }, replacement, 5000);
  const fullTail = 2 + Buffer.byteLength(replacement.input[1], "utf8") + Buffer.byteLength(replacement.input[2], "utf8") + 2;
  assert.equal(actual.retainedItems, 1);
  assert.equal(actual.tailBytes, fullTail);
  assert.equal(actual.tokens, previous.inputTokens + previous.outputTokens + fullTail);
});
const result = { status: "passed", candidate, candidate_sha256: new Bun.CryptoHasher("sha256").update(source).digest("hex"), cases, scope: "Pure input reservation and accounting invariants. This is not the native transport/admission verification." };
const file = await fs.open(output, "wx");
try { await file.writeFile(JSON.stringify(result, null, 2) + "\n"); } finally { await file.close(); }
console.log(JSON.stringify(result));
