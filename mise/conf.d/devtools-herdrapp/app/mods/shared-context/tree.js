// The tree shows initiative membership. Dependency edges belong in the graph views.
import { matchesFilters } from "./filter-model.js";

export function dependencyRows(snapshot, filters, collapsed) {
  const tickets = new Map(snapshot.tickets.map(ticket => [ticket.id, ticket]));
  const eligible = ticket => matchesFilters(snapshot.states?.[ticket.id]?.state, filters);
  const rows = [], canonical = new Map(), assigned = new Set();
  const add = (record, parent, depth, visible) => {
    const path = `${parent}/${record.id}`, reference = canonical.get(record.id);
    if (visible) rows.push({ type: "ticket", record, itemType: itemType(record), path, depth, reference, expanded: false, children: 0, state: ticketDisplayState(record, snapshot.states?.[record.id]), stale: record.fields?.stale === true });
    if (!reference) canonical.set(record.id, path);
  };
  const section = (id, title) => rows.push({ type: "section", record: { id, title }, path: `section:${id}`, depth: 0, expanded: true, children: 0 });
  const initiatives = filters.initiatives ? snapshot.initiatives.filter(item => !item.group) : [];
  if (initiatives.length) section("initiatives", "Initiatives");
  for (const initiative of initiatives) {
    const members = [...new Set(initiative.ticketIds)].map(id => {
      const ticket = tickets.get(id);
      if (!ticket) throw new Error(`Missing initiative member ${id}.`);
      assigned.add(id);
      return ticket;
    }).filter(ticket => eligible(ticket) && itemType(ticket) === "ticket");
    const path = `initiative:${initiative.id}`, expanded = !collapsed.has(path);
    rows.push({ type: "initiative", itemType: "initiative", record: initiative, path, depth: 0, expanded, children: members.length });
    for (const member of members) add(member, path, 1, expanded);
  }
  const groups = new Map();
  for (const ticket of snapshot.tickets) {
    const type = itemType(ticket);
    if (!eligible(ticket) || type === "ticket" && assigned.has(ticket.id)) continue;
    if (!groups.has(type)) groups.set(type, []);
    groups.get(type).push(ticket);
  }
  for (const type of ["ticket", "prototype", "research", "planning", "record"]) {
    const members = groups.get(type);
    if (!members?.length) continue;
    section(type, { ticket: "Other tickets", prototype: "Prototypes", research: "Research", planning: "Planning", record: "Records" }[type]);
    for (const member of members) add(member, `section:${type}`, 0, true);
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
