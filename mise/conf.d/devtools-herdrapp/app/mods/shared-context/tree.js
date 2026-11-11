// Repeated dependency paths point to one canonical record, including beneath collapsed rows.
export function dependencyRows(snapshot, queue, collapsed) {
  const tickets = new Map(snapshot.tickets.map(ticket => [ticket.id, ticket]));
  const eligible = ticket => queue === "initiatives" || queue === "all" || (queue === "ready" ? snapshot.states[ticket.id]?.state === "READY" : queue === "review" ? ["REVIEW", "FIX", "FINISH", "SUBMIT"].includes(snapshot.states[ticket.id]?.state) : ["BLOCKED", "ERROR", "UNKNOWN"].includes(snapshot.states[ticket.id]?.state));
  const rows = [], canonical = new Map(), assigned = new Set();
  const requiredBy = members => {
    const required = new Set(), visited = new Set(), chain = new Set();
    const collect = id => {
      if (chain.has(id)) throw new Error(`Dependency cycle at ${id}.`);
      const record = tickets.get(id);
      if (!record) throw new Error(`Missing prerequisite ${id}.`);
      if (visited.has(id)) return;
      chain.add(id);
      for (const blocker of record.blockedBy) { required.add(blocker); collect(blocker); }
      chain.delete(id); visited.add(id);
    };
    for (const member of members) collect(member.id);
    return required;
  };
  const add = (record, parent, depth, visible) => {
    const path = `${parent}/${record.id}`, reference = canonical.get(record.id), expanded = !collapsed.has(path);
    if (visible) rows.push({ type: "ticket", record, itemType: itemType(record), path, depth, reference, expanded, children: reference ? 0 : record.blockedBy.length, state: ticketDisplayState(record, snapshot.states?.[record.id]), context: !eligible(record) });
    if (reference) return;
    canonical.set(record.id, path);
    for (const blocker of record.blockedBy) add(tickets.get(blocker), path, depth + 1, visible && expanded);
  };
  const section = (id, title) => rows.push({ type: "section", record: { id, title }, path: `section:${id}`, depth: 0, expanded: true, children: 0 });
  const initiatives = snapshot.initiatives.filter(item => !item.group);
  if (initiatives.length) section("initiatives", "Initiatives");
  for (const initiative of initiatives) {
    const members = [...new Set(initiative.ticketIds)].map(id => {
      const ticket = tickets.get(id);
      if (!ticket) throw new Error(`Missing initiative member ${id}.`);
      assigned.add(id);
      return ticket;
    }).filter(ticket => eligible(ticket) && itemType(ticket) === "ticket");
    const required = requiredBy(members), roots = members.filter(member => !required.has(member.id));
    const path = `initiative:${initiative.id}`, expanded = !collapsed.has(path);
    rows.push({ type: "initiative", itemType: "initiative", record: initiative, path, depth: 0, expanded, children: roots.length });
    for (const member of roots) add(member, path, 1, expanded);
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
    const required = requiredBy(members);
    for (const member of members) if (!required.has(member.id)) add(member, `section:${type}`, 0, true);
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
  if (["spec", "specification", "initiative", "plan"].includes(type)) return "planning";
  return "record";
}

export function revealPath(collapsed, path) {
  for (const ancestor of [...collapsed]) if (path === ancestor || path.startsWith(`${ancestor}/`)) collapsed.delete(ancestor);
}
