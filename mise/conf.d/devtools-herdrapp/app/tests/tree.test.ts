import { describe, expect, test } from "bun:test";
import { dependencyRows, revealPath } from "../mods/shared-context/tree.js";

function diamond() {
  const ticket = (id: string, blockedBy: string[]) => ({ id, title: id, blockedBy, status: "proposed", ref: `tracker/tickets/${id}.md` });
  return {
    tickets: [ticket("top", ["left", "right"]), ticket("left", ["base"]), ticket("right", ["base"]), ticket("base", [])],
    initiatives: [{ id: "release", title: "Release", ticketIds: ["top", "left", "right", "base"], rootTicketIds: ["top"] }],
    states: { top: { state: "BLOCKED" }, left: { state: "READY" }, right: { state: "READY" }, base: { state: "READY" } },
  };
}

describe("dependency tree", () => {
  test("keeps one canonical record when two branches share a prerequisite", () => {
    const { rows, canonical } = dependencyRows(diamond(), "all", new Set());
    const base = rows.filter(row => row.record.id === "base");
    expect(base.map(row => row.reference)).toEqual([undefined, canonical.get("base")]);
    expect(rows.filter(row => row.type === "ticket" && row.depth === 1).map(row => row.record.id)).toEqual(["top"]);
    expect(canonical.get("base")).toBe("initiative:release/top/left/base");
  });

  test("reveals a canonical record below a collapsed branch", () => {
    const collapsed = new Set(["initiative:release/top/left"]);
    const forest = dependencyRows(diamond(), "all", collapsed);
    const reference = forest.rows.find(row => row.record.id === "base")!;
    expect(reference.reference).toBe("initiative:release/top/left/base");
    revealPath(collapsed, reference.reference!);
    const visible = dependencyRows(diamond(), "all", collapsed).rows.find(row => row.path === reference.reference)!;
    expect(visible.record.id).toBe("base");
    expect(visible.reference).toBeUndefined();
  });

  test("retains prerequisites as context in a filtered queue", () => {
    const rows = dependencyRows(diamond(), "blocked", new Set()).rows.filter(row => row.type === "ticket");
    expect(rows.map(row => [row.record.id, row.context])).toEqual([["top", false], ["left", true], ["base", true], ["right", true], ["base", true]]);
  });

  test("keeps planning initiatives visible before tickets exist", () => {
    const snapshot = diamond();
    snapshot.initiatives.push({ id: "planning", title: "Planning", ticketIds: [], rootTicketIds: [] });
    const rows = dependencyRows(snapshot, "initiatives", new Set()).rows;
    expect(rows.find(row => row.type === "initiative" && row.record.id === "planning")?.children).toBe(0);
  });

  test("reports cycles and missing prerequisites instead of hiding them", () => {
    const cycle = diamond();
    cycle.tickets[3]!.blockedBy = ["top"];
    expect(() => dependencyRows(cycle, "all", new Set(["initiative:release"]))).toThrow("Dependency cycle");
    const missing = diamond();
    missing.tickets[3]!.blockedBy = ["absent"];
    expect(() => dependencyRows(missing, "all", new Set())).toThrow("Missing prerequisite absent");
  });
});
