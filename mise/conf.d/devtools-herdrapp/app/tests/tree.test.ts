import { describe, expect, test } from "bun:test";
import { dependencyRows, revealPath } from "../mods/shared-context/tree.js";
import { dependencyGraph } from "../mods/shared-context/graph.js";
import { DEFAULT_FILTERS, filterRestrictions } from "../mods/shared-context/filter-model.js";

function diamond() {
  const ticket = (id: string, blockedBy: string[], documentType = "ticket") => ({ id, title: id, blockedBy, documentType, status: "proposed", ref: `tracker/tickets/${id}.md` });
  return {
    tickets: [ticket("top", ["left", "right"]), ticket("left", ["base"]), ticket("right", ["base"]), ticket("base", []), ticket("prototype", [], "prototype")],
    initiatives: [{ id: "release", title: "Release", ticketIds: ["top", "left", "right", "base", "prototype"], rootTicketIds: ["top"] }],
    states: { top: { state: "BLOCKED" }, left: { state: "READY" }, right: { state: "READY" }, base: { state: "READY" } },
  };
}

describe("grouped tracker tree", () => {
  test("shows each initiative member once as a leaf regardless of dependency edges", () => {
    const { rows, canonical } = dependencyRows(diamond(), DEFAULT_FILTERS, new Set());
    const tickets = rows.filter(row => row.type === "ticket");
    expect(tickets.map(row => [row.record.id, row.depth, row.children, row.expanded])).toEqual([
      ["top", 1, 0, false], ["left", 1, 0, false], ["right", 1, 0, false], ["base", 1, 0, false], ["prototype", 0, 0, false],
    ]);
    expect(canonical.get("base")).toBe("initiative:release/base");
  });

  test("shared initiative membership reveals the canonical initiative, not a dependency chain", () => {
    const snapshot = diamond();
    snapshot.initiatives.push({ id: "second", title: "Second", ticketIds: ["base"], rootTicketIds: ["base"] });
    const collapsed = new Set(["initiative:release"]);
    const forest = dependencyRows(snapshot, DEFAULT_FILTERS, collapsed);
    const reference = forest.rows.find(row => row.type === "ticket" && row.record.id === "base")!;
    expect(reference.reference).toBe("initiative:release/base");
    revealPath(collapsed, reference.reference!);
    const visible = dependencyRows(snapshot, DEFAULT_FILTERS, collapsed).rows.filter(row => row.type === "ticket" && row.record.id === "base");
    expect(visible.map(row => [row.path, Boolean(row.reference)])).toEqual([
      ["initiative:release/base", false], ["initiative:second/base", true],
    ]);
  });

  test("filters tickets without injecting prerequisites or hiding empty initiatives", () => {
    const snapshot = diamond();
    snapshot.initiatives.push({ id: "planning", title: "Planning", ticketIds: [], rootTicketIds: [] });
    const rows = dependencyRows(snapshot, { ...DEFAULT_FILTERS, ready: false, review: false }, new Set()).rows;
    expect(rows.filter(row => row.type === "ticket").map(row => row.record.id)).toEqual(["top"]);
    expect(rows.some(row => row.type === "initiative" && row.record.id === "planning")).toBe(true);
  });

  test("does not present synthetic collections as initiatives", () => {
    const snapshot = { ...diamond(), initiatives: [{ id: "ungrouped", title: "Ungrouped", ticketIds: ["top"], group: true as const }] };
    const rows = dependencyRows(snapshot, DEFAULT_FILTERS, new Set()).rows;
    expect(rows.some(row => row.type === "initiative")).toBe(false);
    expect(rows.filter(row => row.type === "ticket").map(row => [row.record.id, row.depth])).toEqual([["top", 0], ["left", 0], ["right", 0], ["base", 0], ["prototype", 0]]);
  });

  test("reports missing initiative members even when their initiative is collapsed", () => {
    const missingMember = diamond();
    missingMember.initiatives[0]!.ticketIds.push("absent");
    expect(() => dependencyRows(missingMember, DEFAULT_FILTERS, new Set(["initiative:release"]))).toThrow("Missing initiative member absent");
  });

  test("combines statuses with OR without duplicating dependency paths", () => {
    const snapshot = diamond();
    snapshot.states.left.state = "REVIEW";
    const filters = { ...DEFAULT_FILTERS, initiatives: false, blocked: false };
    const rows = dependencyRows(snapshot, filters, new Set()).rows;
    expect(rows.filter(row => row.type === "ticket").map(row => row.record.id)).toEqual(["left", "right", "base"]);
    expect(rows.some(row => row.record.id === "top")).toBe(false);
    expect(rows.some(row => row.type === "initiative")).toBe(false);
    expect(filterRestrictions(filters)).toBe(2);
  });

  test("unchecking every filter empties the tree and All restores completed records", () => {
    const snapshot = diamond();
    snapshot.tickets.push({ id: "done", title: "Done", blockedBy: [], documentType: "ticket", status: "completed", ref: "done.md" });
    expect(dependencyRows(snapshot, { initiatives: false, ready: false, review: false, blocked: false }, new Set()).rows).toEqual([]);
    const restored = dependencyRows(snapshot, DEFAULT_FILTERS, new Set()).rows;
    expect(restored.find(row => row.record.id === "done")?.state).toBe("DONE");
    expect(restored.some(row => row.record.id === "prototype")).toBe(true);
    const statusesOnly = dependencyRows(snapshot, { ...DEFAULT_FILTERS, initiatives: false }, new Set()).rows;
    expect(statusesOnly.some(row => row.record.id === "done")).toBe(false);
    expect(statusesOnly.some(row => row.record.id === "prototype")).toBe(false);
  });
});

describe("dependency graph", () => {
  test("keeps the transitive blocking lineage and excludes unrelated records", () => {
    const graph = dependencyGraph(diamond(), ["left"]);
    expect(graph.nodes.map(node => node.record.id)).toEqual(["base", "left"]);
    expect(graph.edges).toEqual([{ from: "base", to: "left" }]);
    expect(graph.nodes[0]!.x).toBeLessThan(graph.nodes[1]!.x);
  });

  test("deduplicates shared prerequisites and retains every dependency edge", () => {
    const graph = dependencyGraph(diamond(), ["top", "top"]);
    expect(graph.nodes.map(node => node.record.id)).toEqual(["base", "left", "right", "top"]);
    expect(graph.edges).toEqual([{ from: "base", to: "left" }, { from: "left", to: "top" }, { from: "base", to: "right" }, { from: "right", to: "top" }]);
  });

  test("reports cycles and missing prerequisites instead of drawing an incomplete graph", () => {
    const cycle = diamond();
    cycle.tickets[3]!.blockedBy = ["top"];
    expect(() => dependencyGraph(cycle, ["top"])).toThrow("Dependency cycle");
    const missing = diamond();
    missing.tickets[3]!.blockedBy = ["absent"];
    expect(() => dependencyGraph(missing, ["top"])).toThrow("Missing prerequisite absent");
  });
});
