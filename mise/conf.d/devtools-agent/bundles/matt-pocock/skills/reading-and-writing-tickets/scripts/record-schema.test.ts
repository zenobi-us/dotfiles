import { expect, test } from "bun:test";
import { assertRecord, INITIATIVE_SCHEMA, TICKET_SCHEMA, validateInitiativeMembership, validateRecord } from "./record-schema.ts";

const ticket = { schema: TICKET_SCHEMA, id: "T-1", title: "Implement", work_status: "unclaimed", blocked_by: [] };

test("versioned records preserve custom fields without mutation", () => {
  const fields = { ...ticket, parent: "release", sequence: 1, custom: { labels: ["team"] } };
  const before = structuredClone(fields);
  expect(validateRecord(fields, "ticket", { expectedId: "T-1" })).toEqual([]);
  assertRecord(fields, "ticket");
  expect(fields).toEqual(before);
  for (const work_status of ["unclaimed", "claimed", "implemented", "merged", "completed"]) expect(validateRecord({ ...ticket, work_status }, "ticket")).toEqual([]);
});

test("legacy reads opt in and unknown or wrong-kind schemas never bypass validation", () => {
  expect(validateRecord({ id: 12, work_status: "open" }, "ticket", { allowLegacy: true })).toEqual([]);
  expect(validateRecord({}, "ticket")).not.toEqual([]);
  for (const schema of ["tracker-ticket/v2", INITIATIVE_SCHEMA, "", null, 1]) {
    expect(validateRecord({ ...ticket, schema }, "ticket", { allowLegacy: true })).not.toEqual([]);
    expect(() => assertRecord({ ...ticket, schema }, "ticket", { allowLegacy: true })).toThrow("schema");
  }
});

test("malformed versioned ticket fields and path identity mismatch are rejected", () => {
  const invalid = [
    { id: 1 }, { title: " " }, { work_status: "open" }, { work_status: null },
    { blocked_by: "T-2" }, { blocked_by: [2] }, { blocked_by: [""] },
    { parent: null }, { parent: 1 }, { sequence: 0 }, { sequence: 1.5 }, { sequence: Infinity }, { sequence: "1" },
  ];
  for (const fields of invalid) expect(validateRecord({ ...ticket, ...fields }, "ticket")).not.toEqual([]);
  expect(validateRecord(ticket, "ticket", { expectedId: "T-2" }).join(" ")).toContain("filename");
  const { blocked_by, ...missingBlockers } = ticket;
  expect(validateRecord(missingBlockers, "ticket").join(" ")).toContain("blocked_by");
});

test("initiatives require identity and title but forbid ticket execution fields", () => {
  const initiative = { schema: INITIATIVE_SCHEMA, id: "release", title: "Release" };
  expect(validateRecord(initiative, "initiative", { expectedId: "release" })).toEqual([]);
  for (const fields of [{ id: "" }, { title: 1 }, { work_status: null }, { blocked_by: [] }]) expect(validateRecord({ ...initiative, ...fields }, "initiative")).not.toEqual([]);
});

test("initiative index membership agrees with direct parents, not descendants", () => {
  const tickets = [{ id: "A", parent: "release" }, { id: "B", parent: "A" }];
  expect(validateInitiativeMembership("release", ["A"], tickets)).toEqual([]);
  expect(validateInitiativeMembership("release", [], tickets).join(" ")).toContain("missing ticket A");
  expect(validateInitiativeMembership("release", ["A", "B"], tickets).join(" ")).toContain("direct parent");
  expect(validateInitiativeMembership("release", ["A", "missing"], tickets)).not.toEqual([]);
});
