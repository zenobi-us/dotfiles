// Nested splits must equalize by their axis spans, not just their child counts.
import { test } from "node:test";
import assert from "node:assert/strict";
import { equalizeTree } from "../app/mods/equalise-panes/equalize.mjs";

const pane = id => ({ id, type: "block", content: { terminal: id } });

test("nested parallel splits give every pane the same width without moving panes", () => {
  const root = {
    id: "root", type: "row", children: [pane("a"), {
      id: "nested", type: "row", size: { px: 200 }, children: [pane("b"), pane("c")],
    }],
  };
  assert.deepEqual(equalizeTree(root), { width: 3, height: 1, changed: true });
  assert.equal(root.children[0].size.weight, 1 / 3);
  assert.equal(root.children[1].size.weight, 2 / 3);
  assert.deepEqual(root.children[1].size, { weight: 2 / 3 });
  for (const child of root.children[1].children) assert.equal(child.size.weight, 0.5);
  assert.deepEqual(root.children.map(child => child.id), ["a", "nested"]);
  assert.deepEqual(root.children[1].children.map(child => child.content), [{ terminal: "b" }, { terminal: "c" }]);
  assert.equal(equalizeTree(root).changed, false);
});

test("perpendicular branches share their largest axis span rather than adding widths", () => {
  const root = {
    type: "row", children: [pane("a"), {
      type: "column", children: [pane("b"), {
        type: "row", children: [pane("c"), pane("d"), pane("e")],
      }],
    }],
  };
  assert.deepEqual(equalizeTree(root), { width: 4, height: 2, changed: true });
  assert.equal(root.children[0].size.weight, 1 / 4);
  assert.equal(root.children[1].size.weight, 3 / 4);
  for (const row of root.children[1].children) assert.equal(row.size.weight, 0.5);
  for (const child of root.children[1].children[1].children) assert.equal(child.size.weight, 1 / 3);
  assert.equal(equalizeTree(root).changed, false);
});
