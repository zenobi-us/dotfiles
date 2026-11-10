// A DAG can appear in a tree only if repeated nodes remain references to one record.
export function dependencyRows(snapshot, queue, collapsed) {
  const tickets = new Map(snapshot.tickets.map(ticket => [ticket.id, ticket]));
  const eligible = ticket => queue === "initiatives" || queue === "all" || (queue === "ready" ? snapshot.states[ticket.id]?.state === "READY" : queue === "review" ? ["REVIEW", "FIX", "FINISH", "SUBMIT"].includes(snapshot.states[ticket.id]?.state) : ["BLOCKED", "ERROR", "UNKNOWN"].includes(snapshot.states[ticket.id]?.state));
  const rows = [], canonical = new Map();
  for (const initiative of snapshot.initiatives) {
    const candidates = queue === "initiatives" ? initiative.rootTicketIds ?? initiative.ticketIds : initiative.ticketIds.filter(id => tickets.has(id) && eligible(tickets.get(id)));
    const required = new Set();
    function collect(id, chain = new Set()) {
      if (chain.has(id)) throw new Error(`Dependency cycle at ${id}.`);
      const ticket = tickets.get(id);
      if (!ticket) throw new Error(`Missing prerequisite ${id}.`);
      if (required.has(id)) return;
      required.add(id);
      for (const blocker of ticket.blockedBy) collect(blocker, new Set([...chain, id]));
    }
    candidates.forEach(id => tickets.get(id)?.blockedBy.forEach(blocker => collect(blocker)));
    const roots = [...new Set(candidates)].filter(id => !required.has(id));
    if (!roots.length && queue !== "initiatives" && queue !== "all") continue;
    const groupPath = `initiative:${initiative.id}`;
    rows.push({ type: "initiative", record: initiative, path: groupPath, depth: 0, expanded: !collapsed.has(groupPath), children: roots.length });
    function visit(id, parent, depth, visible, chain) {
      if (chain.has(id)) throw new Error(`Dependency cycle at ${id}.`);
      const ticket = tickets.get(id);
      if (!ticket) throw new Error(`Missing prerequisite ${id}.`);
      const path = `${parent}/${id}`, reference = canonical.get(id), expanded = !collapsed.has(path);
      if (visible) rows.push({ type: "ticket", record: ticket, path, depth, reference, expanded, children: reference ? 0 : ticket.blockedBy.length, state: snapshot.states[id]?.state ?? ticket.status, context: !eligible(ticket) });
      if (reference) return;
      canonical.set(id, path);
      // Record canonical paths even below a collapsed row, so references can reveal it.
      for (const blocker of ticket.blockedBy) visit(blocker, path, depth + 1, visible && expanded, new Set([...chain, id]));
    }
    for (const root of roots) visit(root, groupPath, 1, !collapsed.has(groupPath), new Set());
  }
  return { rows, canonical };
}

export function revealPath(collapsed, path) {
  for (const ancestor of [...collapsed]) if (path === ancestor || path.startsWith(`${ancestor}/`)) collapsed.delete(ancestor);
}
