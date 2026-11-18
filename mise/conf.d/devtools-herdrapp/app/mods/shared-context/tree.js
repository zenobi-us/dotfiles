// Grouping changes presentation only. Dependency edges stay in graph views.
import { matchesFilters, STATUS_FILTERS, statusFilterKey } from "./filter-model.js";

export function dependencyRows(snapshot, filters, collapsed) {
  const tickets = new Map(snapshot.tickets.map(ticket => [ticket.id, ticket]));
  const eligible = ticket => matchesFilters(ticketDisplayState(ticket, snapshot.states?.[ticket.id]), filters);
  const rows = [], canonical = new Map(), assigned = new Set();
  const add = (record, parent, depth, visible) => {
    const path = `${parent}/${record.id}`, reference = canonical.get(record.id);
    if (visible) rows.push({ type: "ticket", record, itemType: itemType(record), path, depth, reference, expanded: false, children: 0, state: ticketDisplayState(record, snapshot.states?.[record.id]), stale: record.fields?.stale === true });
    if (!reference) canonical.set(record.id, path);
  };
  const section = (id, title) => rows.push({ type: "section", record: { id, title }, path: `section:${id}`, depth: 0, expanded: true, children: 0 });
  const initiatives = filters.groupBy === "initiative" ? snapshot.initiatives.filter(item => !item.group) : [];
  const showEmptyInitiatives = STATUS_FILTERS.every(([key]) => filters[key]);
  for (const initiative of initiatives) {
    const members = [...new Set(initiative.ticketIds)].map(id => {
      const ticket = tickets.get(id);
      if (!ticket) throw new Error(`Missing initiative member ${id}.`);
      assigned.add(id);
      return ticket;
    }).filter(ticket => eligible(ticket) && itemType(ticket) === "ticket");
    if (!members.length && !showEmptyInitiatives) continue;
    if (!rows.length) section("initiatives", "Initiatives");
    const path = `initiative:${initiative.id}`, expanded = !collapsed.has(path);
    rows.push({ type: "initiative", itemType: "initiative", record: initiative, path, depth: 0, expanded, children: members.length });
    for (const member of members) add(member, path, 1, expanded);
  }
  const groups = new Map();
  for (const ticket of snapshot.tickets) {
    const type = itemType(ticket);
    if (!eligible(ticket) || type === "ticket" && assigned.has(ticket.id)) continue;
    if (filters.groupBy === "none") { add(ticket, "flat", 0, true); continue; }
    const key = filters.groupBy === "status" ? statusFilterKey(ticketDisplayState(ticket, snapshot.states?.[ticket.id])) : type;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(ticket);
  }
  const headings = filters.groupBy === "status" ? STATUS_FILTERS : [
    ["ticket", filters.groupBy === "initiative" ? "Unassigned tickets" : "Tickets"],
    ["prototype", "Prototypes"], ["research", "Research"], ["planning", "Planning"], ["record", "Records"],
  ];
  for (const [key, title] of headings) {
    const members = groups.get(key);
    if (!members?.length) continue;
    const id = `${filters.groupBy}:${key}`;
    section(id, title);
    for (const member of members) add(member, `section:${id}`, 0, true);
  }
  return { rows, canonical };
}

// Missing finish receipts require recovery, but do not reopen a completed tracker record.
export function ticketDisplayState(ticket, workflowState) {
  const status = ticket.status?.trim().toLowerCase();
  return ["completed", "done", "closed", "resolved", "complete"].includes(status) ? "DONE" : workflowState?.state ?? ticket.status;
}

export function itemType(ticket) {
  const type = ticket.documentType?.trim().toLowerCase();
  if (!type || ["ticket", "issue", "task", "bug", "fix", "feature", "enhancement", "chore"].includes(type)) return "ticket";
  if (["prototype", "research"].includes(type)) return type;
  if (["spec", "specification", "initiative", "plan", "epic"].includes(type)) return "planning";
  return "record";
}

export function revealPath(collapsed, path) {
  for (const ancestor of [...collapsed]) if (path === ancestor || path.startsWith(`${ancestor}/`)) collapsed.delete(ancestor);
}
