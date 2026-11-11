import { describe, expect, test } from "bun:test";
import { dependencyRows, revealPath } from "../mods/shared-context/tree.js";
import { dependencyGraph } from "../mods/shared-context/graph.js";

function diamond() {
  const ticket = (id: string, blockedBy: string[], documentType = "ticket") => ({ id, title: id, blockedBy, documentType, status: "proposed", ref: `tracker/tickets/${id}.md` });
  return {
    tickets: [ticket("top", ["left", "right"]), ticket("left", ["base"]), ticket("right", ["base"]), ticket("base", []), ticket("prototype", [], "prototype")],
    initiatives: [{ id: "release", title: "Release", ticketIds: ["top", "left", "right", "base", "prototype"], rootTicketIds: ["top"] }],
    states: { top: { state: "BLOCKED" }, left: { state: "READY" }, right: { state: "READY" }, base: { state: "READY" } },
  };
}

describe("grouped tracker tree", () => {
  test("nests dependency paths and keeps shared prerequisites as navigable references", () => {
    const { rows, canonical } = dependencyRows(diamond(), "all", new Set());
    const tickets = rows.filter(row => row.type === "ticket");
    expect(tickets.map(row => [row.record.id, row.depth, row.children])).toEqual([
      ["top", 1, 2], ["left", 2, 1], ["base", 3, 0], ["right", 2, 1], ["base", 3, 0], ["prototype", 0, 0],
    ]);
    expect(tickets[4]!.reference).toBe("initiative:release/top/left/base");
    expect(canonical.get("base")).toBe(tickets[2]!.path);
    expect(rows.filter(row => row.type === "section").map(row => row.record.id)).toEqual(["initiatives", "prototype"]);
    expect(tickets[5]!.path).toBe("section:prototype/prototype");
  });

  test("references reveal the canonical prerequisite beneath collapsed ancestors", () => {
    const collapsed = new Set(["initiative:release/top/left"]);
    const forest = dependencyRows(diamond(), "all", collapsed);
    const reference = forest.rows.find(row => row.type === "ticket" && row.record.id === "base")!;
    expect(reference.reference).toBe("initiative:release/top/left/base");
    revealPath(collapsed, reference.reference!);
    const visible = dependencyRows(diamond(), "all", collapsed).rows.filter(row => row.type === "ticket" && row.record.id === "base");
    expect(visible.map(row => [row.path, Boolean(row.reference)])).toEqual([
      ["initiative:release/top/left/base", false], ["initiative:release/top/right/base", true],
    ]);
  });

  test("keeps prerequisite context in filtered queues without hiding planning initiatives", () => {
    const snapshot = diamond();
    snapshot.initiatives.push({ id: "planning", title: "Planning", ticketIds: [], rootTicketIds: [] });
    const rows = dependencyRows(snapshot, "blocked", new Set()).rows;
    expect(rows.filter(row => row.type === "ticket" && !row.context).map(row => row.record.id)).toEqual(["top"]);
    expect(rows.filter(row => row.type === "ticket" && row.context).map(row => row.record.id)).toEqual(["left", "base", "right", "base"]);
    expect(rows.some(row => row.type === "initiative" && row.record.id === "planning")).toBe(true);
  });

  test("does not present synthetic collections as initiatives", () => {
    const snapshot = { ...diamond(), initiatives: [{ id: "ungrouped", title: "Ungrouped", ticketIds: ["top"], group: true as const }] };
    const rows = dependencyRows(snapshot, "all", new Set()).rows;
    expect(rows.some(row => row.type === "initiative")).toBe(false);
    expect(rows.filter(row => row.type === "ticket").map(row => [row.record.id, row.depth])).toEqual([["top", 0], ["left", 1], ["base", 2], ["right", 1], ["base", 2], ["prototype", 0]]);
  });

  test("reports cycles and missing records even below collapsed paths", () => {
    const cycle = diamond();
    cycle.tickets[3]!.blockedBy = ["top"];
    expect(() => dependencyRows(cycle, "all", new Set(["initiative:release"]))).toThrow("Dependency cycle");
    const missing = diamond();
    missing.tickets[3]!.blockedBy = ["absent"];
    expect(() => dependencyRows(missing, "all", new Set(["initiative:release"]))).toThrow("Missing prerequisite absent");
    const missingMember = diamond();
    missingMember.initiatives[0]!.ticketIds.push("absent");
    expect(() => dependencyRows(missingMember, "all", new Set())).toThrow("Missing initiative member absent");
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
