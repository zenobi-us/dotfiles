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
  test("shows shared blockers once per initiative and puts non-ticket types below initiatives", () => {
    const { rows } = dependencyRows(diamond(), "all", new Set());
    expect(rows.filter(row => row.type === "ticket").map(row => row.record.id)).toEqual(["top", "left", "right", "base", "prototype"]);
    expect(rows.filter(row => row.type === "section").map(row => row.record.id)).toEqual(["initiatives", "prototype"]);
    expect(rows.find(row => row.record.id === "prototype" && row.type === "ticket")?.depth).toBe(0);
  });

  test("reveals shared membership below a collapsed initiative", () => {
    const snapshot = diamond();
    snapshot.initiatives.push({ id: "other", title: "Other", ticketIds: ["base"], rootTicketIds: ["base"] });
    const collapsed = new Set(["initiative:release"]);
    const forest = dependencyRows(snapshot, "all", collapsed);
    const reference = forest.rows.find(row => row.type === "ticket" && row.record.id === "base")!;
    expect(reference.reference).toBe(forest.canonical.get("base"));
    revealPath(collapsed, reference.reference!);
    const visible = dependencyRows(snapshot, "all", collapsed).rows.filter(row => row.type === "ticket" && row.record.id === "base");
    expect(visible.map(row => Boolean(row.reference))).toEqual([false, true]);
  });

  test("filters member tickets without hiding planning initiatives", () => {
    const snapshot = diamond();
    snapshot.initiatives.push({ id: "planning", title: "Planning", ticketIds: [], rootTicketIds: [] });
    const rows = dependencyRows(snapshot, "blocked", new Set()).rows;
    expect(rows.filter(row => row.type === "ticket").map(row => row.record.id)).toEqual(["top"]);
    expect(rows.some(row => row.type === "initiative" && row.record.id === "planning")).toBe(true);
  });

  test("does not present synthetic collections as initiatives", () => {
    const snapshot = { ...diamond(), initiatives: [{ id: "ungrouped", title: "Ungrouped", ticketIds: ["top"], group: true as const }] };
    const rows = dependencyRows(snapshot, "all", new Set()).rows;
    expect(rows.some(row => row.type === "initiative")).toBe(false);
    expect(rows.filter(row => row.type === "ticket").map(row => row.record.id)).toEqual(["top", "left", "right", "base", "prototype"]);
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
