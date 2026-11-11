// Initiative progress must use canonical observations and full, deduplicated executable membership.
import { describe, expect, test } from "bun:test";
import { initiativeProgress } from "../mods/shared-context/progress-model.js";

function snapshot(states: Record<string, string>) {
  return {
    tickets: Object.keys(states).map(id => ({ id, documentType: "ticket", status: "implemented", blockedBy: [] as string[] })),
    initiatives: [{ id: "release", ticketIds: Object.keys(states), group: false }],
    states: Object.fromEntries(Object.entries(states).map(([id, state]) => [id, { state }])),
  };
}

describe("initiative status composition", () => {
  test("deduplicates expanded membership, excludes planning and dependency-only tickets, and counts shared membership independently", () => {
    const data = snapshot({ parent: "DONE", child: "ACTIVE", shared: "BLOCKED", external: "DONE", plan: "DONE" });
    data.tickets.find(ticket => ticket.id === "parent")!.blockedBy = ["external"];
    data.tickets.find(ticket => ticket.id === "plan")!.documentType = "research";
    data.initiatives[0]!.ticketIds = ["parent", "child", "shared", "shared", "plan"];
    data.initiatives.push({ id: "other", ticketIds: ["shared"], group: false });
    data.initiatives.push({ id: "unassigned", ticketIds: ["external"], group: true });
    const progress = initiativeProgress(data);
    expect(progress.get("release")).toEqual({ total: 3, done: 1, active: 1, blocked: 1, ready: 0, unavailable: 0, percent: 33 });
    expect(progress.get("other")).toMatchObject({ total: 1, blocked: 1, done: 0 });
    expect(progress.has("unassigned")).toBe(false);
  });

  test("does not call recommended reviews or fixes active, or implemented tracker statuses complete", () => {
    const data = snapshot({ done: "DONE", owner: "ACTIVE", review: "REVIEW", fix: "FIX", finish: "FINISH", submit: "SUBMIT", new: "READY" });
    const progress = initiativeProgress(data).get("release");
    expect(progress).toEqual({ total: 7, done: 1, active: 1, blocked: 0, ready: 5, unavailable: 0, percent: 14 });
  });

  test("missing members and unreadable or unfamiliar states suppress completion estimates", () => {
    for (const state of ["ERROR", "UNKNOWN", "unrecognised", "constructor"]) {
      const data = snapshot({ done: "DONE", uncertain: state });
      expect(initiativeProgress(data).get("release")).toMatchObject({ total: 2, unavailable: 1, percent: null });
    }
    const missingState = snapshot({ done: "DONE", uncertain: "READY" });
    delete missingState.states.uncertain;
    expect(initiativeProgress(missingState).get("release")).toMatchObject({ unavailable: 1, percent: null });
    const missingMember = snapshot({ done: "DONE" });
    missingMember.initiatives[0]!.ticketIds.push("absent");
    expect(initiativeProgress(missingMember).get("release")).toMatchObject({ total: 2, unavailable: 1, percent: null });
  });

  test("distinguishes empty, not started and fully complete initiatives", () => {
    expect(initiativeProgress(snapshot({})).get("release")).toMatchObject({ total: 0, percent: null });
    expect(initiativeProgress(snapshot({ first: "READY", second: "READY" })).get("release")).toMatchObject({ total: 2, done: 0, percent: 0 });
    expect(initiativeProgress(snapshot({ first: "DONE", second: "DONE" })).get("release")).toMatchObject({ total: 2, done: 2, percent: 100 });
    const planningOnly = snapshot({ plan: "DONE" });
    planningOnly.tickets[0]!.documentType = "plan";
    expect(initiativeProgress(planningOnly).get("release")).toMatchObject({ total: 0, percent: null });
  });

  test("never rounds unfinished work up to 100 percent and recomputes changed observations", () => {
    const data = snapshot(Object.fromEntries(Array.from({ length: 200 }, (_, index) => [String(index), index === 199 ? "ACTIVE" : "DONE"])));
    expect(initiativeProgress(data).get("release")).toMatchObject({ total: 200, done: 199, percent: 99 });
    data.states["199"] = { state: "DONE" };
    expect(initiativeProgress(data).get("release")).toMatchObject({ done: 200, active: 0, percent: 100 });
  });
});
